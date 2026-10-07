// OneStock UI Extension integration (see "UI Extensibility - How to develop
// UI Extensions"): context URL parameters, postMessage handshake and resize.

export interface ExtensionUrlContext {
  extension_id: string;
  user_id: string;
  site_id: string;
  lang: string;
  timezone: string;
  locale: string;
  parent_url: string;
  injection_point_path: string;
  host_app: string;
}

// Payload of the `onestock_data` message (order_id on order pages, order_ids
// on order list actions, ...)
export interface OnestockData {
  extension_signature?: string;
  api_url?: string;
  host_app?: string;
  injection_point_path?: string;
  order_id?: string;
  order_ids?: string[];
  [key: string]: unknown;
}

const URL_KEYS: (keyof ExtensionUrlContext)[] = [
  'extension_id', 'user_id', 'site_id', 'lang', 'timezone', 'locale', 'parent_url', 'injection_point_path', 'host_app',
];

export const readUrlContext = (search = window.location.search): ExtensionUrlContext | null => {
  const params = new URLSearchParams(search);
  if (!params.get('extension_id')) return null;
  return Object.fromEntries(URL_KEYS.map(k => [k, params.get(k) || ''])) as unknown as ExtensionUrlContext;
};

export const isEmbedded = () => window.parent !== window;

const parentOrigin = (ctx: ExtensionUrlContext) => {
  try {
    return new URL(ctx.parent_url).origin;
  } catch {
    return '';
  }
};

const postToParent = (ctx: ExtensionUrlContext, message: Record<string, unknown>) => {
  // Only target the OneStock UI that opened the extension
  const origin = parentOrigin(ctx);
  if (origin && isEmbedded()) window.parent.postMessage(message, origin);
};

// Sends `extension_ready` and resolves with the `onestock_data` payload,
// accepting only messages coming from parent_url.
export const waitForOnestockData = (ctx: ExtensionUrlContext, timeoutMs = 10_000): Promise<OnestockData> =>
  new Promise((resolve, reject) => {
    const origin = parentOrigin(ctx);
    if (!origin) return reject(new Error('Missing or invalid parent_url'));

    const timer = window.setTimeout(() => {
      window.removeEventListener('message', onMessage);
      reject(new Error('No data received from OneStock'));
    }, timeoutMs);

    function onMessage(event: MessageEvent) {
      if (event.origin !== origin || event.data?.type !== 'onestock_data') return;
      window.clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      resolve((event.data.data || {}) as OnestockData);
    }

    window.addEventListener('message', onMessage);
    postToParent(ctx, { type: 'extension_ready' });
  });

// Keeps the OneStock iframe height in sync with the content
export const watchResize = (ctx: ExtensionUrlContext): (() => void) => {
  let last = 0;
  const send = () => {
    const height = Math.ceil(document.documentElement.scrollHeight);
    if (height !== last) {
      last = height;
      postToParent(ctx, { type: 'extension_resize', height });
    }
  };
  const observer = new ResizeObserver(send);
  observer.observe(document.body);
  send();
  return () => observer.disconnect();
};
