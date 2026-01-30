'use client';

import { useState } from 'react';
import GameClient from './GameClient';
import GameSetup from './GameSetup';
import { fetchArchiveItems } from '../../actions/game-actions';

interface GameItem {
  id: string;
  prompt_text: string;
  answer: string;
  source_name: string;
  source_url: string;
  asset_type?: string;
  choices?: string[];
  metadata?: {
      pubDate?: string;
      imageUrl?: string;
      audioUrl?: string;
      choices?: string[];
  };
}

interface GameOrchestratorProps {
  modeId: string;
  modeTitle: string;
  dailyItems: GameItem[];
  choices: string[];
}

export default function GameOrchestrator({ modeId, modeTitle, dailyItems, choices }: GameOrchestratorProps) {
  const [gameState, setGameState] = useState<{
    status: 'setup' | 'playing';
    items: GameItem[];
    gameType: 'daily' | 'archive';
  }>({
    status: 'setup',
    items: [],
    gameType: 'daily'
  });

  const handleStartDaily = (count: number) => {
    // Slice the daily items based on user selection
    const selectedItems = dailyItems.slice(0, count);
    setGameState({
      status: 'playing',
      items: selectedItems,
      gameType: 'daily'
    });
  };

  const handleStartArchive = async (count: number) => {
    try {
      // Fetch archive items (no cap for Marathon)
      const items = await fetchArchiveItems(modeId, count);
      
      if (!items || items.length === 0) {
        alert("No items found in archive.");
        return;
      }

      setGameState({
        status: 'playing',
        items: items,
        gameType: 'archive'
      });
    } catch (error) {
      console.error("Failed to start archive game:", error);
      alert("Something went wrong starting the game.");
    }
  };

  if (gameState.status === 'playing') {
    return (
      <GameClient 
        modeId={modeId} 
        modeTitle={modeTitle} 
        items={gameState.items} 
        choices={choices}
        gameType={gameState.gameType}
      />
    );
  }

  return (
    <GameSetup 
      modeTitle={modeTitle}
      dailyItemCount={dailyItems.length}
      onStartGame={handleStartDaily}
      onStartArchive={handleStartArchive}
    />
  );
}
