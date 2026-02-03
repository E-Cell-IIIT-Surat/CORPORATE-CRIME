import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { teamAPI } from '../api';
import { ShieldCheck, UserPlus, ArrowRight, Target } from 'lucide-react';
import toast from 'react-hot-toast';

const PlayerSignup = () => {
  const [formData, setFormData] = useState({ teamId: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const regToast = toast.loading('Registering team with command center...');
    try {
      const { data } = await teamAPI.register(formData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', 'player');
      toast.success('Registration successful. Welcome to the mission, agent.', { id: regToast });
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed', { id: regToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-3 sm:p-4 md:p-6 bg-[#020617] text-white overflow-x-hidden relative selection:bg-red-500/30">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-20%] w-1/2 h-1/2 bg-red-600/10 blur-3xl rounded-full" />
        <div className="absolute bottom-[-20%] left-[-20%] w-1/2 h-1/2 bg-orange-600/10 blur-3xl rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      <div className="w-full max-w-sm bg-[#0c1222]/50 backdrop-blur-2xl border border-white/5 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-10 lg:p-12 shadow-2xl relative overflow-hidden group z-10">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-red-500/50 to-transparent" />
        
        <div className="relative">
          <div className="flex justify-center mb-8 sm:mb-10 md:mb-12">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-red-600 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.3)] transform -rotate-6 group-hover:rotate-0 transition-all duration-500">
              <Target className="text-white size-8 sm:size-10 md:size-12" />
            </div>
          </div>

          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 sm:mb-3 tracking-tight sm:tracking-tighter uppercase">Enlist Team</h1>
            <p className="text-red-400/60 font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em]">Operational Recruitment</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 md:space-y-8">
            <div className="space-y-2 sm:space-y-3">
              <label className="block text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] sm:tracking-[0.3em] ml-1">Assigned Team ID</label>
              <input
                type="text"
                required
                className="w-full bg-black/40 border border-white/5 rounded-lg sm:rounded-2xl px-3 sm:px-5 py-3 sm:py-4 md:py-5 text-sm sm:text-base text-white focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all placeholder:text-gray-700 font-bold"
                placeholder="TEAM_IDENTIFIER"
                value={formData.teamId}
                onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:space-y-3">
              <label className="block text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] sm:tracking-[0.3em] ml-1">New Access Key</label>
              <input
                type="password"
                required
                className="w-full bg-black/40 border border-white/5 rounded-lg sm:rounded-2xl px-3 sm:px-5 py-3 sm:py-4 md:py-5 text-sm sm:text-base text-white focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all placeholder:text-gray-700 font-bold"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-500 disabled:bg-gray-800 text-white font-black py-3 sm:py-4 md:py-5 rounded-lg sm:rounded-2xl shadow-[0_0_20px_rgba(220,38,38,0.2)] flex items-center justify-center gap-2 sm:gap-3 group transition-all mt-4 uppercase tracking-wider sm:tracking-widest text-xs sm:text-sm"
            >
              {loading ? (
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus size={16} className="sm:size-5" />
                  <span className="hidden xs:inline">Complete Enrollment</span>
                  <span className="inline xs:hidden">Enroll</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform sm:size-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 sm:mt-10 md:mt-12 pt-6 sm:pt-8 border-t border-white/5 text-center flex flex-col gap-4 sm:gap-6">
            <div className="flex items-center gap-3 w-full">
              <div className="h-px bg-white/5 flex-1" />
              <span className="text-[8px] sm:text-[10px] font-black text-gray-600 uppercase tracking-wider sm:tracking-widest whitespace-nowrap">Authentication</span>
              <div className="h-px bg-white/5 flex-1" />
            </div>

            <p className="text-gray-500 font-bold text-[9px] sm:text-xs uppercase tracking-wider sm:tracking-widest">
              Already operational?{' '}
              <Link to="/login" className="text-red-500 hover:text-red-400 font-black ml-2 transition-colors">
                Initiate Login
              </Link>
            </p>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
        <p className="text-gray-600 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em]">
          Secure Enrollment Terminal
        </p>
      </div>
    </div>
  );
};

export default PlayerSignup;