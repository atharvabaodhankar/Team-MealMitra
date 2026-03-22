const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabaseClient');
const { authenticateUser } = require('../middleware/authMiddleware');
const { ngoOnly } = require('../middleware/roleGuards');
const { sendDeliveryAlert, sendCompletionNotice } = require('../services/notificationService');
const { sendDeliveryAssignedEmail, sendDeliveryCompletedEmail } = require('../services/emailService');
const { setVolunteerBusy, setVolunteerAvailable } = require('../services/volunteerService');

router.post('/', authenticateUser, ngoOnly, async (req, res) => {
  try {
    const { claim_id, volunteer_id } = req.body;

    if (!claim_id) {
      return res.status(400).json({
        error: 'Missing required field: claim_id'
      });
    }

    const { data: ngo } = await supabaseAdmin
      .from('ngos')
      .select('ngo_id, ngo_name')
      .eq('profile_id', req.user.id)
      .single();

    if (!ngo) {
      return res.status(404).json({
        error: 'NGO profile not found'
      });
    }

    const { data: claim } = await supabaseAdmin
      .from('ngo_claims')
      .select('*')
      .eq('claim_id', claim_id)
      .eq('ngo_id', ngo.ngo_id)
      .single();

    if (!claim) {
      return res.status(404).json({
        error: 'Claim not found or access denied'
      });
    }

    const { data: existing } = await supabaseAdmin
      .from('deliveries')
      .select('delivery_id')
      .eq('claim_id', claim_id)
      .single();

    if (existing) {
      return res.status(409).json({
        error: 'Delivery already assigned for this claim'
      });
    }

    if (volunteer_id) {
      const { data: volunteer } = await supabaseAdmin
        .from('volunteers')
        .select('volunteer_id, full_name')
        .eq('volunteer_id', volunteer_id)
        .eq('ngo_id', ngo.ngo_id)
        .single();

      if (!volunteer) {
        return res.status(404).json({
          error: 'Volunteer not found or does not belong to your NGO'
        });
      }
    }

    const { data: delivery, error } = await supabaseAdmin
      .from('deliveries')
      .insert({
        claim_id,
        volunteer_id: volunteer_id || null,
        delivery_status: 'assigned'
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Failed to create delivery',
        message: error.message
      });
    }

    if (volunteer_id) {
      const { data: volunteer } = await supabaseAdmin
        .from('volunteers')
        .select('full_name, phone')
        .eq('volunteer_id', volunteer_id)
        .single();

      // Mark volunteer as busy so they won't be double-assigned
      setVolunteerBusy(volunteer_id).catch(err =>
        console.error('[DELIVERIES] Failed to mark volunteer busy:', err)
      );

      sendDeliveryAlert(req.user.phone, volunteer.full_name, 'assigned').catch(err => {
        console.error('Failed to send delivery alert:', err);
      });

      (async () => {
        try {
          const { data: volProfile } = await supabaseAdmin
            .from('volunteers')
            .select('full_name, phone, profile_id, profiles(email)')
            .eq('volunteer_id', volunteer_id)
            .single();

          const volEmail = volProfile?.profiles?.email;
          if (volEmail) {
            const { data: claimDetails } = await supabaseAdmin
              .from('ngo_claims')
              .select(`
                food_listings(
                  food_type, quantity_kg, pickup_address,
                  donors(profiles(full_name, organization_name, phone))
                )
              `)
              .eq('claim_id', claim_id)
              .single();

            const fl = claimDetails?.food_listings;
            const donorInfo = fl?.donors?.profiles;

            sendDeliveryAssignedEmail({
              to: volEmail,
              volunteerName: volProfile.full_name || 'Volunteer',
              ngoName: ngo.ngo_name || 'NGO',
              ngoPhone: req.user.phone || 'N/A',
              donorName: donorInfo?.organization_name || donorInfo?.full_name || 'Donor',
              donorPhone: donorInfo?.phone || 'N/A',
              foodType: fl?.food_type || 'Food',
              quantity: String(fl?.quantity_kg || '0'),
              pickupAddress: fl?.pickup_address || 'N/A',
              deliveryStatus: 'Assigned',
            }).catch(err => console.error('[DELIVERIES] Delivery assignment email failed:', err.message));
          }
        } catch (emailErr) {
          console.error('[DELIVERIES] Error sending assignment email:', emailErr.message);
        }
      })();
    }

    res.status(201).json({
      message: 'Delivery assigned successfully',
      delivery
    });

  } catch (error) {
    console.error('Create delivery error:', error);
    res.status(500).json({
      error: 'Failed to create delivery',
      message: error.message
    });
  }
});

router.get('/my', authenticateUser, ngoOnly, async (req, res) => {
  try {
    const { status } = req.query;

    const { data: ngo } = await supabaseAdmin
      .from('ngos')
      .select('ngo_id')
      .eq('profile_id', req.user.id)
      .single();

    if (!ngo) {
      return res.status(404).json({
        error: 'NGO profile not found'
      });
    }

    let query = supabaseAdmin
      .from('deliveries')
      .select(`
        *,
        volunteers (
          full_name,
          phone,
          vehicle_type
        ),
        ngo_claims!inner (
          ngo_id,
          listing_id,
          food_listings (
            food_type,
            quantity_kg,
            pickup_address,
            latitude,
            longitude,
            donors (
              profiles (
                organization_name,
                phone
              )
            )
          )
        )
      `)
      .eq('ngo_claims.ngo_id', ngo.ngo_id);

    if (status) {
      query = query.eq('delivery_status', status);
    }

    query = query.order('created_at', { ascending: false });

    const { data: deliveries, error } = await query;

    if (error) {
      return res.status(500).json({
        error: 'Failed to fetch deliveries',
        message: error.message
      });
    }

    res.json({
      deliveries,
      count: deliveries.length
    });

  } catch (error) {
    console.error('Get deliveries error:', error);
    res.status(500).json({
      error: 'Failed to get deliveries',
      message: error.message
    });
  }
});

router.get('/:delivery_id', authenticateUser, async (req, res) => {
  try {
    const { delivery_id } = req.params;

    const { data: delivery, error } = await supabaseAdmin
      .from('deliveries')
      .select(`
        *,
        volunteers (
          full_name,
          phone,
          vehicle_type
        ),
        ngo_claims (
          *,
          ngos (
            ngo_name,
            contact_person
          ),
          food_listings (
            *,
            donors (
              profiles (
                organization_name,
                phone
              )
            )
          )
        )
      `)
      .eq('delivery_id', delivery_id)
      .single();

    if (error || !delivery) {
      return res.status(404).json({
        error: 'Delivery not found'
      });
    }

    res.json({
      delivery
    });

  } catch (error) {
    console.error('Get delivery error:', error);
    res.status(500).json({
      error: 'Failed to get delivery',
      message: error.message
    });
  }
});

router.put('/:delivery_id/status', authenticateUser, ngoOnly, async (req, res) => {
  try {
    const { delivery_id } = req.params;
    const { status, pickup_time, delivery_time, proof_image_url } = req.body;

    if (!status) {
      return res.status(400).json({
        error: 'Missing required field: status'
      });
    }

    const validStatuses = ['assigned', 'in_transit', 'delivered', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        valid_statuses: validStatuses
      });
    }

    const { data: ngo } = await supabaseAdmin
      .from('ngos')
      .select('ngo_id')
      .eq('profile_id', req.user.id)
      .single();

    if (!ngo) {
      return res.status(404).json({
        error: 'NGO profile not found'
      });
    }

    const { data: existingDelivery } = await supabaseAdmin
      .from('deliveries')
      .select(`
        delivery_id,
        ngo_claims!inner (
          ngo_id,
          food_listings (
            food_type,
            quantity_kg,
            meal_equivalent
          )
        )
      `)
      .eq('delivery_id', delivery_id)
      .eq('ngo_claims.ngo_id', ngo.ngo_id)
      .single();

    if (!existingDelivery) {
      return res.status(404).json({
        error: 'Delivery not found or access denied'
      });
    }

    const updates = {
      delivery_status: status
    };

    if (pickup_time) updates.pickup_time = pickup_time;
    if (delivery_time) updates.delivery_time = delivery_time;
    if (proof_image_url) updates.proof_image_url = proof_image_url;

    if (status === 'in_transit' && !pickup_time) {
      updates.pickup_time = new Date().toISOString();
    }
    if (status === 'delivered' && !delivery_time) {
      updates.delivery_time = new Date().toISOString();
    }

    const { data: delivery, error } = await supabaseAdmin
      .from('deliveries')
      .update(updates)
      .eq('delivery_id', delivery_id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Failed to update delivery status',
        message: error.message
      });
    }

    // Free up the volunteer when delivery is done (either way)
    if ((status === 'delivered' || status === 'failed') && delivery.volunteer_id) {
      setVolunteerAvailable(delivery.volunteer_id).catch(err =>
        console.error('[DELIVERIES] Failed to mark volunteer available:', err)
      );
    }

    if (status === 'delivered') {
      const listing = existingDelivery.ngo_claims.food_listings;
      const co2Reduced = parseFloat(listing.quantity_kg) * 2.5;

      sendCompletionNotice(
        req.user.phone,
        listing.meal_equivalent,
        co2Reduced
      ).catch(err => {
        console.error('Failed to send completion notice:', err);
      });

      (async () => {
        try {
          const { data: fullDelivery } = await supabaseAdmin
            .from('deliveries')
            .select(`
              delivery_time,
              volunteers(full_name, phone),
              ngo_claims(
                ngo_id,
                ngos(ngo_name, profiles(email, phone)),
                food_listings(
                  food_type, quantity_kg, meal_equivalent, pickup_address,
                  donors(profiles(email, full_name, organization_name, phone))
                )
              )
            `)
            .eq('delivery_id', delivery_id)
            .single();

          if (!fullDelivery) return;

          const fl = fullDelivery.ngo_claims?.food_listings;
          const donorInfo = fl?.donors?.profiles;
          const ngoInfo = fullDelivery.ngo_claims?.ngos;
          const volInfo = fullDelivery.volunteers;
          const calcCo2 = parseFloat(fl?.quantity_kg || 0) * 2.5;

          const commonData = {
            donorName: donorInfo?.organization_name || donorInfo?.full_name || 'Donor',
            donorPhone: donorInfo?.phone || 'N/A',
            ngoName: ngoInfo?.ngo_name || 'NGO',
            ngoPhone: ngoInfo?.profiles?.phone || 'N/A',
            volunteerName: volInfo?.full_name || 'Volunteer',
            foodType: fl?.food_type || 'Food',
            quantity: String(fl?.quantity_kg || '0'),
            mealEquivalent: String(fl?.meal_equivalent || '0'),
            pickupAddress: fl?.pickup_address || 'N/A',
            deliveryStatus: 'Delivered',
            completedAt: fullDelivery.delivery_time ? new Date(fullDelivery.delivery_time).toLocaleString() : new Date().toLocaleString(),
            co2Saved: calcCo2.toFixed(2),
          };

          if (donorInfo?.email) {
            sendDeliveryCompletedEmail({
              to: donorInfo.email,
              recipientName: commonData.donorName,
              ...commonData,
            }).catch(err => console.error('[DELIVERIES] Completion email to donor failed:', err.message));
          }

          if (ngoInfo?.profiles?.email) {
            sendDeliveryCompletedEmail({
              to: ngoInfo.profiles.email,
              recipientName: commonData.ngoName,
              ...commonData,
            }).catch(err => console.error('[DELIVERIES] Completion email to NGO failed:', err.message));
          }

          console.log('[DELIVERIES] Delivery completion emails queued for donor & NGO');
        } catch (emailErr) {
          console.error('[DELIVERIES] Error sending completion emails:', emailErr.message);
        }
      })();

      try {
        const impactService = require('../services/impactService');
        await impactService.processCompletedDelivery(delivery_id);
        console.log('[DELIVERIES] Impact processed successfully for delivery:', delivery_id);
      } catch (impactErr) {
        console.error('[DELIVERIES] Error processing impact:', impactErr.message);
      }
    }

    res.json({
      message: 'Delivery status updated successfully',
      delivery
    });

  } catch (error) {
    console.error('Update delivery status error:', error);
    res.status(500).json({
      error: 'Failed to update delivery status',
      message: error.message
    });
  }
});

router.put('/:delivery_id/assign', authenticateUser, ngoOnly, async (req, res) => {
  try {
    const { delivery_id } = req.params;
    const { volunteer_id } = req.body;

    if (!volunteer_id) {
      return res.status(400).json({
        error: 'Missing required field: volunteer_id'
      });
    }

    const { data: ngo } = await supabaseAdmin
      .from('ngos')
      .select('ngo_id')
      .eq('profile_id', req.user.id)
      .single();

    if (!ngo) {
      return res.status(404).json({
        error: 'NGO profile not found'
      });
    }

    const { data: volunteer } = await supabaseAdmin
      .from('volunteers')
      .select('volunteer_id, full_name')
      .eq('volunteer_id', volunteer_id)
      .eq('ngo_id', ngo.ngo_id)
      .single();

    if (!volunteer) {
      return res.status(404).json({
        error: 'Volunteer not found or does not belong to your NGO'
      });
    }

    const { data: delivery, error } = await supabaseAdmin
      .from('deliveries')
      .update({
        volunteer_id
      })
      .eq('delivery_id', delivery_id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Failed to reassign volunteer',
        message: error.message
      });
    }

    res.json({
      message: 'Volunteer reassigned successfully',
      delivery
    });

  } catch (error) {
    console.error('Reassign volunteer error:', error);
    res.status(500).json({
      error: 'Failed to reassign volunteer',
      message: error.message
    });
  }
});

module.exports = router;