import React, { useState, useEffect, useRef } from 'react';
import { HOURS_IN_DAY } from '../constants';

interface HeaderProps {
  cash: number;
  gameDay: number;
  gameHour: number;
  currentWeek: number;
  daysInWeek: number;
}

export const Header: React.FC<HeaderProps> = ({ cash, gameDay, gameHour, currentWeek, daysInWeek }) => {
  const formattedHour = String(gameHour).padStart(2, '0');
  const progressThroughDay = (gameHour / HOURS_IN_DAY) * 100;
  const dayOfWeek = (gameDay - 1) % daysInWeek + 1;

  const [isMuted, setIsMuted] = useState<boolean>(false); // Start with music on (not muted)
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audioElement = document.getElementById('background-music') as HTMLAudioElement;
    if (audioElement) {
      audioRef.current = audioElement;
      audioElement.muted = isMuted;
      // Try to play, browsers might block autoplay until user interaction
      audioElement.play().catch(error => console.warn("Autoplay prevented:", error));
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
      if (!isMuted && audioRef.current.paused) {
        audioRef.current.play().catch(error => console.warn("Play prevented:", error));
      }
    }
  }, [isMuted]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <header className="bg-green-700 text-white p-4 rounded-lg shadow-lg">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Milly's Farm Fully Automated 👩‍🌾</h1>
        <div className="mt-2 sm:mt-0 flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="text-lg">
            💰 Cash: <span className="font-semibold">${cash}</span>
          </div>
          <div className="text-lg">
            🗓️ Week: <span className="font-semibold">{currentWeek}</span> | Day: <span className="font-semibold">{dayOfWeek}</span>
          </div>
          <div className="text-lg w-32 text-center">
            ⏳ Hour: <span className="font-semibold">{formattedHour}:00</span>
            <div className="w-full bg-green-500 h-1 mt-1 rounded">
              <div className="bg-yellow-300 h-1 rounded" style={{ width: `${progressThroughDay}%` }}></div>
            </div>
          </div>
          <button
            onClick={toggleMute}
            className="p-2 rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
            aria-label={isMuted ? "Unmute music" : "Mute music"}
            title={isMuted ? "Unmute music" : "Mute music"}
          >
            <span className="text-2xl" role="img" aria-hidden="true">
              {isMuted ? '🔇' : '🔊'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};