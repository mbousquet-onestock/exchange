import { vercelHandler } from './_handler.js';

// GET /api/order?id=<orderId>&email=<email>
export default vercelHandler('/api/order');
