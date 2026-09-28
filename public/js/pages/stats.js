// Monthly statistics: 12-month charts, highlights and summary table
const user = requireLogin();
const yearSelect = document.getElementById('yearSelect');
let co2Chart, modeChart;

async function loadYear(year) {
  try {
    const data = await api(`/api/stats/${user.id}/monthly` + (year ? `?year=${year}` : ''));
    yearSelect.innerHTML = data.years.map(y => `<option ${y === data.year ? 'selected' : ''}>${y}</option>`).join('');
    renderHighlights(data);
    renderCharts(data.months);
    renderTable(data.months);
  } catch (e) {
    toast(e.message, 'danger');
  }
}

function renderHighlights({ year, months }) {
  const yearCo2 = months.reduce((s, m) => s + m.co2_saved, 0);
  const yearTrips = months.reduce((s, m) => s + m.trips, 0);
  document.getElementById('hYearCo2').textContent = fmtKg(yearCo2);
  document.getElementById('hAvg').textContent = yearTrips ? fmtKg(yearCo2 / yearTrips) : '–';

  const best = months.reduce((a, b) => (b.co2_saved > a.co2_saved ? b : a), months[0]);
  document.getElementById('hBest').textContent = best.co2_saved ? monthName(best.month, 'long') : '–';
  document.getElementById('hBestLabel').textContent = best.co2_saved ? `best month · ${fmtKg(best.co2_saved)}` : 'best month';

  // This month vs last month (only meaningful for the current year)
  const now = todayStr().slice(0, 7);
  const idx = months.findIndex(m => m.month === now);
  const change = document.getElementById('hChange');
  if (idx > 0) {
    const cur = months[idx].co2_saved, prev = months[idx - 1].co2_saved;
    if (prev > 0) {
      const pct = Math.round(((cur - prev) / prev) * 100);
      change.innerHTML = `<span class="${pct >= 0 ? 'text-success' : 'text-danger'}">
        <i class="bi ${pct >= 0 ? 'bi-arrow-up' : 'bi-arrow-down'}"></i>${Math.abs(pct)}%</span>`;
      document.getElementById('hChangeLabel').textContent =
        `${monthName(months[idx].month)} (${fmtKg(cur)}) vs ${monthName(months[idx - 1].month)} (${fmtKg(prev)})`;
      return;
    }
  }
  change.textContent = '–';
  document.getElementById('hChangeLabel').textContent = 'this month vs last month';
}

function renderCharts(months) {
  const labels = months.map(m => monthName(m.month));
  if (co2Chart) co2Chart.destroy();
  if (modeChart) modeChart.destroy();

  co2Chart = new Chart(document.getElementById('co2Chart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { type: 'line', label: 'Trips', data: months.map(m => m.trips), yAxisID: 'y1',
          borderColor: '#0ea5e9', backgroundColor: '#0ea5e9', tension: .35, pointRadius: 3 },
        { label: 'CO₂ saved (kg)', data: months.map(m => m.co2_saved), backgroundColor: '#16a34a', borderRadius: 8, maxBarThickness: 36 }
      ]
    },
    options: {
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, grid: { color: '#f1f5f9' }, title: { display: true, text: 'kg CO₂' } },
        y1: { beginAtZero: true, position: 'right', grid: { display: false }, title: { display: true, text: 'trips' } },
        x: { grid: { display: false } }
      }
    }
  });

  modeChart = new Chart(document.getElementById('modeChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: Object.entries(MODES).map(([key, m]) => ({
        label: m.label, data: months.map(mo => mo.byMode[key].distance), backgroundColor: m.color, borderRadius: 4
      }))
    },
    options: {
      maintainAspectRatio: false,
      scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, grid: { color: '#f1f5f9' } } }
    }
  });
}

function renderTable(months) {
  const active = months.filter(m => m.trips > 0);
  const body = document.getElementById('monthBody');
  const foot = document.getElementById('monthFoot');
  if (!active.length) {
    body.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="emoji">📅</div>No trips in this year yet.</div></td></tr>`;
    foot.innerHTML = '';
    return;
  }
  const best = Math.max(...active.map(m => m.co2_saved));
  body.innerHTML = active.slice().reverse().map(m => `
    <tr>
      <td class="fw-semibold">${monthName(m.month, 'long')} ${m.co2_saved === best ? '<span class="badge text-bg-warning ms-1">🏆 Best</span>' : ''}</td>
      <td>${m.trips}</td>
      <td>${fmtKm(m.distance)}</td>
      <td class="text-success fw-semibold">${fmtKg(m.co2_saved)}</td>
      <td>${fmtNum(m.points)}</td>
      <td>${m.topMode ? modeBadge(m.topMode) : '–'}</td>
    </tr>`).join('');
  const sum = (k) => active.reduce((s, m) => s + m[k], 0);
  foot.innerHTML = `<tr><td>Total</td><td>${sum('trips')}</td><td>${fmtKm(sum('distance'))}</td>
    <td class="text-success">${fmtKg(sum('co2_saved'))}</td><td>${fmtNum(sum('points'))}</td><td></td></tr>`;
}

yearSelect.addEventListener('change', () => loadYear(yearSelect.value));
loadYear();
