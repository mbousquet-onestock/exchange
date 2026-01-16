
import { Order, Scenario } from './types';

export const COLORS = {
  primary: '#00A79D', // OneStock Teal
  secondary: '#2D3E50', // Dark Blue
  accent: '#F39C12', // Orange
  success: '#27AE60',
  error: '#E74C3C',
};

export const MOCK_ORDERS: Order[] = [
  { id: 'ORD-001', client: 'John Doe', priority: 'P1', sku: 'NIKE-AF1-01', quantity: 1, date: '2023-10-25', channel: 'Retail', status: 'Pending' },
  { id: 'ORD-002', client: 'Jane Smith', priority: 'P1', sku: 'ADIDAS-SST-02', quantity: 2, date: '2023-10-25', channel: 'E-commerce', status: 'Pending' },
  { id: 'ORD-003', client: 'Alice Johnson', priority: 'P2', sku: 'PUMA-RSX-03', quantity: 1, date: '2023-10-24', channel: 'Retail', status: 'Pending' },
  { id: 'ORD-004', client: 'Bob Brown', priority: 'P3', sku: 'VANS-OLD-04', quantity: 3, date: '2023-10-24', channel: 'E-commerce', status: 'Pending' },
  { id: 'ORD-005', client: 'Charlie Wilson', priority: 'P1', sku: 'REEBOK-CL-05', quantity: 1, date: '2023-10-25', channel: 'Retail', status: 'Pending' },
  { id: 'ORD-006', client: 'Diana Prince', priority: 'P2', sku: 'ASICS-GL3-06', quantity: 1, date: '2023-10-25', channel: 'Retail', status: 'Pending' },
  { id: 'ORD-007', client: 'Edward Norton', priority: 'P1', sku: 'NEWBAL-574-07', quantity: 2, date: '2023-10-25', channel: 'E-commerce', status: 'Pending' },
];

export const ORCHESTRATION_STRATEGIES = [
  { id: 'os-1', name: 'Click & Collect - Advanced', rulesCount: 7 },
  { id: 'os-2', name: 'Home Delivery - Despacho standard - ES', rulesCount: 9 },
  { id: 'os-3', name: 'Home Delivery - Standard Orders', rulesCount: 8 },
  { id: 'os-4', name: 'Home Delivery - France', rulesCount: 5 },
  { id: 'os-5', name: 'Spare Parts', rulesCount: 6 },
  { id: 'os-6', name: 'Home Delivery - Standard - Italia', rulesCount: 4 },
];

export const MOCK_SCENARIOS: Scenario[] = [
  {
    id: 'SC-1',
    name: 'Priority order',
    description: 'Prioritizes high-priority P1 orders and critical customer segments first.',
    rules: ['Priority P1 orders first', 'Express shipping only', 'Minimal split shipments'],
    metrics: { fulfillmentRate: 85, shippingCost: 4.5, deliveryTime: 3.2, carbonFootprint: 1.2, orderCount: 450, itemCount: 1205 },
    lastExecuted: '2023-10-24 08:00',
    nextExecution: '2023-10-25 08:00',
    status: 'Active'
  },
  {
    id: 'SC-2',
    name: 'UPS Orders',
    description: 'Dedicated routing logic for orders assigned to UPS carrier services.',
    rules: ['UPS Ground routing', 'Specific UPS packaging labels', 'Weight-based tiering'],
    metrics: { fulfillmentRate: 92, shippingCost: 7.8, deliveryTime: 1.1, carbonFootprint: 2.5, orderCount: 380, itemCount: 940 },
    lastExecuted: '2023-10-24 10:00',
    nextExecution: '2023-10-25 10:00',
    status: 'Active'
  },
  {
    id: 'SC-3',
    name: 'DHL Orders',
    description: 'International and express routing specifically optimized for DHL worldwide network.',
    rules: ['DHL Express only', 'Cross-border compliance check', 'Real-time rate calculation'],
    metrics: { fulfillmentRate: 78, shippingCost: 5.2, deliveryTime: 4.5, carbonFootprint: 0.6, orderCount: 290, itemCount: 710 },
    lastExecuted: '2023-10-23 09:00',
    status: 'Draft'
  }
];

export const FIELDS = [
  'Carrier information',
  'Carrier option',
  'Customer information',
  'Delivery method',
  'Delivery Promise',
  'Destination country',
  'Destination information',
  'Destination state',
  'Destination zipcode',
  'Item information',
  'Item quantity',
  'Item unit price',
  'Items price',
  'Order delivery type',
  'Order information',
  'Order original price',
  'Order price',
  'Order sales channel',
  'Order type',
  'Origin country',
  'Origin information',
  'Origin state',
  'Origin zipcode'
];

export const OPERATORS = ['is', 'is not', 'contains', 'in', 'not in', 'greater than', 'less than'];
