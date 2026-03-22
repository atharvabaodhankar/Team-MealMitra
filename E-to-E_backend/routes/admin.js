const express = require('express');
const router = express.Router();

const { supabaseAdmin } = require('../config/supabaseClient');
const { authenticateUser } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleGuards');
const { CREDIT_THRESHOLD } = require('../config/constants');

async function getCreditsMintedToday() {
  const startOfTodayUtc = new Date();
  startOfTodayUtc.setUTCHours(0, 0, 0, 0);
  const fromIso = startOfTodayUtc.toISOString();

  // Support either created_at or issued_at depending on schema version.
  let query = await supabaseAdmin
    .from('carbon_credits')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', fromIso);

  if (!query.error) {
    return query.count || 0;
  }

  query = await supabaseAdmin
    .from('carbon_credits')
    .select('*', { count: 'exact', head: true })
    .gte('issued_at', fromIso);

  if (query.error) {
    throw query.error;
  }

  return query.count || 0;
}

router.get('/impact-overview', authenticateUser, adminOnly, async (req, res) => {
  try {
    const { count: totalCreditsMinted, error: totalCreditsError } = await supabaseAdmin
      .from('carbon_credits')
      .select('*', { count: 'exact', head: true });

    if (totalCreditsError) {
      throw totalCreditsError;
    }

    const creditsMintedToday = await getCreditsMintedToday();

    const { count: walletsNearThreshold, error: walletsError } = await supabaseAdmin
      .from('impact_wallets')
      .select('*', { count: 'exact', head: true })
      .gte('impact_points_balance', CREDIT_THRESHOLD * 0.8); // 80% of threshold

    if (walletsError) {
      throw walletsError;
    }

    res.json({
      total_credits_minted: totalCreditsMinted || 0,
      credits_minted_today: creditsMintedToday || 0,
      wallets_near_threshold: walletsNearThreshold || 0,
      threshold_impact_points: CREDIT_THRESHOLD
    });
  } catch (error) {
    console.error('Admin impact overview error:', error);
    res.status(500).json({
      error: 'Failed to fetch admin impact overview',
      message: error.message
    });
  }
});

module.exports = router;
