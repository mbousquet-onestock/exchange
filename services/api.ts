import { Article, ExchangeOrderRequest, OrderSummary } from '../types';

let sessionToken = '';

// Session opened from the OneStock extension context, sent on every call
export const setSessionToken = (token: string) => {
  sessionToken = token;
};

const request = async <T,>(url: string, init: RequestInit = {}): Promise<T> => {
  const headers = new Headers(init.headers);
  if (sessionToken) headers.set('Authorization', `Bearer ${sessionToken}`);
  const res = await fetch(url, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data as T;
};

export const getOrder = (id: string, email?: string) => {
  const params = new URLSearchParams({ id });
  if (email) params.set('email', email);
  return request<OrderSummary>(`/api/order?${params}`);
};

export const getExchangeOptions = (itemId: string) =>
  request<{ items: Article[] }>(`/api/exchange-options?${new URLSearchParams({ item_id: itemId })}`)
    .then(r => r.items);

export const createExchangeOrder = (payload: ExchangeOrderRequest) =>
  request<{ id: string; mock?: boolean }>('/api/exchange-orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

export const openSession = (context: { extension_id: string; user_id: string; site_id: string; extension_signature?: string }) =>
  request<{ token: string; expiresAt: number; verified: boolean }>('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(context),
  });
