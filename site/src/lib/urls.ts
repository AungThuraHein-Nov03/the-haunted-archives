export function siteUrl(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const normalized = path.replace(/^\//, '');
  return normalized ? `${base}/${normalized}` : `${base}/`;
}

export function archiveUrl(path: string): string {
  return siteUrl(`archive/${path}`);
}
