import React from 'react';
import { Article } from './types';

export const ARTICLES: Article[] = [
  {
    id: '1006255003062',
    name: 'T-shirt short sleeves',
    price: 9.99,
    currency: '£',
    color: 'Black',
    size: 'M',
    sku: '1006255003062',
    imageUrl: 'https://storage.googleapis.com/onestock-tools-hosting-hwn8eubny/mbousquet/aistudio/15707351_BK.jpg',
    status: 'Fulfilled',
    quantity: 1
  },
  {
    id: '1006255002072',
    name: 'T-shirt short sleeves',
    price: 9.99,
    currency: '£',
    color: 'Grey',
    size: 'S',
    sku: '1006255002072',
    imageUrl: 'https://storage.googleapis.com/onestock-tools-hosting-hwn8eubny/mbousquet/aistudio/15707351_GY.jpg',
    status: 'Fulfilled',
    quantity: 1
  },
  {
    id: '1006255001082',
    name: 'T-shirt short sleeves',
    price: 9.99,
    currency: '£',
    color: 'White',
    size: 'M',
    sku: '1006255001082',
    imageUrl: 'https://storage.googleapis.com/onestock-tools-hosting-hwn8eubny/mbousquet/aistudio/15707351_WH.jpg',
    status: 'Fulfilled',
    quantity: 1
  },
  {
    id: '1006102405490',
    name: 'Round-neck t-shirt',
    price: 12.99,
    currency: '£',
    color: 'Red',
    size: 'S',
    sku: '1006102405490',
    imageUrl: 'https://storage.googleapis.com/onestock-tools-hosting-hwn8eubny/mbousquet/aistudio/15719762_RD.jpg',
    status: 'Fulfilled',
    quantity: 1
  }
];

export const REASONS = [
  "Too small",
  "Too big",
  "Damaged item",
  "Color not as expected",
  "Style doesn't suit me",
  "Changed my mind"
];

export const SIZES = ['XS', 'S', 'M', 'L', 'XL'];
export const COLORS = ['Black', 'Grey', 'White', 'Navy', 'Red'];

export const METHODS = [
  {
    id: 'in-store',
    label: 'In store return',
    description: 'Drop off at any of our retail locations.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )
  },
  {
    id: 'ups',
    label: 'UPS: Standard delivery',
    description: 'Drop off at a UPS Access Point.',
    icon: (
      <img src="https://storage.googleapis.com/onestock-tools-hosting-hwn8eubny/mbousquet/aistudio/UPS.png" className="w-6 h-auto" alt="UPS" />
    )
  }
];