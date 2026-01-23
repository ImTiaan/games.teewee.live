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
    <main className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl w-full space-y-16 relative z-10">
        <div className="text-center space-y-4">
          <h1 className="text-7xl md:text-9xl font-heading font-normal tracking-tighter text-glow text-green-100/90 transform -rotate-2">
            Daily Judgement
          </h1>
          <p className="text-xl text-green-100/60 font-light max-w-lg mx-auto leading-relaxed">
            Test your biases against reality. <br/>
            <span className="text-sm opacity-50">New challenges generated daily at 00:00 UTC.</span>
          </p>
        </div>

        {/* Daily Section */}
        {dailyModes.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-green-100/40 text-sm font-bold uppercase tracking-[0.2em] px-1 flex items-center gap-4">
              <span className="h-px bg-green-500/20 flex-1"></span>
              Todays Challenge
              <span className="h-px bg-green-500/20 flex-1"></span>
            </h3>
            <div className="space-y-4">
              {dailyModes.map((mode) => (
                <Link 
                  key={mode.id} 
                  href={`/play/${mode.id}`}
                  className="glass-panel p-8 md:p-10 rounded-3xl group hover:bg-white/5 transition-all duration-500 block border-green-500/30 hover:border-green-400/50 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-300 text-xs font-medium uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                        Live Now
                      </div>
                      <h2 className="text-5xl md:text-6xl font-heading font-normal text-white group-hover:text-green-300 transition-colors">
                        {mode.title}
                      </h2>
                      <p className="text-lg text-green-100/60 max-w-xl leading-relaxed">
                        {mode.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 group-hover:bg-green-500/20 group-hover:scale-110 transition-all duration-300">
                      <ArrowRight className="w-8 h-8 text-green-200/70 group-hover:text-white" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Arcade Section */}
        {arcadeModes.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-green-100/40 text-sm font-bold uppercase tracking-[0.2em] px-1 flex items-center gap-4">
              <span className="h-px bg-green-500/20 flex-1"></span>
              Arcade Archive
              <span className="h-px bg-green-500/20 flex-1"></span>
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {arcadeModes.map((mode) => (
                <Link 
                  key={mode.id} 
                  href={`/play/${mode.id}`}
                  className="glass-panel p-6 rounded-2xl group hover:bg-white/5 transition-all duration-300 flex flex-col justify-between h-full border-white/5 hover:border-green-500/30"
                >
                  <div className="space-y-4">
                    <h2 className="text-4xl font-heading font-normal text-green-100/90 group-hover:text-green-300 transition-colors">
                      {mode.title}
                    </h2>
                    <p className="text-sm text-green-100/50 leading-relaxed">
                      {mode.description}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center justify-end">
                    <span className="text-xs font-medium uppercase tracking-widest text-green-500/50 group-hover:text-green-400 transition-colors flex items-center gap-2">
                      Play Now 
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
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
