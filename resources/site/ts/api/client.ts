/**
 * API Client
 * Thin fetch wrapper that reads WordPress nonce + base URL from window.kirki_ecommerce.
 */

function getConfig() {
  if (!window.kirki_ecommerce) {
    throw new Error('[kecom] window.kirki_ecommerce is not defined. Did you forget wp_localize_script?');
  }
  return window.kirki_ecommerce;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  params?: Record<string, string | number>;
};

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { rest_url_base, rest_nonce } = getConfig();
  const { method = 'GET', body, params } = options;

  let url = `${rest_url_base}${endpoint}`;

  if (params) {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
    );
    url += `?${qs.toString()}`;
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-WP-Nonce': rest_nonce,
  };

  const res = await fetch(url, {
    method,
    headers,
    credentials: 'same-origin',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    const error = new Error(err?.message ?? `Request failed: ${res.status}`) as Error & { errors?: Record<string, string[]> };
    if (err?.errors) {
      error.errors = err.errors;
    }
    throw error;
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}
