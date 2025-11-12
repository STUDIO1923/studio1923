import React from 'react';
import { Achievement, UserAchievementProgress, AchievementCategory } from '../types';
import { ACHIEVEMENT_DATABASE } from '../services/achievementDatabase';
import { CoinIcon } from './icons/CoinIcon';
import { PointIcon } from './icons/PointIcon';

interface AchievementsViewProps {
  userProgress: UserAchievementProgress;
  onClaimReward: (achievementId: string) => void;
}

const CATEGORY_DATA: Record<AchievementCategory, { name: string; icon: string }> = {
    collection: { name: 'การสะสม', icon: '📚' },
    pet: { name: 'สัตว์เลี้ยง', icon: '🐾' },
    dungeon: { name: 'ดันเจี้ยน', icon: '⚔️' },
    economy: { name: 'เศรษฐกิจ', icon: '💰' },
    games: { name: 'เกมส์', icon: '🎮' },
    special: { name: 'พิเศษ', icon: '🌟' },
};

const AchievementsView: React.FC<AchievementsViewProps> = ({ userProgress, onClaimReward }) => {
    
    const achievementsByCategory = ACHIEVEMENT_DATABASE.reduce((acc, ach) => {
        if (!acc[ach.category]) {
            acc[ach.category] = [];
        }
        acc[ach.category].push(ach);
        return acc;
    }, {} as Record<AchievementCategory, Achievement[]>);

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 shadow-xl max-w-6xl mx-auto space-y-8">
            {Object.entries(achievementsByCategory).map(([category, achievements]) => {
                const catData = CATEGORY_DATA[category as AchievementCategory];
                return (
                    <section key={category}>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="text-3xl">{catData.icon}</span>
                            <span>{catData.name}</span>
                        </h2>
                        <div className="space-y-4">
                            {achievements.map(ach => {
                                const progress = userProgress[ach.id] || { progress: 0, claimed: false };
                                const isComplete = progress.progress >= ach.criteria.value;
                                const percentage = Math.min(100, (progress.progress / ach.criteria.value) * 100);

                                return (
                                    <div key={ach.id} className={`bg-slate-900/50 p-4 rounded-lg border border-slate-700 flex flex-col sm:flex-row items-center gap-4 transition-all ${progress.claimed ? 'opacity-50' : ''}`}>
                                        <div className="text-4xl">{ach.icon}</div>
                                        <div className="flex-grow text-center sm:text-left">
                                            <h3 className="font-bold text-white">{ach.name}</h3>
                                            <p className="text-sm text-slate-400">{ach.description}</p>
                                            <div className="w-full bg-slate-700 rounded-full h-2.5 mt-2">
                                                <div 
                                                    className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500" 
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">{progress.progress.toLocaleString()} / {ach.criteria.value.toLocaleString()}</p>
                                        </div>
                                        <div className="flex-shrink-0 w-48 text-center">
                                            {progress.claimed ? (
                                                <button disabled className="w-full bg-slate-700 text-slate-400 font-bold py-2 px-4 rounded-md cursor-not-allowed">รับไปแล้ว</button>
                                            ) : isComplete ? (
                                                <button onClick={() => onClaimReward(ach.id)} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md animate-pulse">รับรางวัล!</button>
                                            ) : (
                                                <div className="flex items-center justify-center gap-2 text-slate-400 bg-slate-800 p-2 rounded-md">
                                                    {ach.reward.type === 'coins' && <><CoinIcon className="w-5 h-5 text-yellow-400" /><span>{ach.reward.amount?.toLocaleString()}</span></>}
                                                    {ach.reward.type === 'points' && <><PointIcon className="w-5 h-5 text-cyan-400" /><span>{ach.reward.amount?.toLocaleString()}</span></> }
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                );
            })}
        </div>
    );
};

export default AchievementsView;