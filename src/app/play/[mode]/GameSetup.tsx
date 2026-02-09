
'use client';

import { useState } from 'react';
import { ArrowLeft, Play, Archive, Infinity } from 'lucide-react';
import Link from 'next/link';

interface GameSetupProps {
  modeTitle: string;
  dailyItemCount: number;
  onStartGame: (count: number) => void;
  onStartArchive: (count: number) => void;
  isHeadline: boolean;
}

export default function GameSetup({ modeTitle, dailyItemCount, onStartGame, onStartArchive, isHeadline }: GameSetupProps) {
  const [activeTab, setActiveTab] = useState<'daily' | 'archive'>(isHeadline ? 'daily' : 'archive');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <Link href="/" className="inline-flex items-center text-sm text-green-100/60 hover:text-green-100 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Modes
          </Link>
          <h1 className="text-4xl font-heading font-bold text-glow">{modeTitle}</h1>
          <p className="text-green-100/60">Choose your challenge</p>
        </div>

        {/* Tabs - Only show if Headline mode, otherwise title implies Arcade */}
        {isHeadline && (
        <div className="flex p-1 bg-black/20 backdrop-blur-xl rounded-full border border-white/10">
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all ${
              activeTab === 'daily' ? 'bg-green-600 text-white shadow-lg' : 'text-green-100/60 hover:text-green-100'
            }`}
          >
            Daily Challenge
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all ${
              activeTab === 'archive' ? 'bg-green-600 text-white shadow-lg' : 'text-green-100/60 hover:text-green-100'
            }`}
          >
            Archive / Practice
          </button>
        </div>
        )}

        {activeTab === 'daily' && isHeadline ? (
          <div className="glass-panel p-8 rounded-3xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Today's Set</h2>
              <p className="text-sm text-green-100/50">
                Generated deterministically for {new Date().toLocaleDateString()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[5, 10, 25, 50].map((count) => (
                <button
                  key={count}
                  onClick={() => onStartGame(count)}
                  disabled={count > dailyItemCount}
                  className={`
                    glass-button p-4 rounded-xl flex flex-col items-center justify-center gap-2 group
                    ${count > dailyItemCount ? 'opacity-30 cursor-not-allowed' : 'hover:bg-green-500/10'}
                  `}
                >
                  <span className="text-2xl font-bold group-hover:text-green-300 transition-colors">{count}</span>
                  <span className="text-xs uppercase tracking-wider text-green-100/50">Rounds</span>
                </button>
              ))}
            </div>
            
            {dailyItemCount < 50 && (
               <p className="text-xs text-center text-yellow-200/60">
                 Note: Only {dailyItemCount} items available today.
               </p>
            )}
          </div>
        ) : (
          <div className="glass-panel p-8 rounded-3xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">
                {isHeadline ? 'Archive Play' : 'Arcade Mode'}
              </h2>
              <p className="text-sm text-green-100/50">
                Play random questions from the vault
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
               {[10, 25, 50].map((count) => (
                <button
                  key={count}
                  onClick={() => onStartArchive(count)}
                  className="glass-button p-4 rounded-xl flex flex-col items-center justify-center gap-2 group hover:bg-green-500/10"
                >
                  <span className="text-2xl font-bold group-hover:text-green-300 transition-colors">{count}</span>
                   <span className="text-xs uppercase tracking-wider text-green-100/50">Rounds</span>
                </button>
              ))}
               <button
                  onClick={() => onStartArchive(1000000)}
                  className="glass-button p-4 rounded-xl flex flex-col items-center justify-center gap-2 group hover:bg-green-500/10"
                >
                  <Infinity className="w-8 h-8 group-hover:text-green-300 transition-colors" />
                   <span className="text-xs uppercase tracking-wider text-green-100/50">Marathon</span>
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
