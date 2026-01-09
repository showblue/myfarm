
import React, { useState } from 'react';
import { SeedInventoryItem, HarvestedItem, Produce } from '../types';
import { AVAILABLE_PRODUCE } from '../constants';

interface ControlPanelProps {
  seedInventory: SeedInventoryItem[];
  harvestedProduce: HarvestedItem[];
  onBuySeed: (produceId: string, quantity: number) => void;
  getProduceDetails: (id: string | null) => Produce | undefined;
}

enum Tab {
  INVENTORY = 'INVENTORY', 
  SHOP = 'SHOP',
  HARVESTED = 'HARVESTED',
}

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 sm:px-4 text-sm sm:text-base font-semibold rounded-t-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-400
      ${active ? 'bg-green-600 text-white' : 'bg-green-200 text-green-800 hover:bg-green-300'}`}
    aria-pressed={active}
  >
    {children}
  </button>
);

export const ControlPanel: React.FC<ControlPanelProps> = ({
  seedInventory,
  harvestedProduce,
  onBuySeed,
  getProduceDetails,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.INVENTORY);
  const [buyQuantities, setBuyQuantities] = useState<{[key: string]: number}>({});

  const handleQuantityChange = (produceId: string, value: string) => {
    const numValue = parseInt(value, 10);
    setBuyQuantities(prev => ({...prev, [produceId]: Math.max(1, numValue) || 1}));
  };

  return (
    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-lg h-full flex flex-col">
      <div className="flex border-b-2 border-green-600 mb-4">
        <TabButton active={activeTab === Tab.INVENTORY} onClick={() => setActiveTab(Tab.INVENTORY)}>Seed Stock</TabButton>
        <TabButton active={activeTab === Tab.SHOP} onClick={() => setActiveTab(Tab.SHOP)}>Seed Shop</TabButton>
        <TabButton active={activeTab === Tab.HARVESTED} onClick={() => setActiveTab(Tab.HARVESTED)}>Harvested</TabButton>
      </div>

      <div className="flex-grow overflow-y-auto pr-1 sm:pr-2">
        {activeTab === Tab.INVENTORY && (
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-green-700 mb-3">Your Seed Inventory</h3>
            {seedInventory.length === 0 && <p className="text-gray-600 text-sm sm:text-base">You have no seeds. Automation will try to buy some, or visit the shop!</p>}
            <ul className="space-y-2">
              {seedInventory.map(item => {
                const produce = getProduceDetails(item.produceId);
                if (!produce) return null;
                return (
                  <li
                    key={item.produceId}
                    className={`p-3 border rounded-lg transition-all duration-150 flex items-center justify-between bg-gray-50 border-gray-300`}
                  >
                    <div>
                      <span className="text-xl sm:text-2xl mr-2" aria-hidden="true">{produce.icon}</span>
                      <span className="font-medium">{produce.name}</span>
                    </div>
                    <span className={`font-bold text-lg text-gray-700`}>x{item.quantity}</span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 p-2 bg-green-50 text-green-700 rounded-md text-center text-sm">
              Planting is now automated! The farm will use these seeds.
            </p>
          </div>
        )}

        {activeTab === Tab.SHOP && (
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-green-700 mb-3">Buy Seeds</h3>
            <ul className="space-y-3">
              {AVAILABLE_PRODUCE.map(produce => (
                <li key={produce.id} className="p-3 border border-gray-300 rounded-lg bg-gray-50 shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xl sm:text-2xl mr-2" aria-hidden="true">{produce.icon}</span>
                      <span className="font-medium text-gray-800">{produce.name}</span>
                    </div>
                    <span className="text-green-600 font-semibold">${produce.seedCost} / seed</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">Grows in {produce.growthTimeInDays} days. Sells for ${produce.sellPrice}.</p>
                  <div className="flex items-center space-x-2">
                    <label htmlFor={`buy-${produce.id}`} className="sr-only">Quantity to buy {produce.name}</label>
                    <input 
                      type="number"
                      id={`buy-${produce.id}`}
                      min="1"
                      value={buyQuantities[produce.id] || 1}
                      onChange={(e) => handleQuantityChange(produce.id, e.target.value)}
                      className="w-16 sm:w-20 p-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      aria-label={`Quantity for ${produce.name}`}
                    />
                    <button
                      onClick={() => onBuySeed(produce.id, buyQuantities[produce.id] || 1)}
                      className="px-3 py-1.5 sm:px-4 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-150 font-semibold text-sm sm:text-base"
                    >
                      Buy
                    </button>
                  </div>
                </li>
              ))}
            </ul>
             <p className="mt-4 p-2 bg-yellow-50 text-yellow-700 rounded-md text-center text-sm">
              Automation will also buy seeds if stocks are low and cash is available.
            </p>
          </div>
        )}

        {activeTab === Tab.HARVESTED && (
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-green-700 mb-3">Harvested Produce</h3>
            <p className="text-sm text-gray-500 mb-3">This produce will be sold automatically at the end of the week.</p>
            {harvestedProduce.length === 0 && <p className="text-gray-600 text-sm sm:text-base">No produce harvested yet for this week.</p>}
            <ul className="space-y-2">
              {harvestedProduce.map(item => {
                const produce = getProduceDetails(item.produceId);
                if (!produce) return null;
                return (
                  <li key={item.produceId} className="p-3 border border-gray-300 rounded-lg bg-yellow-50 flex items-center justify-between">
                     <div>
                      <span className="text-xl sm:text-2xl mr-2" aria-hidden="true">{produce.icon}</span>
                      <span className="font-medium text-gray-800">{produce.name}</span>
                    </div>
                    <span className="font-bold text-lg text-yellow-700">x{item.quantity}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
