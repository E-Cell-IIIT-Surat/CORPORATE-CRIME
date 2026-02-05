import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { teamAPI } from '../api';
import { Trophy, Shield, UserPlus, LogIn, Command } from 'lucide-react';
import toast from 'react-hot-toast';

const PlayerLogin = () => {
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const loginToast = toast.loading('Authenticating credentials...');
    try {
      const { data } = await teamAPI.login({ teamName, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', 'player');
      toast.success('Access Granted. Welcome back, agent.', { id: loginToast });
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authentication failed', { id: loginToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#020617] text-white p-3 sm:p-4 md:p-6 selection:bg-blue-500/30 overflow-x-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-1/2 h-1/2 bg-blue-600/10 blur-3xl rounded-full" />
        <div className="absolute bottom-[-20%] right-[-20%] w-1/2 h-1/2 bg-indigo-600/10 blur-3xl rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>
      
      <div className="w-full max-w-sm relative z-10">
        <div className="bg-[#0c1222]/60 backdrop-blur-2xl p-5 sm:p-6 md:p-10 lg:p-12 rounded-2xl sm:rounded-3xl shadow-2xl border border-blue-500/20 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-blue-500/60 to-transparent" />
          
          <div className="flex flex-col items-center mb-8 sm:mb-10 md:mb-12">
            <img src="/CORPORATE CRIME.png" alt="Corporate Crime" className="h-24 sm:h-28 md:h-32 mb-4 sm:mb-6 md:mb-8 object-contain" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight sm:tracking-tighter text-white mb-2 sm:mb-3 uppercase">Corporate Crime</h1>
            <p className="text-blue-400/70 text-center font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em]">
              Secure Access Portal
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6 md:space-y-8">
            <div className="space-y-2 sm:space-y-3">
              <label className="block text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] sm:tracking-[0.3em] ml-1">Team Identity</label>
              <div className="relative group/input">
                <input
                  type="text"
                  className="w-full bg-black/50 border border-blue-500/10 rounded-lg sm:rounded-2xl px-3 sm:px-5 py-3 sm:py-4 md:py-5 text-sm sm:text-base focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition-all text-white placeholder:text-gray-700 font-bold"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="TEAM_NAME"
                  required
                />
              </div>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <label className="block text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] sm:tracking-[0.3em] ml-1">Secure Key</label>
              <div className="relative group/input">
                <input
                  type="password"
                  className="w-full bg-black/50 border border-blue-500/10 rounded-lg sm:rounded-2xl px-3 sm:px-5 py-3 sm:py-4 md:py-5 text-sm sm:text-base focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition-all text-white placeholder:text-gray-700 font-bold"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 disabled:bg-gray-800 text-white font-black py-3 sm:py-4 md:py-5 rounded-lg sm:rounded-2xl transition-all shadow-[0_0_24px_rgba(37,99,235,0.35)] active:scale-95 flex items-center justify-center gap-2 sm:gap-3 uppercase tracking-wider sm:tracking-widest text-xs sm:text-sm"
            >
              {loading ? (
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={16} className="sm:size-5" />
                  <span className="hidden xs:inline">Initiate Uplink</span>
                  <span className="inline xs:hidden">Uplink</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 sm:mt-10 md:mt-12 pt-6 sm:pt-8 border-t border-white/5 flex flex-col items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3 w-full">
              <div className="h-px bg-white/5 flex-1" />
              <span className="text-[8px] sm:text-[10px] font-black text-gray-600 uppercase tracking-wider sm:tracking-widest whitespace-nowrap">Navigation</span>
              <div className="h-px bg-white/5 flex-1" />
            </div>
            
            <div className="flex flex-col gap-3 sm:gap-4 w-full">
              <Link 
                to="/signup" 
                className="w-full py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 text-center text-[9px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest text-blue-500/70 hover:text-blue-400 transition-all"
              >
                Register New Team
              </Link>
              <button 
                onClick={() => navigate('/admin')}
                className="w-full py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 text-center text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.3em] text-blue-500/70 hover:text-blue-400 transition-all flex items-center justify-center gap-1 sm:gap-2"
              >
                <Shield size={12} className="sm:size-3.5" />
                <span className="hidden sm:inline">Command Center</span>
                <span className="inline sm:hidden">Admin</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-8 sm:mt-10 md:mt-12 flex flex-col items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping" />
            <p className="text-gray-600 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em]">
              Security Protocol v2.4.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerLogin;
