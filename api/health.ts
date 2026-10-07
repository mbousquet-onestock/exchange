import { vercelHandler } from './_handler.js';

// GET /api/health (configuration diagnostics, no secret values)
export default vercelHandler('/api/health');
