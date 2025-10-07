// Lightweight, defensive GET helper using Fetch API
// - Does NOT set Content-Type on GET to avoid CORS preflight
// - Validates HTTP status and content-type before parsing JSON
export async function getData(url: string): Promise<any> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    mode: 'cors',
    credentials: 'omit',
  });

  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status} ${response.statusText} — ${text.slice(0, 200)}`);
  }

  if (!contentType.includes('application/json')) {
    const text = await response.text().catch(() => '');
    throw new Error(`Expected JSON, got ${contentType || 'unknown'} — ${text.slice(0, 200)}`);
  }

  return response.json();
}


