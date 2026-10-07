// Adapter between Vercel Node functions and the shared OneStock router.
import { handleApi } from '../server/onestock.js';

export const vercelHandler = (path: string) => async (req: any, res: any) => {
  const { status, json } = await handleApi({
    method: req.method,
    path,
    query: req.query || {},
    body: typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body,
    authorization: req.headers?.authorization,
  });
  res.status(status).json(json);
};
