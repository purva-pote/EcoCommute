// Admin overview: KPI cards and three charts
const rangeSelect = document.getElementById('rangeSelect');
let timeChart;

async function loadOverview() {
  try {
    const [stats, byMode] = await Promise.all([
      adminFetch('/api/admin/stats'),
      adminFetch('/api/admin/stats/trips-by-mode')
    ]);
    renderKpis(stats);
    renderModeCharts(byMode.modes);
    await loadActivity();
  } catch (e) {
    toast(e.message, 'danger');
  }
}

async function loadActivity() {
  try {
    const { days } = await adminFetch('/api/admin/stats/trips-over-time?days=' + rangeSelect.value);
    renderTimeChart(days);
  } catch (e) {
    toast(e.message, 'danger');
  }
}

function renderKpis(s) {
  animateCounter(document.getElementById('kUsers'), s.total_users);
  animateCounter(document.getElementById('kTrips'), s.total_trips);
  animateCounter(document.getElementById('kCo2'), s.total_co2_saved, 1);
  animateCounter(document.getElementById('kPoints'), s.total_points);
  animateCounter(document.getElementById('kWeek'), s.trips_last_7_days);
  animateCounter(document.getElementById('kNew'), s.new_users_last_30_days);
}

function renderTimeChart(days) {
  if (timeChart) timeChart.destroy();
  timeChart = new Chart(document.getElementById('timeChart'), {
    type: 'bar',
    data: {
      labels: days.map(d => fmtDate(d.date, { day: 'numeric', month: 'short' })),
      datasets: [
        { type: 'line', label: 'CO₂ saved (kg)', data: days.map(d => d.co2_saved), yAxisID: 'y1',
          borderColor: '#0ea5e9', backgroundColor: '#0ea5e9', tension: .35, pointRadius: days.length > 90 ? 0 : 2 },
        { label: 'Trips', data: days.map(d => d.trips), backgroundColor: '#0d9488', borderRadius: 6, maxBarThickness: 22 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } },
        y: { beginAtZero: true, ticks: { precision: 0 }, title: { display: true, text: 'Trips' } },
        y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'kg CO₂' } }
      }
    }
  });
}

function renderModeCharts(modes) {
  const labels = modes.map(m => MODES[m.mode].label);
  const colors = modes.map(m => MODES[m.mode].color);

  const totalTrips = modes.reduce((s, m) => s + m.trips, 0);
  if (totalTrips) {
    new Chart(document.getElementById('modeChart'), {
      type: 'doughnut',
      data: { labels, datasets: [{ data: modes.map(m => m.trips), backgroundColor: colors, borderWidth: 2 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'bottom' } } }
    });
  } else {
    document.getElementById('modeChart').parentElement.classList.add('d-none');
    document.getElementById('modeEmpty').classList.remove('d-none');
  }

  new Chart(document.getElementById('co2ModeChart'), {
    type: 'bar',
    data: { labels, datasets: [{ label: 'CO₂ saved (kg)', data: modes.map(m => m.co2_saved), backgroundColor: colors, borderRadius: 8, maxBarThickness: 40 }] },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true }, y: { grid: { display: false } } }
    }
  });
}

rangeSelect.addEventListener('change', loadActivity);
loadOverview();