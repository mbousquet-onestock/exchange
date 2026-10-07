// Server-side OneStock API client.
// Credentials never reach the browser: the frontend only calls /api/* routes,
// which are served by Vercel functions (api/) in production and by a Vite
// middleware (see vite.config.ts) in development.

import type { Article, CustomerDetails, ExchangeOrderRequest, OrderSummary } from '../types.js';
import { ARTICLES, MOCK_ORDER_ARTICLE_IDS, MOCK_ORDER_ID, MOCK_CUSTOMER } from '../mockData.js';
import { isTruthy, loadSettings, writeApiLog } from './db.js';
import {
  bearerToken, createSessionToken, getExtensionSecrets, isSessionRequired,
  verifyExtensionSignature, verifySessionToken, type ExtensionContext, type SessionClaims,
} from './session.js';

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
  // Language of the item features (settings key `default_lang`)
  lang: string;
  // Value of the `environment` column in the settings / api_logs tables
  environment: string;
  // Settings key `api_logs_enabled`: write every OneStock call to api_logs
  logsEnabled: boolean;
  env: Env;
}

// API root + version (https://<host>/v3), the root may already contain it
const withVersion = (root: string) => {
  const base = root.replace(/\/+$/, '');
  return /\/v\d+$/.test(base) ? base : `${base}/v3`;
};

export const getConfig = (env: Env = process.env): OnestockConfig => ({
  baseUrl: withVersion(env.ONESTOCK_API_URL || 'https://api.onestock-retail.com'),
  siteId: env.ONESTOCK_SITE_ID || '',
  userId: env.ONESTOCK_USER_ID || '',
  password: env.ONESTOCK_PASSWORD || '',
  exchangeAttribute: env.ONESTOCK_EXCHANGE_ATTRIBUTE || 'exchange_items',
  exchangeOrderPrefix: env.ONESTOCK_EXCHANGE_ORDER_PREFIX || 'EXC-',
  // OneStock order types: ffs (home delivery), ckc, ropis, ois
  exchangeOrderType: env.ONESTOCK_EXCHANGE_ORDER_TYPE || 'ffs',
  salesChannel: env.ONESTOCK_SALES_CHANNEL || 'returns_portal',
  currency: env.ONESTOCK_CURRENCY || 'GBP',
  lang: env.ONESTOCK_LANG || 'fr',
  environment: env.APP_ENVIRONMENT || 'qualif',
  logsEnabled: false,
  env,
});

// Env config completed with the shared `settings` table:
// - onestock_api_root overrides ONESTOCK_API_URL
// - api_logs_enabled enables the api_logs table
// When opened as a OneStock UI extension, the site comes from the verified
// extension context instead of ONESTOCK_SITE_ID.
export const resolveConfig = async (env: Env = process.env, session?: SessionClaims | null): Promise<OnestockConfig> => {
  const base = getConfig(env);
  const config = session?.site_id ? { ...base, siteId: session.site_id } : base;
  const settings = await loadSettings(env, { siteId: config.siteId, environment: config.environment });
  return {
    ...config,
    baseUrl: withVersion(settings.onestock_api_root || config.baseUrl),
    lang: settings.default_lang || config.lang,
    logsEnabled: isTruthy(settings.api_logs_enabled),
  };
};

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

const SECRET_KEYS = new Set(['password', 'token']);
const MASK = '***';

// Removes credentials before a request is written to api_logs
const maskSecrets = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(maskSecrets);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, SECRET_KEYS.has(k) ? MASK : maskSecrets(v)]),
    );
  }
  return value;
};

const maskUrl = (url: URL) => {
  const masked = new URL(url);
  SECRET_KEYS.forEach(k => masked.searchParams.has(k) && masked.searchParams.set(k, MASK));
  return decodeURIComponent(masked.toString());
};

const parseJson = (text: string) => {
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
};

// fetch() + api_logs entry when logging is enabled in settings.
// OneStock GET routes take their parameters as a JSON body: fetch() cannot
// send a body with GET, so they go through POST + X-HTTP-Method-Override.
const loggedFetch = async (
  config: OnestockConfig,
  method: 'GET' | 'POST',
  url: URL,
  body: Record<string, unknown>,
): Promise<{ status: number; data: any }> => {
  const started = Date.now();
  let status: number | null = null;
  let data: any = null;
  let error: string | null = null;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(method === 'GET' ? { 'X-HTTP-Method-Override': 'GET' } : {}),
      },
      body: JSON.stringify(body),
    });
    status = res.status;
    data = parseJson(await res.text());
    if (!res.ok) error = data?.message || data?.error || `HTTP ${res.status}`;
    return { status, data };
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    throw new HttpError(502, `OneStock unreachable: ${error}`);
  } finally {
    if (config.logsEnabled) {
      await writeApiLog(config.env, {
        method,
        url: maskUrl(url),
        request: maskSecrets(body),
        status,
        durationMs: Date.now() - started,
        response: maskSecrets(data),
        error,
        siteId: config.siteId,
        environment: config.environment,
      });
    }
  }
};

let cachedToken: { value: string; key: string; expiresAt: number } | null = null;
const TOKEN_TTL_MS = 50 * 60 * 1000;

const login = async (config: OnestockConfig): Promise<string> => {
  const key = `${config.baseUrl}|${config.siteId}|${config.userId}`;
  if (cachedToken && cachedToken.key === key && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }
  const { status, data } = await loggedFetch(config, 'POST', new URL(`${config.baseUrl}/login`), {
    site_id: config.siteId,
    user_id: config.userId,
    password: config.password,
  });
  if (status < 200 || status >= 300) throw new HttpError(502, `OneStock login failed (${status})`);
  if (!data?.token) throw new HttpError(502, 'OneStock login returned no token');
  cachedToken = { value: data.token, key, expiresAt: Date.now() + TOKEN_TTL_MS };
  return data.token;
};

const call = async (
  config: OnestockConfig,
  method: 'GET' | 'POST',
  path: string,
  body: Record<string, unknown> = {},
  retry = true,
): Promise<any> => {
  const token = await login(config);
  const url = new URL(`${config.baseUrl}${path}`);
  const { status, data } = await loggedFetch(config, method, url, { site_id: config.siteId, token, ...body });
  if (status === 401 && retry) {
    cachedToken = null;
    return call(config, method, path, body, false);
  }
  if (status < 200 || status >= 300) {
    const message = data?.message || data?.error || `OneStock ${method} ${path} failed (${status})`;
    throw new HttpError(status === 404 ? 404 : 502, message);
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

// Item features names read from the catalog (features are language dependent
// and every value is an array, e.g. features.fr.name = ["T-shirt"])
const ITEM_FEATURES = ['name', 'color', 'size', 'price', 'image_url'];

const itemFeatures = (raw: any, lang: string): Record<string, unknown> => {
  const features = raw?.features || {};
  // GET /items returns { <lang>: { name: [...] } }, order items return { name: [...] }
  const byLang = features[lang] || Object.values(features).find(v => v && typeof v === 'object' && !Array.isArray(v));
  return (byLang as Record<string, unknown>) || features;
};

const first = (v: unknown) => (Array.isArray(v) ? v[0] : v);

const mapItem = (raw: any, config: OnestockConfig, overrides: Partial<Article> = {}): Article => {
  const f = itemFeatures(raw, config.lang);
  const id = str(pick(raw?.id, raw?.item_id, overrides.id));
  return {
    id,
    sku: id,
    name: str(pick(first(f.name), id)),
    price: Number(pick(overrides.price, first(f.price), 0)),
    currency: currencySymbol(str(pick(overrides.currency, config.currency))),
    color: str(first(f.color)),
    size: str(first(f.size)),
    imageUrl: str(first(f.image_url)),
    productId: str(raw?.product_id) || undefined,
    exchangeItemIds: [...new Set(parseExchangeAttribute(f[config.exchangeAttribute]).flatMap(v => parseExchangeAttribute(v)))],
    status: overrides.status || '',
    quantity: overrides.quantity || 1,
  };
};

// GET /items filtered on the item ids
const getItems = async (config: OnestockConfig, ids: string[]): Promise<any[]> => {
  if (!ids.length) return [];
  const data = await call(config, 'GET', '/items', {
    item_ids: ids,
    filters: { ids },
    fields: ['product_id'],
    features: [...ITEM_FEATURES, config.exchangeAttribute],
    lang: config.lang,
    pagination: { limit: Math.min(ids.length, 100), start: 0 },
  });
  const wanted = new Set(ids);
  return (data?.items || []).filter((i: any) => wanted.has(str(i?.id)));
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

  const order = await call(config, 'GET', `/orders/${encodeURIComponent(orderId)}`, {
    fields: [
      'id', 'state', 'types', 'customer', 'delivery.type', 'delivery.destination.address', 'pricing_details',
      'order_items.id', 'order_items.item_id', 'order_items.quantity', 'order_items.pricing_details',
      'line_item_groups.order_item_id', 'line_item_groups.item_id', 'line_item_groups.quantity', 'line_item_groups.state',
    ],
  });
  const customer = mapCustomer(order);

  if (email && customer.email && customer.email.toLowerCase() !== email.toLowerCase()) {
    throw new HttpError(404, `Order ${orderId} not found`);
  }

  // State of each order item, from its line item groups
  const states = new Map<string, string>();
  for (const group of order?.line_item_groups || []) {
    const key = str(pick(group.order_item_id, group.item_id));
    if (key && group.state && !states.has(key)) states.set(key, str(group.state));
  }

  // Merge order items sharing the same item id
  const lines = new Map<string, { quantity: number; price?: number; state?: string }>();
  for (const orderItem of order?.order_items || []) {
    const id = str(orderItem.item_id);
    if (!id) continue;
    const prev = lines.get(id);
    const pricing = orderItem.pricing_details || {};
    lines.set(id, {
      quantity: (prev?.quantity || 0) + Number(pick(orderItem.quantity, 1)),
      price: Number(pick(pricing.unit_price, pricing.price, prev?.price, NaN)),
      state: str(pick(prev?.state, states.get(str(orderItem.id)), states.get(id), order?.state)),
    });
  }

  const items = await getItems(config, [...lines.keys()]);
  const byId = new Map(items.map(i => [str(i.id), i]));
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

  const [raw] = await getItems(config, [itemId]);
  if (!raw) throw new HttpError(404, `Item ${itemId} not found`);
  const source = mapItem(raw, config);
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
    types: config.exchangeOrderType.split(',').map(t => t.trim()).filter(Boolean),
    sales_channel: config.salesChannel,
    date: Math.floor(Date.now() / 1000),
    customer: contact,
    delivery: { type: 'standard', destination: { address } },
    pricing_details: { currency: config.currency, price: total, address },
    order_items: lines.map(l => ({
      item_id: l.exchangeItemId,
      quantity: l.quantity,
      pricing_details: { price: l.price * l.quantity, unit_price: l.price },
      information: {
        exchanged_item_id: l.returnedItemId,
        exchange_reason: l.reason,
      },
    })),
    information: {
      order_kind: 'exchange',
      original_order_id: request.originalOrderId,
      return_method: request.method,
      exchanged_items: lines.map(l => l.returnedItemId).join(','),
    },
  };

  // The API answers 204 with an optional { id } body
  const data = await call(config, 'POST', '/orders', { order });
  return { id: str(pick(data?.id, id)) };
};

// ---------------------------------------------------------------------------
// Framework-agnostic router shared by Vercel functions and Vite dev server
// ---------------------------------------------------------------------------

export interface ApiRequest {
  method: string;
  path: string;
  query: Record<string, string | undefined>;
  body?: any;
  authorization?: string;
}

// POST /api/session: exchanges the OneStock extension context for a session token
const openSession = (env: Env, body: any) => {
  const ctx: ExtensionContext = {
    extension_id: str(body?.extension_id),
    user_id: str(body?.user_id),
    site_id: str(body?.site_id),
    extension_signature: str(body?.extension_signature),
  };
  if (!ctx.extension_id || !ctx.user_id || !ctx.site_id) throw new HttpError(400, 'Incomplete extension context');

  if (isSessionRequired(env) && !verifyExtensionSignature(ctx, getExtensionSecrets(env))) {
    throw new HttpError(401, 'Invalid extension signature');
  }
  const { token, expiresAt } = createSessionToken(env, {
    site_id: ctx.site_id,
    user_id: ctx.user_id,
    extension_id: ctx.extension_id,
  });
  return { token, expiresAt, verified: isSessionRequired(env) };
};

export const handleApi = async (req: ApiRequest, env: Env = process.env) => {
  try {
    if (req.method === 'POST' && req.path === '/api/session') {
      return { status: 201, json: openSession(env, req.body) };
    }

    const session = verifySessionToken(env, bearerToken(req.authorization));
    if (isSessionRequired(env) && !session) throw new HttpError(401, 'Missing or expired session');

    // An unverified context (no secrets configured) never changes the site
    const config = await resolveConfig(env, isSessionRequired(env) ? session : null);
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
