import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { teamAPI } from '../api';
import { ShieldCheck, UserPlus, ArrowRight, Target, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const PlayerSignup = () => {
  const [formData, setFormData] = useState({ 
    teamName: '', 
    password: '',
    teamLeader: '',
    teamLeaderEmail: '',
    members: []
  });
  const [newMember, setNewMember] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAddMember = () => {
    if (newMember.name && newMember.email) {
      setFormData({
        ...formData,
        members: [...formData.members, newMember]
      });
      setNewMember({ name: '', email: '' });
    } else {
      toast.error('Please fill all member fields');
    }
  };

  const handleRemoveMember = (index) => {
    setFormData({
      ...formData,
      members: formData.members.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.teamName || !formData.password || !formData.teamLeader || !formData.teamLeaderEmail) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    const regToast = toast.loading('Registering team with command center...');
    try {
      const { data } = await teamAPI.register(formData);
      toast.success('Team registered successfully. Awaiting admin approval.', { id: regToast });
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed', { id: regToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-3 sm:p-4 md:p-6 bg-[#020617] text-white overflow-x-hidden relative selection:bg-blue-500/30">
      <style>{`
        /* Custom scrollbar styling */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.7);
        }
      `}</style>
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-20%] w-1/2 h-1/2 bg-blue-600/10 blur-3xl rounded-full" />
        <div className="absolute bottom-[-20%] left-[-20%] w-1/2 h-1/2 bg-indigo-600/10 blur-3xl rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      <div className="w-full max-w-2xl bg-[#0c1222]/60 backdrop-blur-2xl border border-blue-500/20 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-10 lg:p-12 shadow-2xl relative overflow-hidden group z-10 max-h-[90vh] overflow-y-auto" style={{scrollbarWidth: 'thin', scrollbarColor: 'rgba(59, 130, 246, 0.5) rgba(0, 0, 0, 0.3)'}}>
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-blue-500/60 to-transparent" />
        
        <div className="relative">
          <div className="flex justify-center mb-8 sm:mb-10 md:mb-12">
            <img src="/CORPORATE CRIME.png" alt="Corporate Crime" className="h-24 sm:h-28 md:h-32 object-contain" />
          </div>

          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 sm:mb-3 tracking-tight sm:tracking-tighter uppercase">Corporate Crime</h1>
            <p className="text-blue-400/70 font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em]">Agent Enrollment</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 md:space-y-8">
            {/* Team Name */}
            <div className="space-y-2 sm:space-y-3">
              <label className="block text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] sm:tracking-[0.3em] ml-1">Team Name</label>
              <input
                type="text"
                required
                className="w-full bg-black/50 border border-blue-500/10 rounded-lg sm:rounded-2xl px-3 sm:px-5 py-3 sm:py-4 md:py-5 text-sm sm:text-base text-white focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition-all placeholder:text-gray-700 font-bold"
                placeholder="TEAM_NAME"
                value={formData.teamName}
                onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
              />
            </div>

            {/* Team Leader */}
            <div className="space-y-2 sm:space-y-3">
              <label className="block text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] sm:tracking-[0.3em] ml-1">Team Leader Name</label>
              <input
                type="text"
                required
                className="w-full bg-black/50 border border-blue-500/10 rounded-lg sm:rounded-2xl px-3 sm:px-5 py-3 sm:py-4 md:py-5 text-sm sm:text-base text-white focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition-all placeholder:text-gray-700 font-bold"
                placeholder="LEADER_NAME"
                value={formData.teamLeader}
                onChange={(e) => setFormData({ ...formData, teamLeader: e.target.value })}
              />
            </div>

            {/* Team Leader Email */}
            <div className="space-y-2 sm:space-y-3">
              <label className="block text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] sm:tracking-[0.3em] ml-1">Team Leader Email</label>
              <input
                type="email"
                required
                className="w-full bg-black/50 border border-blue-500/10 rounded-lg sm:rounded-2xl px-3 sm:px-5 py-3 sm:py-4 md:py-5 text-sm sm:text-base text-white focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition-all placeholder:text-gray-700 font-bold"
                placeholder="LEADER@EMAIL.COM"
                value={formData.teamLeaderEmail}
                onChange={(e) => setFormData({ ...formData, teamLeaderEmail: e.target.value })}
              />
            </div>

            {/* Password */}
            <div className="space-y-2 sm:space-y-3">
              <label className="block text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] sm:tracking-[0.3em] ml-1">Access Key</label>
              <input
                type="password"
                required
                className="w-full bg-black/50 border border-blue-500/10 rounded-lg sm:rounded-2xl px-3 sm:px-5 py-3 sm:py-4 md:py-5 text-sm sm:text-base text-white focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition-all placeholder:text-gray-700 font-bold"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            {/* Team Members Section */}
            <div className="border-t border-white/5 pt-5 sm:pt-6">
              <h3 className="text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-4">Team Members</h3>
              
              <div className="space-y-3 mb-4">
                <input
                  type="text"
                  className="w-full bg-black/50 border border-blue-500/10 rounded-lg px-3 sm:px-5 py-2 sm:py-3 text-sm text-white focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition-all placeholder:text-gray-700 font-bold"
                  placeholder="Member Name"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                />
                <input
                  type="email"
                  className="w-full bg-black/50 border border-blue-500/10 rounded-lg px-3 sm:px-5 py-2 sm:py-3 text-sm text-white focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition-all placeholder:text-gray-700 font-bold"
                  placeholder="Member Email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                />
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-bold py-2 rounded-lg text-sm transition-all"
                >
                  + Add Member
                </button>
              </div>

              {/* Members List */}
              {formData.members.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2" style={{scrollbarWidth: 'thin', scrollbarColor: 'rgba(59, 130, 246, 0.5) rgba(0, 0, 0, 0.3)'}}>
                  {formData.members.map((member, index) => (
                    <div key={index} className="flex items-center justify-between bg-black/40 border border-white/5 rounded-lg px-3 sm:px-4 py-2">
                      <div className="text-sm">
                        <p className="font-bold text-white">{member.name}</p>
                        <p className="text-gray-500 text-xs">{member.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(index)}
                        className="text-red-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 disabled:bg-gray-800 text-white font-black py-3 sm:py-4 md:py-5 rounded-lg sm:rounded-2xl shadow-[0_0_24px_rgba(37,99,235,0.35)] flex items-center justify-center gap-2 sm:gap-3 group transition-all mt-4 uppercase tracking-wider sm:tracking-widest text-xs sm:text-sm"
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
              <Link to="/login" className="text-blue-500 hover:text-blue-400 font-black ml-2 transition-colors">
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