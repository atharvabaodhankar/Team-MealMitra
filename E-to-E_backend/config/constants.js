/**
 * Shared application constants — single source of truth.
 * Import from here instead of hardcoding values across routes/services.
 */

// Impact points required to mint one carbon credit
const CREDIT_THRESHOLD = 100;

// Impact point distribution percentages on delivery completion
const IMPACT_DISTRIBUTION = {
  donor: 0.40,
  ngo: 0.30,
  admin: 0.20,
  platform: 0.10,
};

// Food category multipliers for impact point calculation
const FOOD_CATEGORY_MULTIPLIERS = {
  dairy: 2,
  cooked: 2,
  default: 1,
};

module.exports = {
  CREDIT_THRESHOLD,
  IMPACT_DISTRIBUTION,
  FOOD_CATEGORY_MULTIPLIERS,
};
