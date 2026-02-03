import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../api';
import { ShieldCheck, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const authToast = toast.loading('Verifying administrative clearance...');
    try {
      const { data } = await adminAPI.login({ username, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', 'admin');
      toast.success('Clearance verified. Welcome, Commander.', { id: authToast });
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Admin authentication failed', { id: authToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#020617] text-white p-3 sm:p-4 md:p-6 selection:bg-red-500/30 overflow-x-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-20%] w-1/2 h-1/2 bg-red-600/10 blur-3xl rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="bg-[#0c1222]/50 backdrop-blur-2xl p-5 sm:p-6 md:p-10 lg:p-12 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-red-500/50 to-transparent" />
          
          <div className="flex flex-col items-center mb-8 sm:mb-10 md:mb-12">
            <div className="bg-red-600 p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl shadow-[0_0_30px_rgba(220,38,38,0.3)] mb-4 sm:mb-6 md:mb-8 transform -rotate-3 group-hover:rotate-0 transition-all duration-500">
              <ShieldCheck size={28} className="text-white sm:size-10 md:size-12" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight sm:tracking-tighter text-white mb-2 sm:mb-3 uppercase">Command Center</h1>
            <p className="text-red-400/60 text-center font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em]">
              Authorized Personnel Only
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6 md:space-y-8">
            <div className="space-y-2 sm:space-y-3">
              <label className="block text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] sm:tracking-[0.3em] ml-1">Admin Identity</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-5 flex items-center pointer-events-none text-gray-600">
                  <User size={16} className="sm:size-5" />
                </div>
                <input
                  type="text"
                  className="w-full bg-black/40 border border-white/5 rounded-lg sm:rounded-2xl pl-10 sm:pl-12 pr-3 sm:pr-5 py-3 sm:py-4 md:py-5 text-sm sm:text-base focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all text-white placeholder:text-gray-700 font-bold"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="USERNAME"
                  required
                />
              </div>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <label className="block text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] sm:tracking-[0.3em] ml-1">Secure Key</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-5 flex items-center pointer-events-none text-gray-600">
                  <Lock size={16} className="sm:size-5" />
                </div>
                <input
                  type="password"
                  className="w-full bg-black/40 border border-white/5 rounded-lg sm:rounded-2xl pl-10 sm:pl-12 pr-3 sm:pr-5 py-3 sm:py-4 md:py-5 text-sm sm:text-base focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all text-white placeholder:text-gray-700 font-bold"
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
              className="w-full bg-red-600 hover:bg-red-500 disabled:bg-gray-800 text-white font-black py-3 sm:py-4 md:py-5 rounded-lg sm:rounded-2xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.2)] active:scale-95 flex items-center justify-center gap-2 sm:gap-3 uppercase tracking-wider sm:tracking-widest text-xs sm:text-sm"
            >
              {loading ? (
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck size={16} className="sm:size-5" />
                  Authorize Access
                </>
              )}
            </button>
          </form>

          <div className="mt-8 sm:mt-10 md:mt-12 pt-6 sm:pt-8 border-t border-white/5 text-center">
            <button 
              onClick={() => navigate('/')}
              className="text-gray-500 hover:text-white font-black text-[8px] sm:text-[10px] transition-colors uppercase tracking-[0.2em] sm:tracking-[0.3em] flex items-center justify-center gap-1.5 sm:gap-2 mx-auto"
            >
              ← <span className="hidden xs:inline">Back to Player Portal</span>
              <span className="inline xs:hidden">Player Portal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
