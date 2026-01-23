import { getServiceSupabase } from '../../lib/supabase/client';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const revalidate = 0; // Disable static caching for now

export default async function Home() {
  const supabase = getServiceSupabase();
  const { data: modes } = await supabase
    .from('modes')
    .select('*')
    .eq('active', true)
    .order('title');

  const dailyModes = modes?.filter(m => m.id === 'headline-satire') || [];
  const arcadeModes = modes?.filter(m => m.id !== 'headline-satire') || [];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-12">
        <div className="text-center space-y-2">
          <h1 className="text-6xl font-heading font-normal tracking-tighter text-glow">
            Daily Judgement
          </h1>
          <p className="text-lg text-green-100/60 font-light">
            Test your biases against reality.
          </p>
        </div>

        {/* Daily Section */}
        {dailyModes.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-green-100/40 text-xs font-bold uppercase tracking-widest px-1">
              Todays Challenge
            </h3>
            <div className="space-y-3">
              {dailyModes.map((mode) => (
                <Link 
                  key={mode.id} 
                  href={`/play/${mode.id}`}
                  className="glass-panel p-5 rounded-xl group hover:bg-white/5 transition-all duration-300 block border-green-500/30 hover:border-green-400/50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-heading font-normal group-hover:text-green-300 transition-colors">
                        {mode.title}
                      </h2>
                      <p className="text-sm text-green-100/50 mt-1">
                        {mode.description}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-green-200/50 group-hover:text-green-200 group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Arcade Section */}
        {arcadeModes.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-green-100/40 text-xs font-bold uppercase tracking-widest px-1">
              Arcade Archive
            </h3>
            <div className="grid gap-3">
              {arcadeModes.map((mode) => (
                <Link 
                  key={mode.id} 
                  href={`/play/${mode.id}`}
                  className="glass-panel p-4 rounded-xl group hover:bg-white/5 transition-all duration-300 block opacity-80 hover:opacity-100"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-heading font-normal group-hover:text-green-300 transition-colors">
                        {mode.title}
                      </h2>
                      <p className="text-xs text-green-100/40 mt-1">
                        {mode.description}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-green-200/30 group-hover:text-green-200 group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {(!modes || modes.length === 0) && (
          <div className="text-center p-8 glass-panel rounded-xl">
            <p className="text-green-100/40">No active game modes found.</p>
          </div>
        )}
      </div>
    </main>
  );
}
