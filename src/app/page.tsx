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
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-heading font-bold tracking-tighter text-glow">
            Daily Judgement
          </h1>
          <p className="text-lg text-green-100/60 font-light">
            Test your biases against reality.
          </p>
        </div>

        <div className="space-y-3">
          {modes?.map((mode) => (
            <Link 
              key={mode.id} 
              href={`/play/${mode.id}`}
              className="glass-panel p-4 rounded-xl group hover:bg-white/5 transition-all duration-300 block"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold group-hover:text-green-300 transition-colors">
                    {mode.title}
                  </h2>
                  <p className="text-sm text-green-100/50">
                    {mode.description}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-green-200/50 group-hover:text-green-200 group-hover:translate-x-1 transition-all" />
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
