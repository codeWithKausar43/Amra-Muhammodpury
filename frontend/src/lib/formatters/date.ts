export function formatDate(date: string | Date | number): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(d);
}
