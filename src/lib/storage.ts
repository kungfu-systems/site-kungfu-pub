const PREFIX = 'kungfu.pub:v1:';
export function readIds(key: string): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(PREFIX + key) ?? '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}
export function writeIds(key: string, ids: string[]): boolean {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify([...new Set(ids)]));
    return true;
  } catch {
    return false;
  }
}
