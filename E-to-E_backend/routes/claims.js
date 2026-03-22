const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabaseClient');
const { authenticateUser } = require('../middleware/authMiddleware');
const { ngoOnly } = require('../middleware/roleGuards');
const { sendClaimAlert, sendDeliveryAlert } = require('../services/notificationService');
const { findBestVolunteer } = require('../services/volunteerService');
const { sendClaimAcceptedEmail, sendDeliveryAssignedEmail } = require('../services/emailService');

router.post('/', authenticateUser, ngoOnly, async (req, res) => {
  try {
    const { listing_id, pickup_scheduled_time, strategy_notes } = req.body;
    console.log('[CLAIMS] POST /api/claims - Body:', JSON.stringify(req.body));

    if (!listing_id) {
      return res.status(400).json({ error: 'Missing required field: listing_id' });
    }

    const { data: ngo, error: ngoErr } = await supabaseAdmin
      .from('ngos')
      .select('ngo_id, ngo_name')
      .eq('profile_id', req.user.id)
      .single();

    if (ngoErr || !ngo) {
      console.error('[CLAIMS] NGO lookup error:', ngoErr);
      return res.status(404).json({ error: 'NGO profile not found' });
    }
    console.log('[CLAIMS] NGO found:', ngo.ngo_id, ngo.ngo_name);

    const { data: listing } = await supabaseAdmin
      .from('food_listings')
      .select(`
        listing_id, food_type, quantity_kg, pickup_address, status, is_locked, donor_id,
        donors!inner ( donor_id, profile_id, profiles ( phone, email, full_name, organization_name ) )
      `)
      .eq('listing_id', listing_id)
      .single();

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    console.log('[CLAIMS] Listing:', listing.listing_id, 'status:', listing.status, 'locked:', listing.is_locked);

    if (['claimed', 'completed', 'expired'].includes(listing.status)) {
      return res.status(400).json({ error: 'Listing is already occupied', current_status: listing.status });
    }

    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('claim_listing', {
      p_listing_id: listing_id,
      p_ngo_id: ngo.ngo_id,
      p_pickup_scheduled_time: pickup_scheduled_time || null,
      p_strategy_notes: strategy_notes || null
    });

    if (!rpcError && rpcResult && !rpcResult.error) {
      console.log('[CLAIMS] RPC success! Claim:', rpcResult.claim_id);

      try {
        const donorPhone = listing.donors?.profiles?.phone;
        if (donorPhone) {
          sendClaimAlert(donorPhone, ngo.ngo_name, listing.food_type).catch(() => { });
        }
      } catch (_) { }

      (async () => {
        try {
          let donorEmail = listing.donors?.profiles?.email;
          let donorDisplayName = listing.donors?.profiles?.organization_name || listing.donors?.profiles?.full_name || 'Donor';

          if (!donorEmail) {
            const { data: donorProfile } = await supabaseAdmin
              .from('donors')
              .select('profiles(email, full_name, organization_name)')
              .eq('donor_id', listing.donor_id || listing.donors?.donor_id)
              .single();
            donorEmail = donorProfile?.profiles?.email;
            donorDisplayName = donorProfile?.profiles?.organization_name || donorProfile?.profiles?.full_name || donorDisplayName;
          }

          if (donorEmail) {
            const { data: ngoFull } = await supabaseAdmin
              .from('ngos')
              .select('ngo_name, contact_person, profiles(phone)')
              .eq('ngo_id', ngo.ngo_id)
              .single();

            sendClaimAcceptedEmail({
              to: donorEmail,
              donorName: donorDisplayName,
              ngoName: ngo.ngo_name,
              ngoContact: ngoFull?.contact_person || ngo.ngo_name,
              ngoPhone: ngoFull?.profiles?.phone || 'N/A',
              foodType: listing.food_type,
              quantity: String(listing.quantity_kg || ''),
              pickupAddress: listing.pickup_address || 'N/A',
              pickupTime: pickup_scheduled_time ? new Date(pickup_scheduled_time).toLocaleString() : 'To be scheduled',
            }).catch(err => console.error('[CLAIMS] Claim email to donor failed:', err.message));
          }
        } catch (emailErr) {
          console.error('[CLAIMS] Error sending claim email:', emailErr.message);
        }
      })();

      let assignedDelivery = null;
      try {
        const bestVolunteer = await findBestVolunteer(ngo.ngo_id, listing.latitude, listing.longitude);
        if (bestVolunteer) {
          console.log('[CLAIMS] Auto-assigning volunteer:', bestVolunteer.full_name);
          const { data: delivery, error: delErr } = await supabaseAdmin
            .from('deliveries')
            .insert({
              claim_id: rpcResult.claim_id,
              volunteer_id: bestVolunteer.volunteer_id,
              delivery_status: 'assigned'
            })
            .select()
            .single();

          if (!delErr && delivery) {
            assignedDelivery = { ...delivery, volunteer: bestVolunteer };
            // Mark volunteer as busy to prevent double-assignment
            const { setVolunteerBusy } = require('../services/volunteerService');
            setVolunteerBusy(bestVolunteer.volunteer_id).catch(() => {});
            sendDeliveryAlert(ngo.phone || 'NGO_ADMIN', bestVolunteer.full_name, 'assigned').catch(() => { });
          }
        }
      } catch (volErr) {
        console.error('[CLAIMS] Auto-assignment failed:', volErr);
      }

      return res.status(201).json({
        message: 'Listing claimed successfully',
        claim: rpcResult,
        delivery: assignedDelivery
      });
    }

    const rpcMsg = rpcError?.message || rpcResult?.error || 'unknown';
    console.log('[CLAIMS] RPC unavailable or failed:', rpcMsg, '— using fallback');

    const { error: delErr } = await supabaseAdmin.from('ngo_claims').delete().eq('listing_id', listing_id);
    if (delErr) console.error('[CLAIMS] Delete claims error:', delErr.message);
    else console.log('[CLAIMS] Old claims deleted');

    const { error: lockErr } = await supabaseAdmin
      .from('food_listings')
      .update({ is_locked: true, status: 'claimed' })
      .eq('listing_id', listing_id);

    if (lockErr) {
      console.error('[CLAIMS] Lock error:', lockErr);
      return res.status(500).json({ error: 'Failed to lock listing', message: lockErr.message });
    }
    console.log('[CLAIMS] Listing locked');

    const { data: claim, error: claimErr } = await supabaseAdmin
      .from('ngo_claims')
      .insert({
        listing_id,
        ngo_id: ngo.ngo_id,
        pickup_scheduled_time: pickup_scheduled_time || null,
        strategy_notes: strategy_notes || null,
        status: 'claimed'
      })
      .select()
      .single();

    if (claimErr) {
      console.error('[CLAIMS] Insert error:', claimErr);
      await supabaseAdmin.from('food_listings').update({ is_locked: false, status: 'open' }).eq('listing_id', listing_id);
      return res.status(500).json({ error: 'Failed to create claim', message: claimErr.message });
    }
    console.log('[CLAIMS] Claim created:', claim.claim_id);

    try {
      const donorPhone = listing.donors?.profiles?.phone;
      if (donorPhone) {
        sendClaimAlert(donorPhone, ngo.ngo_name, listing.food_type).catch(() => { });
      }
    } catch (_) { }

    (async () => {
      try {
        const { data: donorProfile } = await supabaseAdmin
          .from('food_listings')
          .select('donor_id, food_type, quantity_kg, pickup_address, donors(profiles(email, full_name, organization_name))')
          .eq('listing_id', listing_id)
          .single();

        const dEmail = donorProfile?.donors?.profiles?.email;
        if (dEmail) {
          const { data: ngoFull } = await supabaseAdmin
            .from('ngos')
            .select('ngo_name, contact_person, profiles(phone)')
            .eq('ngo_id', ngo.ngo_id)
            .single();

          sendClaimAcceptedEmail({
            to: dEmail,
            donorName: donorProfile.donors.profiles.organization_name || donorProfile.donors.profiles.full_name || 'Donor',
            ngoName: ngo.ngo_name,
            ngoContact: ngoFull?.contact_person || ngo.ngo_name,
            ngoPhone: ngoFull?.profiles?.phone || 'N/A',
            foodType: donorProfile.food_type,
            quantity: String(donorProfile.quantity_kg || ''),
            pickupAddress: donorProfile.pickup_address || 'N/A',
            pickupTime: pickup_scheduled_time ? new Date(pickup_scheduled_time).toLocaleString() : 'To be scheduled',
          }).catch(err => console.error('[CLAIMS] Claim email to donor (fallback) failed:', err.message));
        }
      } catch (emailErr) {
        console.error('[CLAIMS] Error sending claim email (fallback):', emailErr.message);
      }
    })();

    let assignedDelivery = null;
    try {
      const bestVolunteer = await findBestVolunteer(ngo.ngo_id, listing.latitude, listing.longitude);
      if (bestVolunteer) {
        console.log('[CLAIMS] Auto-assigning volunteer (fallback):', bestVolunteer.full_name);
        const { data: delivery, error: delErr } = await supabaseAdmin
          .from('deliveries')
          .insert({
            claim_id: claim.claim_id,
            volunteer_id: bestVolunteer.volunteer_id,
            delivery_status: 'assigned'
          })
          .select()
          .single();

        if (!delErr && delivery) {
          assignedDelivery = { ...delivery, volunteer: bestVolunteer };
          const { setVolunteerBusy } = require('../services/volunteerService');
          setVolunteerBusy(bestVolunteer.volunteer_id).catch(() => {});
          sendDeliveryAlert(ngo.phone || 'NGO_ADMIN', bestVolunteer.full_name, 'assigned').catch(() => { });
        }
      }
    } catch (volErr) {
      console.error('[CLAIMS] Auto-assignment failed (fallback):', volErr);
    }

    return res.status(201).json({
      message: 'Listing claimed successfully',
      claim,
      delivery: assignedDelivery
    });

  } catch (error) {
    console.error('[CLAIMS] Unhandled error:', error);
    res.status(500).json({ error: 'Failed to claim listing', message: error.message });
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
      .from('ngo_claims')
      .select(`
        *,
        food_listings (
          *,
          donors (
            profiles (
              organization_name,
              phone
            )
          )
        )
      `)
      .eq('ngo_id', ngo.ngo_id);

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('acceptance_time', { ascending: false });

    const { data: claims, error } = await query;

    if (error) {
      return res.status(500).json({
        error: 'Failed to fetch claims',
        message: error.message
      });
    }

    res.json({
      claims,
      count: claims.length
    });

  } catch (error) {
    console.error('Get claims error:', error);
    res.status(500).json({
      error: 'Failed to get claims',
      message: error.message
    });
  }
});

router.get('/:claim_id', authenticateUser, async (req, res) => {
  try {
    const { claim_id } = req.params;

    const { data: claim, error } = await supabaseAdmin
      .from('ngo_claims')
      .select(`
        *,
        ngos (
          ngo_name,
          contact_person,
          profiles (
            phone
          )
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
      `)
      .eq('claim_id', claim_id)
      .single();

    if (error || !claim) {
      return res.status(404).json({
        error: 'Claim not found'
      });
    }

    if (req.user.role === 'ngo') {
      const { data: ngo } = await supabaseAdmin
        .from('ngos')
        .select('ngo_id')
        .eq('profile_id', req.user.id)
        .single();

      if (ngo && claim.ngo_id !== ngo.ngo_id) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }
    }

    if (req.user.role === 'donor') {
      const { data: donor } = await supabaseAdmin
        .from('donors')
        .select('donor_id')
        .eq('profile_id', req.user.id)
        .single();

      if (donor && claim.food_listings.donor_id !== donor.donor_id) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }
    }

    res.json({
      claim
    });

  } catch (error) {
    console.error('Get claim error:', error);
    res.status(500).json({
      error: 'Failed to get claim',
      message: error.message
    });
  }
});

router.put('/:claim_id', authenticateUser, ngoOnly, async (req, res) => {
  try {
    const { claim_id } = req.params;
    const { pickup_scheduled_time, strategy_notes, status } = req.body;

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

    const { data: existing } = await supabaseAdmin
      .from('ngo_claims')
      .select('ngo_id')
      .eq('claim_id', claim_id)
      .single();

    if (!existing || existing.ngo_id !== ngo.ngo_id) {
      return res.status(404).json({
        error: 'Claim not found or access denied'
      });
    }

    const updates = {};
    if (pickup_scheduled_time !== undefined) updates.pickup_scheduled_time = pickup_scheduled_time;
    if (strategy_notes !== undefined) updates.strategy_notes = strategy_notes;
    if (status !== undefined) updates.status = status;

    const { data: claim, error } = await supabaseAdmin
      .from('ngo_claims')
      .update(updates)
      .eq('claim_id', claim_id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Failed to update claim',
        message: error.message
      });
    }

    res.json({
      message: 'Claim updated successfully',
      claim
    });

  } catch (error) {
    console.error('Update claim error:', error);
    res.status(500).json({
      error: 'Failed to update claim',
      message: error.message
    });
  }
});

router.delete('/:claim_id', authenticateUser, ngoOnly, async (req, res) => {
  try {
    const { claim_id } = req.params;

    // Get ngo_id
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

    const { data: delivery } = await supabaseAdmin
      .from('deliveries')
      .select('delivery_id')
      .eq('claim_id', claim_id)
      .single();

    if (delivery) {
      return res.status(403).json({
        error: 'Cannot cancel claim after delivery has been assigned'
      });
    }

    const { error } = await supabaseAdmin
      .from('ngo_claims')
      .delete()
      .eq('claim_id', claim_id)
      .eq('ngo_id', ngo.ngo_id);

    if (error) {
      return res.status(500).json({
        error: 'Failed to cancel claim',
        message: error.message
      });
    }

    const { data: claim } = await supabaseAdmin
      .from('ngo_claims')
      .select('listing_id')
      .eq('claim_id', claim_id)
      .single();

    if (claim) {
      await supabaseAdmin
        .from('food_listings')
        .update({
          is_locked: false,
          status: 'open'
        })
        .eq('listing_id', claim.listing_id);
    }

    res.json({
      message: 'Claim cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel claim error:', error);
    res.status(500).json({
      error: 'Failed to cancel claim',
      message: error.message
    });
  }
});

module.exports = router;