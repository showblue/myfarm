
import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { FarmPlotComponent } from './components/FarmPlot';
import { ControlPanel } from './components/ControlPanel';
import { Produce, Plot, PlotState, SeedInventoryItem, HarvestedItem } from './types';
import { 
  AVAILABLE_PRODUCE, INITIAL_CASH, INITIAL_SEEDS, INITIAL_PLOTS, 
  DAYS_IN_WEEK, HOURS_IN_DAY, GAME_TICK_INTERVAL_MS,
  STRAWBERRY_ID, AUTO_BUY_STRAWBERRY_PRIORITY_THRESHOLD, AUTO_BUY_STRAWBERRY_BATCH_SIZE,
  AUTO_BUY_ANY_SEED_TOTAL_THRESHOLD, AUTO_BUY_CHEAPEST_BATCH_SIZE
} from './constants';

const App: React.FC = () => {
  const [gameDay, setGameDay] = useState<number>(1);
  const [gameHour, setGameHour] = useState<number>(0);
  const [cash, setCash] = useState<number>(INITIAL_CASH);
  const [plots, setPlots] = useState<Plot[]>(INITIAL_PLOTS);
  const [seedInventory, setSeedInventory] = useState<SeedInventoryItem[]>(INITIAL_SEEDS);
  const [harvestedProduce, setHarvestedProduce] = useState<HarvestedItem[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  // Notification clear effect
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Effect for Game Time Progression & Plot Growth
  useEffect(() => {
    const gameTick = setInterval(() => {
      setGameHour(prevGameHour => {
        let newGameHour = prevGameHour + 1;
        if (newGameHour >= HOURS_IN_DAY) {
          newGameHour = 0;
          setGameDay(prevGameDay => {
            const nextDay = prevGameDay + 1;
            setPlots(currentPlots => currentPlots.map(plot => {
              if (plot.produceId && plot.plantedAtDay && plot.state === PlotState.GROWING) {
                const produce = AVAILABLE_PRODUCE.find(p => p.id === plot.produceId);
                if (produce && (nextDay - plot.plantedAtDay >= produce.growthTimeInDays)) {
                  return { ...plot, state: PlotState.READY_FOR_HARVEST };
                }
              }
              return plot;
            }));
            return nextDay;
          });
        }
        return newGameHour;
      });
    }, GAME_TICK_INTERVAL_MS);
    return () => clearInterval(gameTick);
  }, []);


  // Effect for Daily Automation and Weekly Sales
  useEffect(() => {
    if (gameHour !== 0) {
      return;
    }

    let dailyActivityReport: string[] = [];

    let currentPlots = [...plots];
    let currentSeedInventory = JSON.parse(JSON.stringify(seedInventory)) as SeedInventoryItem[];
    let currentCash = cash;
    let currentHarvestedProduce = JSON.parse(JSON.stringify(harvestedProduce)) as HarvestedItem[];

    let plotsUpdated = false;
    let seedInventoryUpdated = false;
    let cashUpdated = false;
    let harvestedProduceUpdated = false;

    // 1. Auto-Harvest
    const newHarvestedItemsThisCycle: HarvestedItem[] = [];
    currentPlots = currentPlots.map(plot => {
      if (plot.state === PlotState.READY_FOR_HARVEST && plot.produceId) {
        const produceHarvested = AVAILABLE_PRODUCE.find(p => p.id === plot.produceId);
        if (produceHarvested) {
          newHarvestedItemsThisCycle.push({ produceId: plot.produceId, quantity: 1 });
          dailyActivityReport.push(`Auto-harvested ${produceHarvested.name} from plot ${plot.id + 1}.`);
          plotsUpdated = true;
          return { ...INITIAL_PLOTS.find(p=>p.id === plot.id)! }; 
        }
      }
      return plot;
    });

    if (newHarvestedItemsThisCycle.length > 0) {
      newHarvestedItemsThisCycle.forEach(newItem => {
        const existing = currentHarvestedProduce.find(item => item.produceId === newItem.produceId);
        if (existing) {
          existing.quantity += newItem.quantity;
        } else {
          currentHarvestedProduce.push(newItem);
        }
      });
      harvestedProduceUpdated = true;
    }
    
    // 2. Auto-Plant
    for (let i = 0; i < currentPlots.length; i++) {
      if (currentPlots[i].state === PlotState.EMPTY) {
        let plantedThisPlot = false;
        
        const strawberrySeedIndex = currentSeedInventory.findIndex(s => s.produceId === STRAWBERRY_ID && s.quantity > 0);
        if (strawberrySeedIndex !== -1) {
          const produceDetails = AVAILABLE_PRODUCE.find(p => p.id === STRAWBERRY_ID);
          if (produceDetails) {
            currentPlots[i] = { ...currentPlots[i], produceId: STRAWBERRY_ID, plantedAtDay: gameDay, state: PlotState.GROWING };
            currentSeedInventory[strawberrySeedIndex].quantity--;
            dailyActivityReport.push(`Auto-planted ${produceDetails.name} on plot ${currentPlots[i].id + 1}.`);
            plantedThisPlot = true;
            plotsUpdated = true;
            seedInventoryUpdated = true;
          }
        }

        if (plantedThisPlot) continue;

        const otherSeedIndex = currentSeedInventory.findIndex(s => s.quantity > 0);
        if (otherSeedIndex !== -1) {
          const seedToPlant = currentSeedInventory[otherSeedIndex];
          const produceDetails = AVAILABLE_PRODUCE.find(p => p.id === seedToPlant.produceId);
          if (produceDetails) {
            currentPlots[i] = { ...currentPlots[i], produceId: seedToPlant.produceId, plantedAtDay: gameDay, state: PlotState.GROWING };
            currentSeedInventory[otherSeedIndex].quantity--;
            dailyActivityReport.push(`Auto-planted ${produceDetails.name} on plot ${currentPlots[i].id + 1}.`);
            plotsUpdated = true;
            seedInventoryUpdated = true;
          }
        }
      }
    }
    if (seedInventoryUpdated) {
        currentSeedInventory = currentSeedInventory.filter(s => s.quantity > 0);
    }

    // 3. Auto-Shop
    let boughtStrawberriesThisCycle = false;
    const strawberryProduceInfo = AVAILABLE_PRODUCE.find(p => p.id === STRAWBERRY_ID);
    if (strawberryProduceInfo) {
        const currentStrawberrySeedCount = currentSeedInventory.find(s => s.produceId === STRAWBERRY_ID)?.quantity || 0;
        if (currentStrawberrySeedCount < AUTO_BUY_STRAWBERRY_PRIORITY_THRESHOLD && currentCash >= strawberryProduceInfo.seedCost) {
            const maxCanBuy = Math.floor(currentCash / strawberryProduceInfo.seedCost);
            const quantityToBuy = Math.min(maxCanBuy, AUTO_BUY_STRAWBERRY_BATCH_SIZE);
            if (quantityToBuy > 0) {
                currentCash -= (quantityToBuy * strawberryProduceInfo.seedCost);
                cashUpdated = true;
                const existingSeed = currentSeedInventory.find(s => s.produceId === STRAWBERRY_ID);
                if (existingSeed) {
                    existingSeed.quantity += quantityToBuy;
                } else {
                    currentSeedInventory.push({ produceId: STRAWBERRY_ID, quantity: quantityToBuy });
                }
                seedInventoryUpdated = true;
                dailyActivityReport.push(`Auto-purchased ${quantityToBuy} ${strawberryProduceInfo.name} seeds.`);
                boughtStrawberriesThisCycle = true;
            }
        }
    }

    if (!boughtStrawberriesThisCycle) {
        const totalSeedsInInventory = currentSeedInventory.reduce((sum, s) => sum + s.quantity, 0);
        if (totalSeedsInInventory < AUTO_BUY_ANY_SEED_TOTAL_THRESHOLD && AVAILABLE_PRODUCE.length > 0) {
            let cheapestSeed = null;
            for (const p of AVAILABLE_PRODUCE) {
                if (!cheapestSeed || p.seedCost < cheapestSeed.seedCost) {
                    cheapestSeed = p;
                }
            }

            if (cheapestSeed && currentCash >= cheapestSeed.seedCost) {
                const maxCanBuy = Math.floor(currentCash / cheapestSeed.seedCost);
                const quantityToBuy = Math.min(maxCanBuy, AUTO_BUY_CHEAPEST_BATCH_SIZE);
                if (quantityToBuy > 0) {
                    currentCash -= (quantityToBuy * cheapestSeed.seedCost);
                    cashUpdated = true;
                    const existingSeed = currentSeedInventory.find(s => s.produceId === cheapestSeed!.id);
                    if (existingSeed) {
                        existingSeed.quantity += quantityToBuy;
                    } else {
                        currentSeedInventory.push({ produceId: cheapestSeed.id, quantity: quantityToBuy });
                    }
                    seedInventoryUpdated = true;
                    dailyActivityReport.push(`Auto-purchased ${quantityToBuy} ${cheapestSeed.name} seeds.`);
                }
            }
        }
    }

    if (plotsUpdated) setPlots(currentPlots);
    if (seedInventoryUpdated) setSeedInventory(currentSeedInventory);
    if (cashUpdated) setCash(currentCash); // Apply cash changes from auto-shop
    if (harvestedProduceUpdated) setHarvestedProduce(currentHarvestedProduce);

    // 4. Weekly Sale
    if (gameDay > 0 && gameDay % DAYS_IN_WEEK === 0) {
      // Use the already updated currentHarvestedProduce and currentCash for this scope
      const produceToSell = currentHarvestedProduce; // Use the one that has items from this cycle's harvest
      
      if (produceToSell.length === 0 && gameDay > DAYS_IN_WEEK) { 
        dailyActivityReport.push("Nothing sold this week.");
      } else if (produceToSell.length > 0) {
        let weekEarnings = 0;
        let salesSummary = "Weekly Sales:\n";
        produceToSell.forEach(item => {
          const produceInfo = AVAILABLE_PRODUCE.find(p => p.id === item.produceId);
          if (produceInfo) {
            const earningsFromItem = item.quantity * produceInfo.sellPrice;
            weekEarnings += earningsFromItem;
            salesSummary += `${produceInfo.name} x${item.quantity}: $${earningsFromItem}\n`;
          }
        });
        salesSummary += `Total: $${weekEarnings}`;
        
        // Add earnings to currentCash which will be set
        currentCash += weekEarnings; 
        cashUpdated = true; // Mark cash as updated again if sales occurred
        
        dailyActivityReport.push(salesSummary);
        currentHarvestedProduce = []; // Clear for next week
        harvestedProduceUpdated = true; // Mark for update
      }
    }
    
    // Apply final state updates including sales effects
    if (cashUpdated) setCash(currentCash);
    if (harvestedProduceUpdated) setHarvestedProduce(currentHarvestedProduce);
    
    if (dailyActivityReport.length > 0) {
      setNotification(dailyActivityReport.join('\n'));
    }

  }, [gameDay, gameHour]); // Plots, seedInventory, cash, harvestedProduce are read at start and updated via their setters.

  const getProduceById = (id: string | null): Produce | undefined => {
    if (!id) return undefined;
    return AVAILABLE_PRODUCE.find(p => p.id === id);
  }

  const handleBuySeed = useCallback((produceId: string, quantity: number) => {
    const produceToBuy = AVAILABLE_PRODUCE.find(p => p.id === produceId);
    if (!produceToBuy) return;

    const cost = produceToBuy.seedCost * quantity;
    setCash(prevCash => {
      if (prevCash >= cost) {
        setSeedInventory(prevSeeds => {
          const existingSeed = prevSeeds.find(s => s.produceId === produceId);
          if (existingSeed) {
            return prevSeeds.map(s => s.produceId === produceId ? { ...s, quantity: s.quantity + quantity } : s);
          }
          return [...prevSeeds, { produceId, quantity }];
        });
        setNotification(`Bought ${quantity} ${produceToBuy.name} seed(s).`);
        return prevCash - cost;
      } else {
        setNotification("Not enough cash!");
        return prevCash;
      }
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-200 via-lime-100 to-yellow-100 p-4">
      <Header 
        cash={cash} 
        gameDay={gameDay} 
        gameHour={gameHour} 
        currentWeek={Math.floor((gameDay - 1) / DAYS_IN_WEEK) + 1} 
        daysInWeek={DAYS_IN_WEEK}
      />
      
      {notification && (
        <div 
            className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-xl z-50 max-w-md text-sm whitespace-pre-line animate-pulse-once"
            style={{animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) 1'}}
        >
          {notification}
        </div>
      )}

      <main className="flex-grow container mx-auto mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-black bg-opacity-10 p-4 rounded-xl shadow-2xl">
          <h2 className="text-2xl font-bold text-green-800 mb-4 text-center">My Automated Farm</h2>
          <div className="grid grid-cols-3 gap-4">
            {plots.map(plot => (
              <FarmPlotComponent
                key={plot.id}
                plot={plot}
                gameDay={gameDay}
                getProduceDetails={getProduceById}
              />
            ))}
          </div>
        </div>

        <div className="lg:col-span-1 bg-white bg-opacity-70 p-4 rounded-xl shadow-2xl">
          <ControlPanel
            seedInventory={seedInventory}
            harvestedProduce={harvestedProduce}
            onBuySeed={handleBuySeed}
            getProduceDetails={getProduceById}
          />
        </div>
      </main>
      <footer className="text-center text-sm text-green-700 mt-8 pb-4">
        Milly's Farm Fully Automated - Automation is bliss!
      </footer>
    </div>
  );
};

export default App;