import React from 'react';
import { View } from '../types';
import { PachinkoIcon } from './icons/PachinkoIcon';

interface GamesViewProps {
  onNavigate: (view: View) => void;
}

const games = [
    {
        id: 'slot',
        name: 'Slots',
        icon: '🎰',
        description: 'หมุนสล็อตลุ้นรับรางวัลใหญ่',
    },
    {
        id: 'pachinko',
        name: 'Pachinko',
        icon: <PachinkoIcon className="w-16 h-16 text-pink-400" />,
        description: 'ปล่อย EmojiMon ลุ้นรางวัลใหญ่',
    }
];

const GamesView: React.FC<GamesViewProps> = ({ onNavigate }) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 shadow-xl max-w-4xl mx-auto">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {games.map(game => (
          <button
            key={game.id}
            onClick={() => onNavigate(game.id as View)}
            className="group flex flex-col items-center justify-center p-4 bg-slate-900/50 border border-slate-700 rounded-lg hover:bg-indigo-600/50 hover:border-indigo-500 transform hover:-translate-y-1 transition-all duration-300 aspect-square"
          >
            <div className="text-6xl mb-3 transition-transform duration-300 group-hover:scale-110">
              {game.icon}
            </div>
            <h3 className="font-bold text-white text-lg">{game.name}</h3>
            <p className="text-xs text-center text-slate-400 group-hover:text-slate-200">{game.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default GamesView;