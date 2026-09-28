// Personal dashboard: KPIs, level progress, charts, recent trips
const user = requireLogin();

document.getElementById('greeting').textContent = greeting() + ',';
document.getElementById('userName').textContent = user.name + ' 👋';
document.getElementById('tip').textContent = ECO_TIPS[new Date().getDate() % ECO_TIPS.length];

async function loadDashboard() {
  try {
    const s = await api('/api/stats/' + user.id);
    renderKpis(s);
    renderLevel(s.level);
    renderDailyChart(s.daily);
    renderModeChart(s.byMode);
    renderRecent(s.recent);
  } catch (e) {
    toast(e.message, 'danger');
  }
}

function renderKpis(s) {
  const t = s.totals;
  animateCounter(document.getElementById('kCo2'), t.co2_saved, 1);
  animateCounter(document.getElementById('kKm'), t.distance, 0);
  animateCounter(document.getElementById('kTrips'), t.trips, 0);
  animateCounter(document.getElementById('kPoints'), t.points, 0);
  animateCounter(document.getElementById('kStreak'), s.streak, 0);
  document.getElementById('kRank').textContent = s.rank ? '#' + s.rank : '–';
  document.getElementById('kRankLabel').textContent = `rank of ${s.totalUsers} users`;
  document.getElementById('weekBadge').innerHTML = `<i class="bi bi-calendar-week"></i> ${fmtKg(t.week_co2)} this week`;

  // Equivalents: car km avoided = distance travelled green; petrol ≈ 15 km per litre
  document.getElementById('eqTrees').textContent = fmtNum(t.trees, 2);
  document.getElementById('eqCarKm').textContent = fmtKm(t.distance);
  document.getElementById('eqFuel').textContent = fmtNum(t.distance / 15, 1) + ' L';
}

function renderLevel(level) {
  document.getElementById('levelBadge').textContent = `${level.emoji} ${level.name}`;
  document.getElementById('levelFrom').textContent = `${level.emoji} ${level.name}`;
  document.getElementById('levelTo').textContent = level.next ? `${level.next.emoji} ${level.next.name}` : '🏆 Max level';
  document.getElementById('levelHint').textContent = level.next
    ? `${fmtNum(level.pointsToNext)} more points to reach ${level.next.name}`
    : 'You reached the highest level. Amazing!';
  setTimeout(() => document.getElementById('levelBar').style.width = level.progress + '%', 100);
}

function renderDailyChart(daily) {
  new Chart(document.getElementById('dailyChart'), {
    type: 'bar',
    data: {
      labels: daily.map(d => fmtDate(d.date, { day: 'numeric', month: 'short' })),
      datasets: [{
        label: 'CO₂ saved (kg)',
        data: daily.map(d => d.co2_saved),
        backgroundColor: daily.map((d, i) => i === daily.length - 1 ? '#84cc16' : '#16a34a'),
        borderRadius: 8,
        maxBarThickness: 34
      }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => ` ${c.parsed.y} kg CO₂ · ${daily[c.dataIndex].distance} km` } }
      },
      scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } }
    }
  });
}

function renderModeChart(byMode) {
  const used = byMode.filter(m => m.trips > 0);
  if (!used.length) {
    document.getElementById('modeChart').parentElement.classList.add('d-none');
    document.getElementById('modeEmpty').classList.remove('d-none');
    return;
  }
  new Chart(document.getElementById('modeChart'), {
    type: 'doughnut',
    data: {
      labels: used.map(m => MODES[m.mode].label),
      datasets: [{ data: used.map(m => m.trips), backgroundColor: used.map(m => MODES[m.mode].color), borderWidth: 3 }]
    },
    options: {
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { callbacks: { label: (c) => ` ${c.parsed} trips · ${used[c.dataIndex].co2_saved} kg saved` } }
      }
    }
  });
}

function renderRecent(trips) {
  const body = document.getElementById('recentBody');
  if (!trips.length) {
    body.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="emoji">🌱</div>
      <p>No trips yet. Log your first green commute!</p>
      <a href="log-trip.html" class="btn btn-primary">Log a trip</a></div></td></tr>`;
    return;
  }
  body.innerHTML = trips.map(t => `
    <tr>
      <td>${fmtDate(t.date)}</td>
      <td>${modeBadge(t.mode)}</td>
      <td>${fmtKm(t.distance)}</td>
      <td class="text-success fw-semibold">${fmtKg(t.co2_saved)}</td>
      <td><span class="badge text-bg-light">+${t.points}</span></td>
    </tr>`).join('');
}

loadDashboard();
