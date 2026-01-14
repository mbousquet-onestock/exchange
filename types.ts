
export type ReturnAction = 'return' | 'exchange';

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
  exchangeSize?: string;
  exchangeColor?: string;
}

export interface CustomerDetails {
  email: string;
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
