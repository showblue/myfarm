
export interface Produce {
  id: string;
  name: string;
  icon: string;
  seedCost: number;
  sellPrice: number;
  growthTimeInDays: number; // Growth time in game days
}

export enum PlotState {
  EMPTY = 'EMPTY',
  GROWING = 'GROWING',
  READY_FOR_HARVEST = 'READY_FOR_HARVEST',
}

export interface Plot {
  id: number; // Index of the plot
  produceId: string | null;
  plantedAtDay: number | null; // Game day when planted
  state: PlotState;
}

export interface SeedInventoryItem {
  produceId: string;
  quantity: number;
}

export interface HarvestedItem {
  produceId:string;
  quantity: number;
}
