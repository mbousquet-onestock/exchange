
export type ReturnAction = 'return' | 'exchange';
export type ExchangeType = 'same_model' | 'different_model';

export interface Article {
  id: string;
  name: string;
  price: number;
  currency: string;
  color: string;
  size: string;
  sku: string;
  imageUrl: string;
  status: string;
  quantity: number;
}

export interface SelectionConfig {
  action: ReturnAction;
  reason: string;
  exchangeType?: ExchangeType;
  exchangeSize?: string;
  exchangeColor?: string;
  exchangeArticleId?: string;
}

export interface CustomerDetails {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
}

export enum Step {
  Selection = 1,
  Configuration = 2,
  Method = 3,
  Validation = 4,
  Confirmation = 5
}
