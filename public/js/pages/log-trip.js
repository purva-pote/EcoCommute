// Log-trip page: mode selection, live preview, submit to API
requireLogin();

const form = document.getElementById('tripForm');
const distanceInput = document.getElementById('distance');
const distanceRange = document.getElementById('distanceRange');
const passengersInput = document.getElementById('passengers');
const dateInput = document.getElementById('date');
const submitBtn = document.getElementById('submitBtn');
const successModal = new bootstrap.Modal(document.getElementById('successModal'));

// Build the 4 mode cards from the shared MODES config
document.getElementById('modeOptions').innerHTML = Object.entries(MODES).map(([key, m]) => `
  <div class="col-6 col-md-3 mode-option" style="--mode-color:${m.color}">
    <input type="radio" name="mode" id="mode-${key}" value="${key}" ${key === 'cycle' ? 'checked' : ''}>
    <label for="mode-${key}"><i class="bi ${m.icon}"></i><span class="mode-name">${m.label}</span>
      <span class="mode-pts">+${m.basePoints} pts</span></label>
  </div>`).join('');

// Date defaults to today; future dates are blocked
dateInput.value = todayStr();
dateInput.max = todayStr();

const getMode = () => document.querySelector('input[name=mode]:checked').value;

/** Recalculate the preview whenever any input changes */
function updatePreview() {
  const mode = getMode();
  const km = Number(distanceInput.value) || 0;
  const passengers = Number(passengersInput.value) || 2;
  const m = MODES[mode];

  document.getElementById('passengersWrap').classList.toggle('d-none', mode !== 'carpool');
  document.getElementById('previewMode').textContent = `${m.emoji} ${m.label}`;

  const r = EcoCalc.calculateTrip(mode, km, passengers);
  document.getElementById('pCo2').textContent = r.co2SavedKg.toFixed(2);
  document.getElementById('pPoints').textContent = r.points;
  document.getElementById('pGrams').textContent = fmtNum(r.co2SavedG);
  document.getElementById('pTrees').textContent = r.trees.toFixed(2);

  const max = r.carEmissionG || 1;
  document.getElementById('pCompare').innerHTML = `
    <div class="compare-row"><span class="lbl">🚗 Car</span>
      <div class="bar-track"><div class="bar-fill" style="width:100%;background:#f87171"></div></div>
      <span class="val">${fmtNum(r.carEmissionG)} g</span></div>
    <div class="compare-row"><span class="lbl">${m.emoji} You</span>
      <div class="bar-track"><div class="bar-fill" style="width:${(r.modeEmissionG / max) * 100}%;background:#fde68a"></div></div>
      <span class="val">${fmtNum(r.modeEmissionG)} g</span></div>`;

  // Show the formula so the logic is transparent
  const emission = EcoCalc.emissionPerKm(mode, passengers);
  document.getElementById('pFormula').innerHTML =
    `<i class="bi bi-calculator me-1"></i>(${EcoCalc.CAR_BASELINE_G_PER_KM} − ${fmtNum(emission, emission % 1 ? 1 : 0)} g/km) × ${km} km = ${fmtNum(r.co2SavedG)} g<br>
     <i class="bi bi-star me-1"></i>${m.basePoints} base + ${r.points - m.basePoints} distance bonus = ${r.points} pts`;
}

/* ---------- Input syncing ---------- */
distanceRange.addEventListener('input', () => {
  distanceInput.value = distanceRange.value;
  setActiveChip();
  updatePreview();
});
distanceInput.addEventListener('input', () => {
  distanceRange.value = Math.min(Number(distanceInput.value) || 0.5, 50);
  setActiveChip();
  validateDistance();
  updatePreview();
});
document.getElementById('chips').addEventListener('click', (e) => {
  const km = e.target.dataset.km;
  if (!km) return;
  distanceInput.value = distanceRange.value = km;
  setActiveChip();
  validateDistance();
  updatePreview();
});
function setActiveChip() {
  document.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', Number(c.dataset.km) === Number(distanceInput.value)));
}

document.getElementById('modeOptions').addEventListener('change', updatePreview);
passengersInput.addEventListener('input', updatePreview);
document.getElementById('pMinus').addEventListener('click', () => {
  passengersInput.value = Math.max(2, Number(passengersInput.value) - 1); updatePreview();
});
document.getElementById('pPlus').addEventListener('click', () => {
  passengersInput.value = Math.min(8, Number(passengersInput.value) + 1); updatePreview();
});

function validateDistance() {
  const km = Number(distanceInput.value);
  const ok = km >= EcoCalc.LIMITS.minDistance && km <= EcoCalc.LIMITS.maxDistance;
  distanceInput.classList.toggle('is-invalid', !ok);
  document.getElementById('distanceError').classList.toggle('d-none', ok);
  return ok;
}

/* ---------- Submit ---------- */
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const dateOk = dateInput.value && dateInput.value <= todayStr();
  dateInput.classList.toggle('is-invalid', !dateOk);
  if (!validateDistance() || !dateOk) return;

  const mode = getMode();
  const body = {
    mode,
    distance: Number(distanceInput.value),
    passengers: mode === 'carpool' ? Number(passengersInput.value) : 1,
    date: dateInput.value,
    note: document.getElementById('note').value.trim()
  };

  submitBtn.disabled = true;
  submitBtn.querySelector('.spinner-border').classList.remove('d-none');
  try {
    const res = await api('/api/trips', { method: 'POST', body });
    showSuccess(res);
    form.querySelector('#note').value = '';
  } catch (err) {
    toast(err.message, 'danger');
  } finally {
    submitBtn.disabled = false;
    submitBtn.querySelector('.spinner-border').classList.add('d-none');
  }
});

function showSuccess({ trip, totals, level }) {
  const m = MODES[trip.mode];
  document.getElementById('sEmoji').textContent = m.emoji;
  const cheers = ['Nice one!', 'Look at you go!', 'The planet says thanks!', 'Another one for the streak!', 'Fresh air, well earned!'];
  document.getElementById('sTitle').textContent = cheers[Math.floor(Math.random() * cheers.length)];
  document.getElementById('sText').textContent = `${m.label} · ${trip.distance} km on ${fmtDate(trip.date)}`;
  // A small, relatable comparison so the number means something
  const phoneCharges = Math.round(trip.co2_saved * 1000 / 8);   // ~8 g CO2 per smartphone charge
  document.getElementById('sFun').textContent = phoneCharges > 0
    ? `That's like the CO₂ from charging a phone ${phoneCharges} times 📱`
    : 'Every little bit counts 🌱';
  document.getElementById('sCo2').textContent = fmtKg(trip.co2_saved);
  document.getElementById('sPoints').textContent = '+' + trip.points;
  document.getElementById('sTotals').innerHTML = `
    <div class="d-flex justify-content-between"><span>Total CO₂ saved</span><strong>${fmtKg(totals.co2_saved)}</strong></div>
    <div class="d-flex justify-content-between"><span>Total score</span><strong>${fmtNum(totals.points)} pts</strong></div>
    <div class="d-flex justify-content-between"><span>Level</span><strong>${level.emoji} ${level.name}</strong></div>
    ${level.next ? `<div class="progress light mt-2"><div class="progress-bar" style="width:${level.progress}%"></div></div>
      <div class="text-muted mt-1">${fmtNum(level.pointsToNext)} pts to ${level.next.name}</div>` : ''}`;
  successModal.show();
  confetti();
}

// Pre-fill from a link, e.g. "Log this trip" on the Transit page:
// log-trip.html?mode=public&distance=8.4&note=Vidyavihar → Dadar
const prefill = new URLSearchParams(location.search);
if (MODES[prefill.get('mode')]) document.getElementById('mode-' + prefill.get('mode')).checked = true;
if (Number(prefill.get('distance')) > 0) {
  distanceInput.value = prefill.get('distance');
  distanceRange.value = Math.min(Number(prefill.get('distance')), 50);
  setActiveChip();
}
if (prefill.get('note')) document.getElementById('note').value = prefill.get('note').slice(0, 100);

updatePreview();
