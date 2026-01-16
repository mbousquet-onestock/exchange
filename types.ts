
export interface Condition {
  id: string;
  field: string;
  operator: string;
  value: string;
  joiner?: 'AND' | 'OR';
  infoFieldName?: string;
  infoFieldType?: string;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  rules: string[];
  metrics: {
    fulfillmentRate: number;
    shippingCost: number;
    deliveryTime: number;
    carbonFootprint: number;
    orderCount: number;
    itemCount: number;
  };
  lastExecuted?: string;
  nextExecution?: string;
  status?: 'Active' | 'Draft' | 'Scheduled';
}

export interface Order {
  id: string;
  client: string;
  priority: 'P1' | 'P2' | 'P3';
  sku: string;
  quantity: number;
  date: string;
  channel: string;
  status: string;
  proposedStockPoint?: string;
}

export enum Step {
  StrategyManagement = 0,
  OrderSelection = 1,
  OrchestrationScenarios = 2,
  ResultsVisualization = 3,
  Comparison = 4
}
