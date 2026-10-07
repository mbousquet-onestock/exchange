import { Article, CustomerDetails } from './types';

// Mock data used when the OneStock credentials are not configured.
// `exchangeItemIds` mimics the product attribute holding the exchange articles.

export const MOCK_ORDER_ID = 'DEMO-0001';

export const MOCK_CUSTOMER: CustomerDetails = {
  email: 'john.doe@onestock-retail.com',
  phone: '+44 7700 900077',
  firstName: 'John',
  lastName: 'Doe',
  address: '123 E-Commerce Street',
  city: 'Manchester',
  zipCode: 'M1 4BT',
  country: 'United Kingdom'
};

const IMG = 'https://storage.googleapis.com/onestock-tools-hosting-hwn8eubny/mbousquet/aistudio';

const tshirt = (id: string, color: string, code: string, size: string, exchangeItemIds: string[]): Article => ({
  id,
  name: 'T-shirt short sleeves',
  price: 9.99,
  currency: '£',
  color,
  size,
  sku: id,
  imageUrl: `${IMG}/15707351_${code}.jpg`,
  productId: '15707351',
  exchangeItemIds,
  status: 'Fulfilled',
  quantity: 1
});

export const ARTICLES: Article[] = [
  tshirt('1006255003062', 'Black', 'BK', 'M', ['1006255003052', '1006255003072', '1006255002072', '1006255001082', '1006102405490']),
  tshirt('1006255002072', 'Grey', 'GY', 'S', ['1006255002082', '1006255003062', '1006255001082', '1006102405490']),
  tshirt('1006255001082', 'White', 'WH', 'M', ['1006255003062', '1006255002082', '1006102405490']),
  {
    id: '1006102405490',
    name: 'Round-neck t-shirt',
    price: 12.99,
    currency: '£',
    color: 'Red',
    size: 'S',
    sku: '1006102405490',
    imageUrl: `${IMG}/15719762_RD.jpg`,
    productId: '15719762',
    exchangeItemIds: [],
    status: 'Fulfilled',
    quantity: 1
  },
  // Variants only available as exchange articles
  tshirt('1006255003052', 'Black', 'BK', 'S', []),
  tshirt('1006255003072', 'Black', 'BK', 'L', []),
  tshirt('1006255002082', 'Grey', 'GY', 'M', [])
];

export const MOCK_ORDER_ARTICLE_IDS = ['1006255003062', '1006255002072', '1006255001082'];
