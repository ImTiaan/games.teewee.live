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

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-heading font-bold tracking-tighter text-glow">
            Daily Judgement
          </h1>
          <p className="text-xl text-green-100/60 font-light">
            Test your biases against reality. A daily deterministic challenge.
          </p>
        </div>

        <div className="grid gap-6">
          {modes?.map((mode) => (
            <Link 
              key={mode.id} 
              href={`/play/${mode.id}`}
              className="glass-panel p-6 rounded-2xl group hover:bg-white/5 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold mb-2 group-hover:text-green-300 transition-colors">
                    {mode.title}
                  </h2>
                  <p className="text-green-100/50">
                    {mode.description}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full glass-button flex items-center justify-center group-hover:bg-green-500/20 transition-all">
                  <ArrowRight className="w-6 h-6 text-green-200" />
                </div>
              </div>
            </Link>
          ))}
          
          {(!modes || modes.length === 0) && (
            <div className="text-center p-8 glass-panel rounded-xl">
              <p className="text-green-100/40">No active game modes found.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
