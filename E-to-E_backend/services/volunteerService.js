const { supabaseAdmin } = require('../config/supabaseClient');

/**
 * Find the best available volunteer for a delivery.
 * If pickup coordinates are provided, picks the nearest volunteer.
 * Falls back to first available if no coordinates or RPC unavailable.
 *
 * @param {string} ngoId
 * @param {number|null} pickupLatitude
 * @param {number|null} pickupLongitude
 * @param {number} maxDistanceKm
 */
async function findBestVolunteer(ngoId, pickupLatitude = null, pickupLongitude = null, maxDistanceKm = 50) {
    try {
        // If we have pickup coordinates, try proximity-based matching
        if (pickupLatitude != null && pickupLongitude != null) {
            const { data: nearest, error: rpcError } = await supabaseAdmin.rpc('find_nearest_volunteers', {
                p_ngo_id: ngoId,
                p_pickup_latitude: pickupLatitude,
                p_pickup_longitude: pickupLongitude,
                p_max_distance_km: maxDistanceKm,
            });

            if (!rpcError && nearest && nearest.length > 0) {
                console.log(`[VolunteerService] Proximity match: ${nearest[0].full_name} (${nearest[0].distance_km?.toFixed(1)} km away)`);
                return nearest[0];
            }

            if (rpcError) {
                console.warn('[VolunteerService] Proximity RPC failed, falling back to first available:', rpcError.message);
            }
        }

        // Fallback: first available volunteer in the NGO
        const { data: volunteer, error } = await supabaseAdmin
            .from('volunteers')
            .select('volunteer_id, full_name, phone, vehicle_type')
            .eq('ngo_id', ngoId)
            .eq('availability_status', true)
            .limit(1)
            .single();

        if (error) {
            if (error.code !== 'PGRST116') {
                console.error('[VolunteerService] Error finding volunteer:', error);
            }
            return null;
        }

        return volunteer;
    } catch (err) {
        console.error('[VolunteerService] Unexpected error:', err);
        return null;
    }
}

/**
 * Mark a volunteer as unavailable (busy on a delivery).
 */
async function setVolunteerBusy(volunteerId) {
    const { error } = await supabaseAdmin
        .from('volunteers')
        .update({ availability_status: false })
        .eq('volunteer_id', volunteerId);

    if (error) {
        console.error('[VolunteerService] Failed to mark volunteer busy:', error.message);
    }
}

/**
 * Mark a volunteer as available again (delivery completed or cancelled).
 */
async function setVolunteerAvailable(volunteerId) {
    const { error } = await supabaseAdmin
        .from('volunteers')
        .update({ availability_status: true })
        .eq('volunteer_id', volunteerId);

    if (error) {
        console.error('[VolunteerService] Failed to mark volunteer available:', error.message);
    }
}

module.exports = {
    findBestVolunteer,
    setVolunteerBusy,
    setVolunteerAvailable,
};
