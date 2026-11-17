export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('The server could not complete this request. Please try again.');
  }
  if (!response.ok) throw new Error(data.error || 'This request could not be completed.');
  return data as T;
}
export function imagePath(path: string | null, size = 'w500') {
  return path && /^\/[\w.-]+$/.test(path) ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}
