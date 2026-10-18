export function timeAgo(dateString: string | Date): string {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "justo ahora";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days}d`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `hace ${weeks}sem`;

  const months = Math.floor(days / 30);
  if (months < 12) return `hace ${months}mes`;

  const years = Math.floor(days / 365);
  return `hace ${years}a`;
}
