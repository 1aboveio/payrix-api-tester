export function generateReferenceNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const base = `${yy}${mm}${dd}${hh}${mi}${ss}`; // 12 digits
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `${base}${rand}`; // 16 digits max
}

export function generateTicketNumber(): string {
  const value = String(Date.now() % 1_000_000).padStart(6, '0');
  return value;
}
