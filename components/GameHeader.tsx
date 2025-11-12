import React from 'react';
import { View } from '../types';
import { SlotMachineIcon } from './icons/SlotMachineIcon';
import { PachinkoIcon } from './icons/PachinkoIcon';

interface GameHeaderProps {
  currentGame: 'slot' | 'pachinko';
  onNavigate: (view: View) => void;
}

const GAMES = [
  { id: 'slot', name: 'Slots', icon: SlotMachineIcon },
  { id: 'pachinko', name: 'Pachinko', icon: PachinkoIcon },
];

const GameHeader: React.FC<GameHeaderProps> = ({ currentGame, onNavigate }) => {
  return (
    <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-300 dark:border-slate-700 rounded-lg p-3 mb-6 flex justify-between items-center">
      <button
        onClick={() => onNavigate('games')}
        className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors flex items-center gap-2"
      >
        <span>&larr;</span>
        <span>กลับไปหน้าเกมส์</span>
      </button>
      <div className="flex items-center gap-2">
        {GAMES.map(game => {
          const Icon = game.icon;
          const isActive = currentGame === game.id;
          return (
            <button
              key={game.id}
              onClick={() => onNavigate(game.id as View)}
              className={`p-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-300/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-400/50 dark:hover:bg-slate-600/50'
              }`}
              title={game.name}
            >
              <Icon className="w-6 h-6" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GameHeader;
