import React from 'react';
import { Plot, PlotState, Produce } from '../types';
import { PLOT_GROWTH_VISUALS, AVAILABLE_PRODUCE } from '../constants';

interface FarmPlotProps {
  plot: Plot;
  gameDay: number;
  getProduceDetails: (id: string | null) => Produce | undefined;
  // onPlotClick: () => void; // Removed
  // isSelectedForPlanting: boolean; // Removed
}

export const FarmPlotComponent: React.FC<FarmPlotProps> = ({ plot, gameDay, getProduceDetails }) => {
  const produce = getProduceDetails(plot.produceId);
  const visuals = PLOT_GROWTH_VISUALS[plot.state];

  let progress = 0;
  if (plot.state === PlotState.GROWING && produce && plot.plantedAtDay) {
    // Ensure plantedAtDay is not in the future relative to gameDay for progress calculation
    const daysElapsed = Math.max(0, gameDay - plot.plantedAtDay);
    progress = Math.min(100, (daysElapsed / produce.growthTimeInDays) * 100);
  }
  
  const baseClasses = `aspect-square border-4 rounded-lg flex flex-col items-center justify-center p-2 text-center shadow-md transition-all duration-200 ease-in-out`;
  // Removed hover:scale-105 and cursor-pointer as it's not interactive
  const stateClasses = `${visuals.bgColor} ${visuals.borderColor} ${visuals.hoverBgColor}`;
  // const plantingCursorClass = isSelectedForPlanting ? 'cursor-copy ring-4 ring-blue-500 ring-offset-2' : ''; // Removed


  return (
    <div className={`${baseClasses} ${stateClasses}`} /*onClick removed*/>
      {plot.state === PlotState.EMPTY && (
        <>
          <span className="text-4xl">🌱</span>
          <span className="text-sm font-semibold text-amber-800 mt-1">
            {PLOT_GROWTH_VISUALS[PlotState.EMPTY].text} {/* Display "Empty Plot" */}
          </span>
        </>
      )}
      {plot.state === PlotState.GROWING && produce && plot.plantedAtDay && (
        <>
          <span className="text-4xl animate-pulse">{produce.icon}</span>
          <span className="text-xs font-medium text-lime-800">{produce.name}</span>
          <div className="w-full bg-gray-300 h-2.5 mt-1 rounded-full">
            <div 
              className="bg-green-600 h-2.5 rounded-full transition-all duration-500 ease-linear" 
              style={{ width: `${progress}%` }}
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              role="progressbar"
              aria-label={`${produce.name} growth progress`}
            ></div>
          </div>
          <span className="text-xs text-lime-700 mt-0.5">
            {/* Calculate days grown more accurately, ensure it's not negative or excessive */}
            Day {Math.max(1, gameDay - plot.plantedAtDay + (plot.plantedAtDay === gameDay ? 0 : 1) )} / {produce.growthTimeInDays}
          </span>
        </>
      )}
      {plot.state === PlotState.READY_FOR_HARVEST && produce && (
        <>
          <span className="text-5xl animate-bounce">{produce.icon}</span>
          <span className="text-sm font-bold text-yellow-800">
            {PLOT_GROWTH_VISUALS[PlotState.READY_FOR_HARVEST].text} {produce.name}!
          </span>
        </>
      )}
    </div>
  );
};
