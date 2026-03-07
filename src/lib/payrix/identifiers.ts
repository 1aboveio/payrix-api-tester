export function generateReferenceNumber(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

export function generateTicketNumber(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateRequestId(): string {
  return crypto.randomUUID();
}
