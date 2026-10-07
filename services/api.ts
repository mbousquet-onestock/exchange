import { Article, ExchangeOrderRequest, OrderSummary } from '../types';

const request = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(url, init);
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
