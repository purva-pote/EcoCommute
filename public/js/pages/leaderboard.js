// Leaderboard: podium + ranked table, switch metric (CO2/score) and period (all/month)

const podiumColors = ['#eab308', '#94a3b8', '#f97316'];

function selected(name) {
  return document.querySelector(`input[name=${name}]:checked`).value;
}

async function loadBoard() {
  const metric = selected('metric');
  const period = selected('period');
  try {
    const data = await api(`/api/leaderboard?metric=${metric}&period=${period}`);
    render(data);
  } catch (e) {
    toast(e.message, 'danger');
  }
}

function mainValue(r, metric) {
  return metric === 'score' ? fmtNum(r.points) + ' pts' : fmtKg(r.co2_saved);
}

function render({ leaderboard, metric, currentUserId, period }) {
  // ----- Podium (displayed in order 2nd, 1st, 3rd) -----
  const top = leaderboard.slice(0, 3);
  const order = [[top[1], 'second', '🥈', 1], [top[0], 'first', '🥇', 0], [top[2], 'third', '🥉', 2]];
  document.getElementById('podium').innerHTML = order.filter(([r]) => r).map(([r, cls, medal, i]) => `
    <div class="podium-item ${cls} fade-in">
      <div class="p-avatar" style="background:${podiumColors[i]}">${escapeHtml(initials(r.name))}</div>
      <div class="fw-semibold text-truncate">${escapeHtml(r.name)}${r.id === currentUserId ? ' (You)' : ''}</div>
      <div class="small text-muted mb-2">${mainValue(r, metric)}</div>
      <div class="p-block"><div class="medal">${medal}</div>#${r.rank}</div>
    </div>`).join('');

  // ----- My position banner -----
  const me = leaderboard.find(r => r.id === currentUserId);
  const banner = document.getElementById('myPosition');
  if (me) {
    const above = leaderboard[me.rank - 2];
    const gap = above
      ? (metric === 'score' ? `${fmtNum(above.points - me.points)} pts` : fmtKg(above.co2_saved - me.co2_saved))
      : null;
    banner.innerHTML = `<i class="bi bi-person-circle fs-4 text-success"></i>
      <div>You are <strong>#${me.rank}</strong> of ${leaderboard.length}${period === 'month' ? ' this month' : ''}.
      ${gap ? `Just <strong>${gap}</strong> behind ${escapeHtml(above.name)}. <a href="log-trip.html">Log a trip</a> to overtake!` : 'You\'re at the top. Keep it up! 🎉'}</div>`;
    banner.classList.remove('d-none');
  } else {
    banner.classList.add('d-none');
  }

  // ----- Table -----
  document.getElementById('boardBody').innerHTML = leaderboard.map(r => `
    <tr class="${r.id === currentUserId ? 'me-row' : ''}">
      <td><span class="rank-circle" ${r.rank <= 3 ? `style="background:${podiumColors[r.rank - 1]};color:#fff"` : ''}>${r.rank}</span></td>
      <td><span class="avatar me-2" style="width:30px;height:30px;font-size:.75rem">${escapeHtml(initials(r.name))}</span>
          ${escapeHtml(r.name)} ${r.id === currentUserId ? '<span class="badge bg-success ms-1">You</span>' : ''}</td>
      <td>${r.level.emoji} ${r.level.name}</td>
      <td>${r.trips}</td>
      <td>${fmtKm(r.distance)}</td>
      <td class="${metric === 'co2' ? 'fw-bold text-success' : ''}">${fmtKg(r.co2_saved)}</td>
      <td class="${metric === 'score' ? 'fw-bold text-success' : ''}">${fmtNum(r.points)}</td>
    </tr>`).join('');
}

document.querySelectorAll('input[name=metric], input[name=period]').forEach(el => el.addEventListener('change', loadBoard));
loadBoard();
