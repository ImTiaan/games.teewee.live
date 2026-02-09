'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, X, ExternalLink, Play, Pause, Volume2 } from 'lucide-react';
import clsx from 'clsx';
import { submitPlay } from '../../actions/game-actions';

interface GameItem {
  id: string;
  prompt_text: string;
  answer: string;
  source_name: string;
  source_url: string;
  asset_type?: string;
  choices?: string[]; // Added explicit choices
  metadata?: {
    pubDate?: string;
    imageUrl?: string;
    audioUrl?: string; // Added audioUrl
    choices?: string[];
    example?: string;
  };
}

interface GameClientProps {
  modeId: string;
  modeTitle: string;
  items: GameItem[];
  choices: string[];
  gameType?: 'daily' | 'archive';
}

export default function GameClient({ modeId, modeTitle, items, choices: defaultChoices, gameType = 'daily' }: GameClientProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  // Music History Specific State
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(1);
  const [dropdownValue, setDropdownValue] = useState("");

  const currentItem = items[currentIndex];
  // Prioritize item-specific choices (from choices column or metadata), fallback to mode default
  const currentChoices = currentItem?.choices || currentItem?.metadata?.choices || defaultChoices;

  // Reset music state on item change
  useEffect(() => {
    setAudioDuration(1);
    setDropdownValue("");
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [currentIndex]);

  const handlePlayAudio = () => {
    if (!audioRef.current) return;
    
    setIsPlaying(true);
    audioRef.current.currentTime = 0;
    audioRef.current.play();

    // Stop after duration
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
      }
    }, audioDuration * 1000);
  };

  const handleExtendClip = () => {
    if (audioDuration < 30) {
        setAudioDuration(prev => Math.min(prev + 1, 30));
    }
  };

  const handleAnswer = async (choice: string) => {
    if (showFeedback) return;

    // Special logic for Music History
    if (modeId === 'music-history') {
        const isCorrect = choice.toLowerCase() === currentItem.answer.toLowerCase();
        if (!isCorrect && audioDuration < 10) {
            // Incorrect attempt, extend duration
            setAudioDuration(prev => prev + 1);
            setDropdownValue(""); // Reset selection
            // Optional: Show toast or shake effect? 
            // For now, we rely on the UI showing "Clip extended"
            return;
        }
        // If correct OR duration reached max, proceed to feedback
        setSelectedAnswer(choice);
        if (isCorrect) setScore(s => s + 1);
        
        // Submit Play
        await submitPlay(modeId, currentItem.id, choice, isCorrect, 0); // TODO: Add real timing
        
        setShowFeedback(true);
        return;
    }

    setSelectedAnswer(choice);
    const isCorrect = choice.toLowerCase() === currentItem.answer.toLowerCase();
    
    if (isCorrect) {
      setScore(s => s + 1);
    }

    // Submit Play
    await submitPlay(modeId, currentItem.id, choice, isCorrect, 0); // TODO: Add real timing

    setShowFeedback(true);
  };

  const handleNext = () => {
    setShowFeedback(false);
    setSelectedAnswer(null);
    
    if (currentIndex < items.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      setIsFinished(true);
    }
  };

  if (isFinished) {
    const isMarathon = gameType === 'archive' && items.length > 50;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="glass-panel p-12 rounded-3xl max-w-md w-full text-center space-y-8">
          <h2 className="text-3xl font-bold text-glow">
            {isMarathon ? "Archive Cleared!" : "Results"}
          </h2>
          
          <div className="space-y-2">
            <p className="text-green-100/60 uppercase tracking-widest text-sm">Score</p>
            <p className="text-6xl font-bold text-white">
              {score} <span className="text-3xl text-green-100/40">/ {items.length}</span>
            </p>
          </div>

          {isMarathon && (
            <p className="text-green-300 font-medium animate-pulse">
              Incredible! You've answered every available question.
            </p>
          )}

          <div className="pt-4">
             <Link href="/" className="glass-button px-8 py-3 rounded-full text-lg font-medium inline-flex items-center gap-2">
               <ArrowLeft className="w-5 h-5" /> Back to Home
             </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!currentItem) {
      return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 max-w-2xl mx-auto">
      <header className="flex items-center justify-between mb-12">
        <Link href="/" className="p-2 glass-button rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl font-heading font-bold text-glow">{modeTitle}</h1>
        <div className="text-sm font-mono text-green-100/60">
          {currentIndex + 1} / {items.length}
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center">
        <div className={clsx(
          "glass-panel p-8 md:p-12 rounded-3xl min-h-[300px] flex flex-col items-center justify-center text-center mb-8 transition-colors duration-300",
          showFeedback && (currentItem.answer.toLowerCase() === selectedAnswer?.toLowerCase() ? "bg-green-900/30 border-green-500/30" : "bg-red-900/30 border-red-500/30")
        )}>
          
          {!showFeedback ? (
            <>
              {currentItem.asset_type === 'image' && currentItem.metadata?.imageUrl ? (
                <div className="w-full h-64 md:h-80 relative mb-6 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={currentItem.metadata.imageUrl} 
                    alt="Challenge" 
                    className="w-full h-full object-cover animate-in fade-in duration-500"
                  />
                </div>
              ) : null}

              {modeId === 'music-history' && currentItem.metadata?.audioUrl && (
                 <div className="mb-8 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                    <audio ref={audioRef} src={currentItem.metadata.audioUrl} />
                    
                    <button 
                        onClick={handlePlayAudio}
                        disabled={isPlaying}
                        className={clsx(
                            "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl border-4",
                            isPlaying 
                                ? "bg-green-500 border-green-400 scale-110 shadow-green-500/50" 
                                : "bg-white/10 border-white/20 hover:bg-white/20 hover:scale-105"
                        )}
                    >
                        {isPlaying ? <Volume2 className="w-10 h-10 text-white animate-pulse" /> : <Play className="w-10 h-10 text-white ml-1" />}
                    </button>
                    
                    <div className="mt-4 flex flex-col items-center gap-2">
                        <p className="text-sm font-mono text-green-100/60 uppercase tracking-widest">
                            Clip Length: <span className="text-white font-bold">{audioDuration}s</span>
                        </p>
                        
                        <button 
                            onClick={handleExtendClip}
                            disabled={audioDuration >= 30 || isPlaying}
                            className="text-xs glass-button px-3 py-1 rounded-full text-green-300 hover:bg-white/10 transition-colors disabled:opacity-50"
                        >
                            +1s Hint
                        </button>
                    </div>
                 </div>
              )}

              <h2 className="text-2xl md:text-3xl font-medium leading-tight animate-in fade-in zoom-in duration-300">
                {modeId === 'music-history' 
                    ? currentItem.prompt_text.replace(/\(Starts with 1s\)/i, '').replace(/"/g, '')
                    : `"${currentItem.prompt_text}"`
                }
              </h2>
              {currentItem.metadata?.pubDate && (
                <p className="mt-6 text-sm font-mono text-green-100/50 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
                  {new Date(currentItem.metadata.pubDate).toLocaleDateString(undefined, { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              )}
            </>
          ) : (
            <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center">
              {currentItem.answer.toLowerCase() === selectedAnswer?.toLowerCase() ? (
                <>
                  <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                    <Check className="w-10 h-10 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-300 mb-2">Correct!</h3>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
                    <X className="w-10 h-10 text-red-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-red-300 mb-2">Incorrect</h3>
                  <p className="text-lg text-red-100/80 mb-1">
                    It was actually <span className="font-bold">{currentItem.answer}</span>
                  </p>
                </>
              )}

              {modeId === 'urban-dictionary' && currentItem.metadata?.example && (
                <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 max-w-sm w-full">
                  <p className="text-xs text-green-100/40 uppercase tracking-widest mb-2">Usage</p>
                  <p className="text-sm text-green-100/80 italic leading-relaxed">
                    "{currentItem.metadata.example}"
                  </p>
                </div>
              )}
              
                <div className="mt-6 pt-6 border-t border-white/10 w-full max-w-xs">
                <p className="text-xs text-green-100/40 uppercase tracking-widest mb-1">Source</p>
                
                <p className="text-sm text-green-100 font-medium truncate">
                  {currentItem.source_name}
                </p>

                {modeId === 'headline-satire' && currentItem.source_url && (
                  <a 
                    href={currentItem.source_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-3 glass-button py-2 px-4 rounded-xl text-xs font-medium text-green-300 hover:text-green-200 flex items-center justify-center gap-2 w-full transition-all group"
                  >
                    Read Article <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                )}
                
                {currentItem.metadata?.pubDate && (
                  <p className="text-xs text-green-100/50 mt-3">
                    {new Date(currentItem.metadata.pubDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {!showFeedback ? (
            modeId === 'music-history' ? (
                <div className="col-span-2 flex flex-col gap-4">
                    <select
                        value={dropdownValue}
                        onChange={(e) => setDropdownValue(e.target.value)}
                        className="w-full p-4 rounded-xl bg-white/10 border border-white/20 text-white text-lg focus:outline-none focus:border-green-500 transition-colors"
                    >
                        <option value="" disabled className="bg-gray-900 text-gray-400">Select the song...</option>
                        {currentChoices.map((choice) => (
                            <option key={choice} value={choice} className="bg-gray-900 text-white">
                                {choice}
                            </option>
                        ))}
                    </select>
                    
                    <button
                        onClick={() => dropdownValue && handleAnswer(dropdownValue)}
                        disabled={!dropdownValue}
                        className="glass-button h-16 rounded-xl text-xl font-bold bg-green-500/20 hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        Submit Guess <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            ) : (
                currentChoices.map((choice) => (
                <button
                    key={choice}
                    onClick={() => handleAnswer(choice)}
                    className="glass-button h-20 rounded-2xl text-xl font-semibold transition-all hover:bg-white/10 active:scale-95"
                >
                    {choice}
                </button>
                ))
            )
          ) : (
            <>
              <button
                onClick={() => setShowQuitConfirm(true)}
                className="glass-button h-20 rounded-2xl text-lg font-medium text-red-300/60 hover:text-red-300 hover:bg-red-900/20 transition-all flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" /> Quit
              </button>
              <button
                onClick={handleNext}
                className="glass-button h-20 rounded-2xl text-xl font-bold bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-4"
              >
                {currentIndex < items.length - 1 ? 'Next' : 'Finish'} <ArrowRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </main>

      {showQuitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel p-8 rounded-3xl max-w-sm w-full text-center space-y-6 animate-in zoom-in-95 duration-200 border border-white/10 shadow-2xl">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Quit Game?</h3>
              <p className="text-sm text-green-100/60">Your progress in this session will be lost.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowQuitConfirm(false)}
                className="glass-button p-4 rounded-xl font-medium hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <Link 
                href="/"
                className="glass-button p-4 rounded-xl font-medium bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-colors flex items-center justify-center"
              >
                Quit
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
