// Landing page: community counter + interactive quick calculator

// If already logged in, point the main button to the dashboard
if (Auth.isLoggedIn()) {
  const cta = document.getElementById('heroCta');
  cta.href = 'dashboard.html';
  cta.innerHTML = '<i class="bi bi-speedometer2 me-1"></i> Go to my dashboard';
}

/* ---------- Community counter ---------- */
api('/api/community')
  .then(c => {
    animateCounter(document.getElementById('cCo2'), c.co2_saved, 1);
    animateCounter(document.getElementById('cKm'), c.distance, 0);
    animateCounter(document.getElementById('cTrips'), c.trips, 0);
    animateCounter(document.getElementById('cTrees'), c.trees, 1);
  })
  .catch(() => {
    ['cCo2', 'cKm', 'cTrips', 'cTrees'].forEach(id => document.getElementById(id).textContent = '–');
  });

/* ---------- Quick calculator ---------- */
const modesBox = document.getElementById('calcModes');
modesBox.innerHTML = Object.entries(MODES).map(([key, m], i) => `
  <div class="col-6 col-md-3 mode-option" style="--mode-color:${m.color}">
    <input type="radio" name="calcMode" id="cm-${key}" value="${key}" ${key === 'cycle' ? 'checked' : ''}>
    <label for="cm-${key}"><i class="bi ${m.icon}"></i><span class="mode-name">${m.label}</span>
      <span class="mode-pts">+${m.basePoints} pts / trip</span></label>
  </div>`).join('');

const distanceInput = document.getElementById('calcDistance');
const passengersInput = document.getElementById('calcPassengers');

function updateCalculator() {
  const mode = document.querySelector('input[name=calcMode]:checked').value;
  const km = Number(distanceInput.value);
  const passengers = Number(passengersInput.value);
  document.getElementById('calcPassengersWrap').classList.toggle('d-none', mode !== 'carpool');
  document.getElementById('calcDistanceLabel').textContent = km + ' km';
  distanceInput.style.setProperty('--fill', Math.min(100, ((km - 0.5) / 49.5) * 100) + '%');

  const r = EcoCalc.calculateTrip(mode, km, passengers);
  document.getElementById('calcCo2').textContent = r.co2SavedKg.toFixed(2);
  document.getElementById('calcPoints').textContent = r.points;
  document.getElementById('calcTrees').textContent = r.trees.toFixed(2);
  document.getElementById('calcSentence').textContent =
    `by ${MODES[mode].label.toLowerCase()} ${km} km instead of driving alone`;

  // Comparison bars: grams emitted by each option for this distance
  const rows = [
    { label: '🚗 Car alone', g: EcoCalc.CAR_BASELINE_G_PER_KM * km, color: '#B8BEC6' },
    { label: '🚌 Bus/Metro', g: EcoCalc.emissionPerKm('public') * km, color: '#2A7A2F' },
    { label: '🚙 Carpool', g: EcoCalc.emissionPerKm('carpool', mode === 'carpool' ? passengers : 3) * km, color: '#3E9B3E' },
    { label: '🚲 Cycle/Walk', g: 0, color: '#A8D65C' }
  ];
  const max = rows[0].g || 1;
  document.getElementById('calcCompare').innerHTML = rows.map(r => `
    <div class="compare-row">
      <span class="lbl">${r.label}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${(r.g / max) * 100}%;background:${r.color}"></div></div>
      <span class="val">${fmtNum(r.g)} g</span>
    </div>`).join('');
}

modesBox.addEventListener('change', updateCalculator);
distanceInput.addEventListener('input', updateCalculator);
passengersInput.addEventListener('change', updateCalculator);
updateCalculator();
