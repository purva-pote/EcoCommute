// Small shared helpers for the server

/** Local date as YYYY-MM-DD */
function toDateStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return toDateStr(new Date(y, m - 1, d + n));
}

const round = (n, dp = 2) => Math.round((Number(n) || 0) * 10 ** dp) / 10 ** dp;

/** Error with an HTTP status code, caught by the central error handler */
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

module.exports = { toDateStr, addDays, round, HttpError };
