
import Image from 'next/image';
import { fetchLeaderboard } from '../actions/leaderboard-actions';

export const revalidate = 60; // Cache for 60 seconds

export default async function LeaderboardPage() {
  const leaderboard = await fetchLeaderboard();

  return (
    <div className="min-h-screen pt-12 px-4 pb-12 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-heading font-bold text-glow mb-4">Global Leaderboard</h1>
        <p className="text-green-100/60">Top players by accuracy (Min. 25 plays)</p>
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-green-900/20 text-green-100/50 uppercase text-xs tracking-wider">
             <tr>
               <th className="px-6 py-4 font-medium">Rank</th>
               <th className="px-6 py-4 font-medium">Player</th>
               <th className="px-6 py-4 font-medium text-right">Accuracy</th>
               <th className="px-6 py-4 font-medium text-right">Plays</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {leaderboard.map((entry) => (
              <tr key={entry.user_id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 text-xl font-bold font-mono text-green-100/70">
                  #{entry.rank}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {entry.avatar_url && (
                      <Image src={entry.avatar_url} alt="" width={32} height={32} className="w-8 h-8 rounded-full" />
                    )}
                    <span className="font-medium text-green-100">{entry.username || 'Anonymous'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-lg font-bold text-green-300">
                    {entry.win_rate.toFixed(1)}%
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-mono text-green-100/60">
                  {entry.total_plays}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {leaderboard.length === 0 && (
           <div className="p-12 text-center text-green-100/40">
             No players have qualified yet. Play 25 rounds to enter the arena.
           </div>
        )}
      </div>
    </div>
  );
}
