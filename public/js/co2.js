/*
 * EcoCommute – CO2 & points calculation (single source of truth)
 * ---------------------------------------------------------------
 * This file is used in TWO places:
 *   1. In the browser (live preview on the calculator / log-trip page)
 *   2. On the Node.js server (authoritative value saved to the database)
 * so the numbers the user sees are always the numbers that get stored.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();          // Node.js (require)
  } else {
    root.EcoCalc = factory();            // Browser (window.EcoCalc)
  }
})(typeof self !== 'undefined' ? self : this, function () {

  // Grams of CO2 a car emits per km when driving alone
  const CAR_BASELINE_G_PER_KM = 120;

  // 1 mature tree absorbs roughly 21 kg of CO2 per year
  const KG_CO2_PER_TREE_YEAR = 21;

  const MODES = {
    walk:    { label: 'Walking',          icon: 'bi-person-walking', emoji: '🚶', color: '#22c55e', basePoints: 10 },
    cycle:   { label: 'Cycling',          icon: 'bi-bicycle',        emoji: '🚲', color: '#0ea5e9', basePoints: 10 },
    public:  { label: 'Public Transport', icon: 'bi-bus-front',      emoji: '🚌', color: '#f59e0b', basePoints: 5  },
    carpool: { label: 'Carpool',          icon: 'bi-car-front',      emoji: '🚙', color: '#a855f7', basePoints: 3  }
  };

  const LEVELS = [
    { name: 'Seedling', emoji: '🌱', min: 0 },
    { name: 'Sprout',   emoji: '🌿', min: 250 },
    { name: 'Sapling',  emoji: '🪴', min: 750 },
    { name: 'Tree',     emoji: '🌳', min: 1500 },
    { name: 'Forest',   emoji: '🌲', min: 3000 }
  ];

  const LIMITS = { minDistance: 0.1, maxDistance: 100, minPassengers: 2, maxPassengers: 8 };

  /** Grams of CO2 emitted per km, per person, for a mode. */
  function emissionPerKm(mode, passengers) {
    switch (mode) {
      case 'walk':
      case 'cycle':   return 0;
      case 'public':  return 40;
      case 'carpool': return CAR_BASELINE_G_PER_KM / Math.max(2, passengers || 2);
      default:        return CAR_BASELINE_G_PER_KM;
    }
  }

  /**
   * Main calculation.
   *   co2 saved (g) = (car baseline − mode emission) × distance
   *   points        = basePoints + floor(distance × basePoints / 10)
   */
  function calculateTrip(mode, distance, passengers) {
    const km = Number(distance) || 0;
    const info = MODES[mode];
    if (!info || km <= 0) {
      return { co2SavedG: 0, co2SavedKg: 0, points: 0, modeEmissionG: 0, carEmissionG: 0, trees: 0 };
    }
    const modeEmissionG = emissionPerKm(mode, passengers) * km;
    const carEmissionG = CAR_BASELINE_G_PER_KM * km;
    const co2SavedG = carEmissionG - modeEmissionG;
    const co2SavedKg = round(co2SavedG / 1000, 3);
    const points = info.basePoints + Math.floor(km * info.basePoints / 10);
    return {
      co2SavedG: round(co2SavedG, 1),
      co2SavedKg,
      points,
      modeEmissionG: round(modeEmissionG, 1),
      carEmissionG: round(carEmissionG, 1),
      trees: treesEquivalent(co2SavedKg)
    };
  }

  function treesEquivalent(kg) {
    return round(kg / KG_CO2_PER_TREE_YEAR, 2);
  }

  /** Level for a points total, plus progress towards the next one. */
  function getLevel(points) {
    let idx = 0;
    for (let i = 0; i < LEVELS.length; i++) if (points >= LEVELS[i].min) idx = i;
    const current = LEVELS[idx];
    const next = LEVELS[idx + 1] || null;
    const progress = next ? Math.round(((points - current.min) / (next.min - current.min)) * 100) : 100;
    return { ...current, index: idx, next, progress, pointsToNext: next ? next.min - points : 0 };
  }

  function round(n, dp) {
    const f = Math.pow(10, dp);
    return Math.round(n * f) / f;
  }

  return {
    CAR_BASELINE_G_PER_KM, KG_CO2_PER_TREE_YEAR, MODES, LEVELS, LIMITS,
    emissionPerKm, calculateTrip, treesEquivalent, getLevel
  };
});
