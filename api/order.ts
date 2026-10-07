import { vercelHandler } from './_handler';

// GET /api/order?id=<orderId>&email=<email>
export default vercelHandler('/api/order');
