/** "2025-12-18" → "Dec 2025"; null → "Present". */
export function monthYear(iso: string | null): string {
  if (!iso) return 'Present';
  const [y, m] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[Number(m) - 1] ?? ''} ${y}`.trim();
}

export function year(iso: string | null): string {
  return iso ? iso.split('-')[0] : '—';
}
