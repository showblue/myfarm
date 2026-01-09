
import { Produce, SeedInventoryItem, Plot, PlotState } from './types';

export const AVAILABLE_PRODUCE: Produce[] = [
  { id: 'tomato', name: 'Tomato', icon: '🍅', seedCost: 5, sellPrice: 15, growthTimeInDays: 3 },
  { id: 'strawberry', name: 'Strawberry', icon: '🍓', seedCost: 10, sellPrice: 25, growthTimeInDays: 2 },
  { id: 'carrot', name: 'Carrot', icon: '🥕', seedCost: 3, sellPrice: 12, growthTimeInDays: 4 },
  { id: 'corn', name: 'Corn', icon: '🌽', seedCost: 8, sellPrice: 30, growthTimeInDays: 5 },
  { id: 'potato', name: 'Potato', icon: '🥔', seedCost: 6, sellPrice: 20, growthTimeInDays: 4 },
  { id: 'wheat', name: 'Wheat', icon: '🌾', seedCost: 4, sellPrice: 10, growthTimeInDays: 6 },
];

export const INITIAL_CASH = 100;
export const FARM_PLOT_COUNT = 9; // 3x3 grid
export const INITIAL_SEEDS: SeedInventoryItem[] = [
  { produceId: 'tomato', quantity: 5 },
  { produceId: 'strawberry', quantity: 3 },
];

export const DAYS_IN_WEEK = 7; // Game days for sales cycle (changed from DAYS_IN_MONTH)
export const HOURS_IN_DAY = 24; // Game hours in a game day
export const GAME_TICK_INTERVAL_MS = 200; // Real-time milliseconds for one game hour

export const INITIAL_PLOTS: Plot[] = Array.from({ length: FARM_PLOT_COUNT }, (_, i) => ({
  id: i,
  produceId: null,
  plantedAtDay: null,
  state: PlotState.EMPTY,
}));

export const PLOT_GROWTH_VISUALS = {
  [PlotState.EMPTY]: {
    bgColor: 'bg-amber-200',
    borderColor: 'border-amber-500',
    hoverBgColor: 'hover:bg-amber-300',
    text: 'Empty Plot',
  },
  [PlotState.GROWING]: {
    bgColor: 'bg-lime-200',
    borderColor: 'border-lime-500',
    hoverBgColor: 'hover:bg-lime-300',
    text: 'Growing',
  },
  [PlotState.READY_FOR_HARVEST]: {
    bgColor: 'bg-yellow-200',
    borderColor: 'border-yellow-500',
    hoverBgColor: 'hover:bg-yellow-300',
    text: 'Ready!',
    actionText: 'Harvest',
  }
};

// Constants for Automation
export const STRAWBERRY_ID = 'strawberry';
export const AUTO_BUY_STRAWBERRY_PRIORITY_THRESHOLD = 3; // If strawberry seeds < this, prioritize buying them.
export const AUTO_BUY_STRAWBERRY_BATCH_SIZE = 5;
export const AUTO_BUY_ANY_SEED_TOTAL_THRESHOLD = 2; // If total seeds of *all types* < this (and strawberries not bought), buy cheapest.
export const AUTO_BUY_CHEAPEST_BATCH_SIZE = 3;
