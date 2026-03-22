const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabaseClient');
const { authenticateUser } = require('../middleware/authMiddleware');
const { donorOnly, adminOnly } = require('../middleware/roleGuards');
const { getDonorImpact } = require('../services/impactService');

router.get('/leaderboard', async (req, res) => {
  try {
    const { data: donors, error } = await supabaseAdmin
      .rpc('get_donor_leaderboard', { p_limit: 10 });

    if (error) {
      console.error('RPC Error:', error);
      throw error;
    }

    // Map the RPC response to camelCase for the frontend
    const leaderboard = (donors || []).map(d => ({
      rank: d.rank,
      donorId: d.donor_id,
      donorName: d.donor_name || d.organization_name || 'Anonymous Donor',
      totalMeals: d.total_meals || 0,
      totalFoodKg: parseFloat(d.total_food_kg) || 0,
      totalCo2Kg: parseFloat(d.total_co2_kg) || 0,
      totalValue: parseFloat(d.total_value) || 0,
      totalListings: d.total_listings || 0
    }));

    res.json(leaderboard);

  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard data' });
  }
});

router.post('/', authenticateUser, donorOnly, async (req, res) => {
  try {
    const {
      business_type,
      address,
      city,
      latitude,
      longitude,
      csr_participant
    } = req.body;

    if (!address || !city || !latitude || !longitude) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['address', 'city', 'latitude', 'longitude']
      });
    }

    const { data: existing } = await supabaseAdmin
      .from('donors')
      .select('donor_id')
      .eq('profile_id', req.user.id)
      .single();

    if (existing) {
      return res.status(409).json({
        error: 'Donor profile already exists',
        donor_id: existing.donor_id
      });
    }

    const { data: donor, error } = await supabaseAdmin
      .from('donors')
      .insert({
        profile_id: req.user.id,
        business_type,
        address,
        city,
        latitude,
        longitude,
        csr_participant: csr_participant || false,
        verification_status: false
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Failed to create donor profile',
        message: error.message
      });
    }

    res.status(201).json({
      message: 'Donor profile created successfully',
      donor
    });

  } catch (error) {
    console.error('Create donor error:', error);
    res.status(500).json({
      error: 'Failed to create donor profile',
      message: error.message
    });
  }
});

router.get('/me', authenticateUser, donorOnly, async (req, res) => {
  try {
    const { data: donor, error } = await supabaseAdmin
      .from('donors')
      .select(`
        *,
        profiles (
          full_name,
          email,
          phone,
          organization_name
        )
      `)
      .eq('profile_id', req.user.id)
      .single();

    if (error || !donor) {
      return res.status(404).json({
        error: 'Donor profile not found'
      });
    }

    res.json({
      donor
    });

  } catch (error) {
    console.error('Get donor error:', error);
    res.status(500).json({
      error: 'Failed to get donor profile',
      message: error.message
    });
  }
});

router.put('/me', authenticateUser, donorOnly, async (req, res) => {
  try {
    const {
      full_name,
      phone,
      organization_name,
      business_type,
      address,
      city,
      latitude,
      longitude,
      csr_participant
    } = req.body;

    const donorUpdates = {};
    if (business_type !== undefined) donorUpdates.business_type = business_type;
    if (address !== undefined) donorUpdates.address = address;
    if (city !== undefined) donorUpdates.city = city;
    if (latitude !== undefined) donorUpdates.latitude = latitude;
    if (longitude !== undefined) donorUpdates.longitude = longitude;
    if (csr_participant !== undefined) donorUpdates.csr_participant = csr_participant;

    const profileUpdates = {};
    if (full_name !== undefined) profileUpdates.full_name = full_name;
    if (phone !== undefined) profileUpdates.phone = phone;
    if (organization_name !== undefined) profileUpdates.organization_name = organization_name;

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdates)
        .eq('id', req.user.id);

      if (profileError) {
        return res.status(500).json({
          error: 'Failed to update profile details',
          message: profileError.message
        });
      }
    }

    if (Object.keys(donorUpdates).length > 0) {
      const { error: donorUpdateError } = await supabaseAdmin
        .from('donors')
        .update(donorUpdates)
        .eq('profile_id', req.user.id);

      if (donorUpdateError) {
        return res.status(500).json({
          error: 'Failed to update donor profile',
          message: donorUpdateError.message
        });
      }
    }

    const { data: donor, error } = await supabaseAdmin
      .from('donors')
      .select(`
        *,
        profiles (
          full_name,
          email,
          phone,
          organization_name
        )
      `)
      .eq('profile_id', req.user.id)
      .single();

    if (error || !donor) {
      return res.status(404).json({
        error: 'Donor profile not found'
      });
    }

    res.json({
      message: 'Donor profile updated successfully',
      donor
    });

  } catch (error) {
    console.error('Update donor error:', error);
    res.status(500).json({
      error: 'Failed to update donor profile',
      message: error.message
    });
  }
});

router.get('/me/impact', authenticateUser, donorOnly, async (req, res) => {
  try {
    const { data: donor } = await supabaseAdmin
      .from('donors')
      .select('donor_id')
      .eq('profile_id', req.user.id)
      .single();

    if (!donor) {
      return res.status(404).json({
        error: 'Donor profile not found'
      });
    }

    const result = await getDonorImpact(donor.donor_id);

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to get impact metrics',
        message: result.error
      });
    }

    res.json({
      impact: result.impact
    });

  } catch (error) {
    console.error('Get donor impact error:', error);
    res.status(500).json({
      error: 'Failed to get impact metrics',
      message: error.message
    });
  }
});

router.get('/:donor_id', async (req, res) => {
  try {
    const { donor_id } = req.params;

    const { data: donor, error } = await supabaseAdmin
      .from('donors')
      .select(`
        donor_id,
        business_type,
        city,
        verification_status,
        profiles (
          organization_name
        )
      `)
      .eq('donor_id', donor_id)
      .single();

    if (error || !donor) {
      return res.status(404).json({
        error: 'Donor not found'
      });
    }

    res.json({
      donor
    });

  } catch (error) {
    console.error('Get donor error:', error);
    res.status(500).json({
      error: 'Failed to get donor',
      message: error.message
    });
  }
});

router.get('/', authenticateUser, async (req, res) => {
  try {
    const { city, verified } = req.query;
    const isAdmin = req.user?.role === 'admin';

    let query = supabaseAdmin
      .from('donors')
      .select(`
        donor_id,
        business_type,
        city,
        latitude,
        longitude,
        csr_participant,
        verification_status,
        created_at,
        profiles (
          organization_name
        )
      `);

    // Admins get full details including address and contact info
    if (isAdmin) {
      query = supabaseAdmin
        .from('donors')
        .select(`
          donor_id,
          business_type,
          address,
          city,
          latitude,
          longitude,
          csr_participant,
          verification_status,
          created_at,
          profiles (
            organization_name,
            phone,
            email
          )
        `);
    }

    if (city) {
      query = query.ilike('city', `%${city}%`);
    }

    if (verified !== undefined) {
      query = query.eq('verification_status', verified === 'true');
    }

    query = query.order('created_at', { ascending: false });

    const { data: donors, error } = await query;

    if (error) {
      return res.status(500).json({
        error: 'Failed to fetch donors',
        message: error.message
      });
    }

    res.json({
      donors,
      count: donors.length
    });

  } catch (error) {
    console.error('List donors error:', error);
    res.status(500).json({
      error: 'Failed to list donors',
      message: error.message
    });
  }
});

router.put('/:donor_id/verify', authenticateUser, adminOnly, async (req, res) => {
  try {
    const { donor_id } = req.params;
    const { verification_status } = req.body;

    if (typeof verification_status !== 'boolean') {
      return res.status(400).json({
        error: 'Missing required field',
        required: ['verification_status (boolean)']
      });
    }

    const { data: donor, error } = await supabaseAdmin
      .from('donors')
      .update({ verification_status })
      .eq('donor_id', donor_id)
      .select()
      .single();

    if (error || !donor) {
      return res.status(404).json({
        error: 'Donor not found or update failed',
        message: error?.message
      });
    }

    res.json({
      message: `Donor ${verification_status ? 'approved' : 'denied'} successfully`,
      donor
    });

  } catch (error) {
    console.error('Verify donor error:', error);
    res.status(500).json({
      error: 'Failed to update donor verification',
      message: error.message
    });
  }
});

module.exports = router;
