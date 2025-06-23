export function formatRangeDate(range: string): string {
  const today = new Date();

  const daysMap: Record<string, number> = {
    '1 Mes': 30,
    '2 Meses': 60,
    '6 Meses': 180,
    '1 Semana': 7,
    '2 Semanas': 14,
  };

  const days = daysMap[range];
  if (!days) return '';

  const newDate = new Date(today);
  newDate.setDate(today.getDate() - days);

  const yyyy = newDate.getFullYear();
  const mm = String(newDate.getMonth() + 1).padStart(2, '0');
  const dd = String(newDate.getDate()).padStart(2, '0');

  return `${yyyy}${mm}${dd}`;
}