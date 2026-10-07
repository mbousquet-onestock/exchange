// Server-side OneStock API client.
// Credentials never reach the browser: the frontend only calls /api/* routes,
// which are served by Vercel functions (api/) in production and by a Vite
// middleware (see vite.config.ts) in development.

import type { Article, CustomerDetails, ExchangeOrderRequest, OrderSummary } from '../types';
import { ARTICLES, MOCK_ORDER_ARTICLE_IDS, MOCK_ORDER_ID, MOCK_CUSTOMER } from '../mockData';

type Env = Record<string, string | undefined>;

export interface OnestockConfig {
  baseUrl: string;
  siteId: string;
  userId: string;
  password: string;
  // Name of the product attribute (item "information" field) listing the
  // item ids a product can be exchanged for.
  exchangeAttribute: string;
  exchangeOrderPrefix: string;
  exchangeOrderType: string;
  salesChannel: string;
  currency: string;
}

export const getConfig = (env: Env = process.env): OnestockConfig => ({
  baseUrl: (env.ONESTOCK_API_URL || 'https://api.onestock-retail.com').replace(/\/$/, ''),
  siteId: env.ONESTOCK_SITE_ID || '',
  userId: env.ONESTOCK_USER_ID || '',
  password: env.ONESTOCK_PASSWORD || '',
  exchangeAttribute: env.ONESTOCK_EXCHANGE_ATTRIBUTE || 'exchange_items',
  exchangeOrderPrefix: env.ONESTOCK_EXCHANGE_ORDER_PREFIX || 'EXC-',
  exchangeOrderType: env.ONESTOCK_EXCHANGE_ORDER_TYPE || 'exchange',
  salesChannel: env.ONESTOCK_SALES_CHANNEL || 'returns_portal',
  currency: env.ONESTOCK_CURRENCY || 'GBP',
});

export const isMockMode = (config: OnestockConfig) =>
  !config.siteId || !config.userId || !config.password;

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// ---------------------------------------------------------------------------
// Low level calls
// ---------------------------------------------------------------------------

let cachedToken: { value: string; key: string; expiresAt: number } | null = null;
const TOKEN_TTL_MS = 50 * 60 * 1000;

const login = async (config: OnestockConfig): Promise<string> => {
  const key = `${config.baseUrl}|${config.siteId}|${config.userId}`;
  if (cachedToken && cachedToken.key === key && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }
  const res = await fetch(`${config.baseUrl}/v3/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ site_id: config.siteId, user_id: config.userId, password: config.password }),
  });
  if (!res.ok) throw new HttpError(502, `OneStock login failed (${res.status})`);
  const data = await res.json();
  if (!data?.token) throw new HttpError(502, 'OneStock login returned no token');
  cachedToken = { value: data.token, key, expiresAt: Date.now() + TOKEN_TTL_MS };
  return data.token;
};

const call = async (
  config: OnestockConfig,
  method: 'GET' | 'POST',
  path: string,
  params: Record<string, string> = {},
  body?: Record<string, unknown>,
  retry = true,
): Promise<any> => {
  const token = await login(config);
  const url = new URL(`${config.baseUrl}${path}`);
  let init: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };

  if (method === 'GET') {
    Object.entries({ site_id: config.siteId, token, ...params }).forEach(([k, v]) => url.searchParams.set(k, v));
  } else {
    init.body = JSON.stringify({ site_id: config.siteId, token, ...body });
  }

  const res = await fetch(url, init);
  if (res.status === 401 && retry) {
    cachedToken = null;
    return call(config, method, path, params, body, false);
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const message = data?.message || data?.error || `OneStock ${method} ${path} failed (${res.status})`;
    throw new HttpError(res.status === 404 ? 404 : 502, message);
  }
  return data;
};

// ---------------------------------------------------------------------------
// Mapping helpers (OneStock payload -> portal models)
// ---------------------------------------------------------------------------

const pick = (...values: unknown[]) => values.find(v => v !== undefined && v !== null && v !== '');
const str = (v: unknown) => (v === undefined || v === null ? '' : String(v));

const CURRENCY_SYMBOLS: Record<string, string> = { GBP: '£', EUR: '€', USD: '$' };
const currencySymbol = (code: string) => CURRENCY_SYMBOLS[code.toUpperCase()] || code;

// The exchange attribute may be stored as an array or as a comma/semicolon
// separated string, depending on how the catalog feed fills it.
export const parseExchangeAttribute = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(str).map(s => s.trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
  return [];
};

const mapItem = (raw: any, config: OnestockConfig, overrides: Partial<Article> = {}): Article => {
  const info = raw?.information || {};
  const id = str(pick(raw?.id, raw?.item_id, overrides.id));
  const currency = str(pick(overrides.currency, info.currency, config.currency));
  return {
    id,
    sku: id,
    name: str(pick(info.name, raw?.name, info.title, id)),
    price: Number(pick(overrides.price, info.price, raw?.price, 0)),
    currency: currencySymbol(currency),
    color: str(pick(info.color, info.colour, raw?.color)),
    size: str(pick(info.size, raw?.size)),
    imageUrl: str(pick(info.image_url, info.image, info.picture, raw?.image_url, raw?.images?.[0])),
    productId: str(pick(raw?.product_id, info.product_id, info.model, raw?.model)) || undefined,
    exchangeItemIds: parseExchangeAttribute(pick(info[config.exchangeAttribute], raw?.[config.exchangeAttribute])),
    status: overrides.status || '',
    quantity: overrides.quantity || 1,
  };
};

const getItem = async (config: OnestockConfig, itemId: string) => {
  const data = await call(config, 'GET', `/v3/items/${encodeURIComponent(itemId)}`, {
    fields: 'id,product_id,information',
  });
  return data?.item || data;
};

const getItems = async (config: OnestockConfig, ids: string[]) => {
  const results = await Promise.allSettled(ids.map(id => getItem(config, id)));
  return results.flatMap(r => (r.status === 'fulfilled' && r.value ? [r.value] : []));
};

const getOrderLines = (order: any): any[] => {
  if (Array.isArray(order?.line_items)) return order.line_items;
  if (Array.isArray(order?.line_item_groups)) return order.line_item_groups;
  return [];
};

const mapCustomer = (order: any): CustomerDetails => {
  const c = order?.customer || {};
  const addr = order?.delivery?.destination?.address || c.address || order?.billing_address || {};
  return {
    email: str(pick(c.email, order?.email)),
    phone: str(pick(c.phone_number, c.phone, addr.contact?.phone_number)),
    firstName: str(pick(c.first_name, addr.contact?.first_name)),
    lastName: str(pick(c.last_name, addr.contact?.last_name)),
    address: str(pick(Array.isArray(addr.lines) ? addr.lines.join(', ') : addr.lines, addr.street, addr.line1)),
    city: str(addr.city),
    zipCode: str(pick(addr.zip_code, addr.zipcode, addr.postal_code)),
    country: str(pick(addr.country, addr.regions?.country?.code)),
  };
};

// ---------------------------------------------------------------------------
// Public operations
// ---------------------------------------------------------------------------

export const fetchOrder = async (config: OnestockConfig, orderId: string, email?: string): Promise<OrderSummary> => {
  if (!orderId) throw new HttpError(400, 'Missing order id');

  if (isMockMode(config)) {
    if (orderId !== MOCK_ORDER_ID) throw new HttpError(404, `Order ${orderId} not found (mock mode)`);
    return {
      id: MOCK_ORDER_ID,
      customer: MOCK_CUSTOMER,
      articles: ARTICLES.filter(a => MOCK_ORDER_ARTICLE_IDS.includes(a.id)),
      mock: true,
    };
  }

  const data = await call(config, 'GET', `/v3/orders/${encodeURIComponent(orderId)}`, {
    fields: 'id,state,customer,delivery,billing_address,line_items,line_item_groups,pricing_details,information',
  });
  const order = data?.order || data;
  const customer = mapCustomer(order);

  if (email && customer.email && customer.email.toLowerCase() !== email.toLowerCase()) {
    throw new HttpError(404, `Order ${orderId} not found`);
  }

  // Merge identical item ids (OneStock may return one line per unit)
  const lines = new Map<string, { quantity: number; price?: number; state?: string }>();
  for (const line of getOrderLines(order)) {
    const id = str(pick(line.item_id, line.item?.id));
    if (!id) continue;
    const prev = lines.get(id);
    lines.set(id, {
      quantity: (prev?.quantity || 0) + Number(pick(line.quantity, 1)),
      price: Number(pick(line.pricing_details?.price, line.price, prev?.price, NaN)),
      state: str(pick(line.state, prev?.state)),
    });
  }

  const items = await getItems(config, [...lines.keys()]);
  const byId = new Map(items.map(i => [str(pick(i.id, i.item_id)), i]));
  const currency = str(pick(order?.pricing_details?.currency, config.currency));

  const articles = [...lines.entries()].map(([id, line]) =>
    mapItem(byId.get(id) || { id }, config, {
      id,
      quantity: line.quantity,
      status: line.state || 'fulfilled',
      currency,
      ...(Number.isFinite(line.price) ? { price: line.price } : {}),
    }),
  );

  return { id: str(pick(order?.id, orderId)), customer, articles };
};

// Exchange candidates come from the product attribute `exchangeAttribute`
// (e.g. information.exchange_items = "SKU1,SKU2") of the returned item.
export const fetchExchangeOptions = async (config: OnestockConfig, itemId: string): Promise<Article[]> => {
  if (!itemId) throw new HttpError(400, 'Missing item id');

  if (isMockMode(config)) {
    const source = ARTICLES.find(a => a.id === itemId);
    const ids = source?.exchangeItemIds || [];
    return ARTICLES.filter(a => ids.includes(a.id));
  }

  const source = mapItem(await getItem(config, itemId), config);
  const ids = source.exchangeItemIds?.filter(id => id !== itemId) || [];
  if (!ids.length) return [];
  return (await getItems(config, ids)).map(raw => mapItem(raw, config));
};

export const createExchangeOrder = async (
  config: OnestockConfig,
  request: ExchangeOrderRequest,
): Promise<{ id: string; mock?: boolean }> => {
  const lines = (request?.lines || []).filter(l => l.exchangeItemId);
  if (!request?.originalOrderId) throw new HttpError(400, 'Missing original order id');
  if (!lines.length) throw new HttpError(400, 'No exchange line to create');

  const id = `${config.exchangeOrderPrefix}${request.originalOrderId}-${Date.now().toString(36).toUpperCase()}`;
  if (isMockMode(config)) return { id, mock: true };

  const c = request.customer;
  const contact = { first_name: c.firstName, last_name: c.lastName, email: c.email, phone_number: c.phone };
  const address = { contact, lines: [c.address], city: c.city, zip_code: c.zipCode, regions: { country: { code: c.country } } };
  const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

  const order = {
    id,
    types: [config.exchangeOrderType],
    sales_channel: config.salesChannel,
    date: Math.floor(Date.now() / 1000),
    original_order_id: request.originalOrderId,
    customer: { ...contact, id: c.email },
    billing_address: address,
    delivery: { type: 'ship_to_address', destination: { address } },
    pricing_details: { currency: config.currency, price: total },
    line_items: lines.map(l => ({
      item_id: l.exchangeItemId,
      quantity: l.quantity,
      pricing_details: { currency: config.currency, price: l.price },
      information: {
        exchanged_item_id: l.returnedItemId,
        exchange_reason: l.reason,
      },
    })),
    information: {
      original_order_id: request.originalOrderId,
      return_method: request.method,
      exchanged_items: lines.map(l => l.returnedItemId).join(','),
    },
  };

  const data = await call(config, 'POST', '/v3/orders', {}, { order });
  return { id: str(pick(data?.id, data?.order?.id, id)) };
};

// ---------------------------------------------------------------------------
// Framework-agnostic router shared by Vercel functions and Vite dev server
// ---------------------------------------------------------------------------

export interface ApiRequest {
  method: string;
  path: string;
  query: Record<string, string | undefined>;
  body?: any;
}

export const handleApi = async (req: ApiRequest, env: Env = process.env) => {
  const config = getConfig(env);
  try {
    if (req.method === 'GET' && req.path === '/api/order') {
      return { status: 200, json: await fetchOrder(config, str(req.query.id).trim(), req.query.email?.trim()) };
    }
    if (req.method === 'GET' && req.path === '/api/exchange-options') {
      return { status: 200, json: { items: await fetchExchangeOptions(config, str(req.query.item_id).trim()) } };
    }
    if (req.method === 'POST' && req.path === '/api/exchange-orders') {
      return { status: 201, json: await createExchangeOrder(config, req.body) };
    }
    return { status: 404, json: { error: 'Not found' } };
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    return { status, json: { error: err instanceof Error ? err.message : 'Unexpected error' } };
  }
};
