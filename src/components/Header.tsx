
import Link from 'next/link';
import AuthButton from './AuthButton';
import { createClient } from '../../lib/supabase/server';

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="group">
          <h1 className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-green-200 to-green-400 font-block-script tracking-wider group-hover:opacity-80 transition-opacity">
            The Dailies
          </h1>
        </Link>
        
        <div className="flex items-center gap-6">
           <Link href="/leaderboard" className="text-sm font-medium text-green-100/70 hover:text-green-100 transition-colors">
             Leaderboard
           </Link>
           <AuthButton user={user} />
        </div>
      </div>
    </header>
  );
}
