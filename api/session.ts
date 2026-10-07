import { vercelHandler } from './_handler.js';

// POST /api/session (OneStock UI extension context -> session token)
export default vercelHandler('/api/session');
