import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { teamAPI } from '../api';
import { 
  MapPin, 
  Search, 
  LogOut, 
  Award, 
  Clock, 
  Shield as ShieldIcon, 
  ShieldAlert, 
  Pause, 
  Trophy, 
  X, 
  RefreshCw, 
  Loader2,
  Zap,
  Terminal,
  Lock,
  Unlock,
  AlertCircle,
  ArrowRight,
  Target,
  Cpu,
  Globe,
  Activity
} from 'lucide-react';
import QRScanner from '../components/QRScanner';
import toast from 'react-hot-toast';

const PlayerDashboard = () => {
  const [team, setTeam] = useState(null);
  const [clue, setClue] = useState('');
  const [clueImage, setClueImage] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [unlockedContent, setUnlockedContent] = useState(null);
  const [locationId, setLocationId] = useState(null);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [challengeStartTime, setChallengeStartTime] = useState(null);
  const [answer, setAnswer] = useState('');
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [cooldown, setCooldown] = useState(0);
  const [gameStatus, setGameStatus] = useState({ isStarted: false, isPaused: false });
  const [timeOffset, setTimeOffset] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isQualified, setIsQualified] = useState(false);
  const navigate = useNavigate();

  const fetchStatus = async () => {
    try {
      const { data: teamData } = await teamAPI.getMe();
      setTeam(teamData);
      
      if (teamData.currentStep > teamData.totalSteps && teamData.totalSteps > 0) {
        navigate('/quiz');
        return;
      }

      if (teamData.lastWrongScanTime) {
        const SCAN_COOLDOWN = 60000;
        const timeSinceLastWrong = Date.now() - new Date(teamData.lastWrongScanTime).getTime();
        if (timeSinceLastWrong < SCAN_COOLDOWN) {
          setCooldown(Math.ceil((SCAN_COOLDOWN - timeSinceLastWrong) / 1000));
        }
      }

      try {
        const { data: clueData } = await teamAPI.getClue();
        setClue(clueData.clue);
        setClueImage(clueData.imageUrl || null);
      } catch (clueErr) {
        setClue("Mission details pending... Check back soon!");
        setClueImage(null);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const fetchGameStatus = async () => {
    try {
      const { data } = await teamAPI.getGameStatus();
      setGameStatus(data);
      if (data.serverTime) {
        const serverTime = new Date(data.serverTime).getTime();
        const clientTime = Date.now();
        setTimeOffset(serverTime - clientTime);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      if (teamAPI && typeof teamAPI.getLeaderboard === 'function') {
        const { data } = await teamAPI.getLeaderboard(team?.category);
        setLeaderboard(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
    }
  };

  const fetchQualification = async () => {
    try {
      if (!team) return;
      const { data } = await teamAPI.getQualified();
      setIsQualified(Boolean(data.qualified));
    } catch (err) {
      console.error('Qualification check error:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchLeaderboard();
    const interval = setInterval(() => {
      fetchGameStatus();
      fetchLeaderboard();
      fetchStatus();
      // Additionally check qualification when event is not running
      if (!gameStatus.isStarted) fetchQualification();
    }, 5000); // Increased polling frequency for better sync
    return () => clearInterval(interval);
  }, [gameStatus.isStarted]);

  useEffect(() => {
    if (gameStatus.isStarted) {
      fetchStatus();
    }
  }, [gameStatus.isStarted]);

  useEffect(() => {
    if (!gameStatus.isStarted || gameStatus.isPaused) {
      return;
    }
    
    const timer = setInterval(() => {
      // COUNTDOWN timer (decremental) instead of count-up
      if (!gameStatus.endTime) {
        // Fallback to count-up if no endTime set
        const missionStart = team?.startTime || gameStatus?.startTime;
        if (!missionStart) return;
        const start = new Date(missionStart).getTime();
        const now = Date.now() + timeOffset;
        const diff = Math.max(0, now - start);
        const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
        const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
        setElapsedTime(`${h}:${m}:${s}`);
        return;
      }

      const end = new Date(gameStatus.endTime).getTime();
      const now = Date.now() + timeOffset;
      const remaining = Math.max(0, end - now);

      const h = Math.floor(remaining / 3600000).toString().padStart(2, '0');
      const m = Math.floor((remaining % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((remaining % 60000) / 1000).toString().padStart(2, '0');
      setElapsedTime(`${h}:${m}:${s}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStatus.isStarted, gameStatus.isPaused, gameStatus.startTime, team?.startTime, timeOffset]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const cooldownTimer = setInterval(() => {
      setCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(cooldownTimer);
  }, [cooldown]);

  const handleScanSuccess = async (qrCode) => {
    if (!gameStatus.isStarted) return toast.error('Mission not yet authorized by command center.');
    if (gameStatus.isPaused) return toast.error('Mission is currently suspended.');
    
    const scanToast = toast.loading('Decrypting QR code...');
    try {
      const { data } = await teamAPI.scanQR(qrCode);
      toast.success('Access Granted: Intel Decrypted!', { id: scanToast });
      setUnlockedContent(data.pdfContent || data.content || null);
      setLocationId(data.locationId);
      setCurrentChallenge(data.challenge);
      setChallengeStartTime(Date.now());
      setShowScanner(false);
      fetchStatus();
    } catch (err) {
      const status = err.response?.status;
      if (status === 400 || status === 429 || status === 404) {
        const remaining = err.response?.data?.remainingSeconds || 60;
        setCooldown(remaining);
        setShowScanner(false);
        toast.error(err.response?.data?.message || 'Security breach detected. Lockout initiated.', { id: scanToast });
      } else {
        toast.error(err.response?.data?.message || 'Scan failed', { id: scanToast });
      }
    }
  };

  const handleVerifyAnswer = async () => {
    if (!answer.trim()) return toast.error('Enter verification key or answer');
    const verifyToast = toast.loading('Verifying security clearance...');
    try {
      const timeTaken = challengeStartTime ? Math.round((Date.now() - challengeStartTime) / 1000) : 0;
      const { data } = await teamAPI.verifyAnswer({ 
        answer, 
        locationId, 
        questionId: currentChallenge?.id,
        timeTaken
      });
      toast.success(data.message, { id: verifyToast });

      // Show next clue immediately if present
      if (data.nextClue) {
        if (typeof data.nextClue === 'string') {
          setClue(data.nextClue);
          setClueImage(null);
        } else {
          setClue(data.nextClue.text);
          setClueImage(data.nextClue.imageUrl || null);
        }
      }

      // clear UI for current challenge
      setUnlockedContent(null);
      setLocationId(null);
      setCurrentChallenge(null);
      setChallengeStartTime(null);
      setAnswer('');
      fetchStatus();
      fetchLeaderboard();
      
      // If it was the last step, navigate to /quiz or finished screen
      if (data.isFinished) {
        navigate('/quiz');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed', { id: verifyToast });
      fetchStatus();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
    toast.success('Logged out successfully');
  };

  if (!team) return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <ShieldIcon className="absolute inset-0 m-auto text-blue-500 animate-pulse" size={24} />
      </div>
      <p className="text-blue-400 font-black tracking-[0.3em] uppercase animate-pulse">Establishing Secure Connection</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white w-full font-sans selection:bg-blue-500/30">
      <nav className="bg-[#0c1222]/80 backdrop-blur-xl border-b border-white/5 p-3 sm:p-4 sticky top-0 z-40 shadow-2xl">
        <div className="max-w-4xl mx-auto flex justify-between items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="bg-blue-600 p-2 sm:p-2.5 rounded-lg sm:rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] flex-shrink-0">
              <ShieldIcon size={18} className="text-white sm:size-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-black text-sm sm:text-lg tracking-tight uppercase bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent truncate">
                {team.name}
              </span>
              <div className="flex items-center gap-1 sm:gap-2 text-[8px] sm:text-[10px] font-bold text-blue-400 uppercase tracking-widest min-w-0">
                <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 bg-blue-400 rounded-full animate-pulse flex-shrink-0" />
                <span className="truncate">{team.category} Div</span>
                {isQualified && (
                  <span className="ml-auto flex-shrink-0 bg-green-600 text-black px-1.5 py-0.5 sm:px-2 rounded text-[7px] sm:text-[9px] font-extrabold">OK</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Clock</span>
              <div className="flex items-center gap-2 bg-black/40 px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg sm:rounded-xl border border-white/5">
                <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${gameStatus.isStarted && !gameStatus.isPaused ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-yellow-500'}`} />
                <span className="font-mono font-black text-blue-400 tracking-wider tabular-nums text-[10px] sm:text-xs">{elapsedTime}</span>
              </div>
            </div>
            <button 
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition-all shadow-lg flex-shrink-0"
              title="Leaderboard"
            >
              <Trophy size={18} className="sm:size-5" />
            </button>
            <button 
              onClick={handleLogout} 
              className="bg-red-500/10 p-2 sm:p-2.5 rounded-lg sm:rounded-xl hover:bg-red-500 hover:text-white text-red-500 transition-all border border-red-500/10 shadow-lg flex-shrink-0"
              title="Logout"
            >
              <LogOut size={18} className="sm:size-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-3 sm:p-4 md:p-8 space-y-6 sm:space-y-8">
        {/* Full Screen Status Overlays */}
        {!gameStatus.isStarted && (
          <div className="fixed inset-0 z-[200] bg-[#020617] flex flex-col items-center justify-center p-3 sm:p-6 overflow-y-auto">
            {/* Cyber Background Animation */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] md:w-[800px] h-[400px] sm:h-[600px] md:h-[800px] bg-blue-600/5 blur-[60px] sm:blur-[100px] md:blur-[120px] rounded-full animate-pulse" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none" />
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.05]" />
            </div>

            <div className="relative z-20 max-w-sm sm:max-w-lg md:max-w-2xl w-full text-center space-y-6 sm:space-y-12">
              <div className="relative inline-block">
                <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48 bg-blue-600/10 rounded-2xl sm:rounded-[2.5rem] flex items-center justify-center mx-auto border border-blue-500/30 shadow-[0_0_60px_rgba(37,99,235,0.2)] animate-pulse">
                  <ShieldAlert size={48} className="text-blue-500 sm:size-16 md:size-32" />
                </div>
                <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-10 h-10 sm:w-12 sm:h-12 bg-red-600 rounded-lg sm:rounded-2xl flex items-center justify-center border-3 sm:border-4 border-[#020617] animate-bounce shadow-lg">
                  <Clock size={16} className="text-white sm:size-5" />
                </div>
              </div>

              <div className="space-y-2 sm:space-y-4">
                <h2 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter uppercase italic leading-none">
                  Authorization <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">Pending</span>
                </h2>
                <div className="flex items-center justify-center gap-2 sm:gap-4">
                  <div className="h-px w-8 sm:w-12 bg-gradient-to-r from-transparent to-blue-500/50" />
                  <p className="text-blue-400 font-black text-[9px] sm:text-xs md:text-sm uppercase tracking-[0.4em]">System Standby</p>
                  <div className="h-px w-8 sm:w-12 bg-gradient-to-l from-transparent to-blue-500/50" />
                </div>
              </div>
              
              <div className="bg-[#0c1222]/80 backdrop-blur-3xl p-4 sm:p-8 md:p-12 rounded-2xl sm:rounded-[3.5rem] border border-white/5 shadow-2xl space-y-4 sm:space-y-8 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                
                <p className="text-gray-400 font-bold text-xs sm:text-sm md:text-lg leading-relaxed px-2">
                  Uplink for <span className="text-white uppercase text-[9px] sm:text-xs md:text-base">TEAM {team?.name || '---'}</span>. Awaiting deployment signal.
                </p>
                
                <div className="flex flex-col items-center gap-3 sm:gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                  </div>
                  <div className="px-3 sm:px-6 py-1.5 sm:py-2 bg-blue-500/10 rounded-full border border-blue-500/20">
                    <span className="text-[8px] sm:text-[10px] font-black text-blue-400 uppercase tracking-[0.5em] animate-pulse">Syncing</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3 text-gray-600">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                  <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em]">Sync Active</span>
                </div>
                <button 
                  onClick={() => { localStorage.clear(); navigate('/login'); }}
                  className="text-[8px] sm:text-[10px] font-black text-gray-700 hover:text-red-500 uppercase tracking-[0.4em] transition-colors"
                >
                  Terminate
                </button>
              </div>
            </div>
          </div>
        )}

        {gameStatus.isStarted && gameStatus.isPaused && (
          <div className="fixed inset-0 z-[100] bg-[#020617]/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6">
            <div className="relative max-w-sm w-full">
              <div className="absolute inset-0 bg-yellow-500/5 blur-[80px] rounded-full" />
              <div className="bg-[#0c1222] border border-yellow-500/20 p-6 sm:p-12 rounded-2xl sm:rounded-[3.5rem] shadow-2xl relative overflow-hidden text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-8 border border-yellow-500/20">
                  <Pause size={32} className="text-yellow-500 sm:size-10" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-3 sm:mb-4 uppercase tracking-tighter">Paused</h2>
                <p className="text-gray-400 font-bold text-xs sm:text-sm uppercase tracking-[0.2em] leading-relaxed">
                  Tactical halt. Stand by for signal.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-8">
          <div className="bg-[#0c1222] p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-[2.5rem] border border-white/5 relative overflow-hidden group hover:border-green-500/30 transition-all duration-500 shadow-xl">
            <div className="absolute top-0 right-0 p-3 sm:p-6 opacity-[0.03] group-hover:scale-110 transition-transform">
              <Award size={40} className="sm:size-20" />
            </div>
            <div className="text-gray-500 text-[8px] sm:text-[10px] font-black mb-1 sm:mb-2 uppercase tracking-[0.3em] group-hover:text-green-500 transition-colors">Score</div>
            <div className="text-3xl sm:text-4xl md:text-5xl font-black text-green-400 tracking-tighter drop-shadow-[0_0_15px_rgba(74,222,128,0.3)]">{team.score}</div>
          </div>
          <div className="bg-[#0c1222] p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-[2.5rem] border border-white/5 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-500 shadow-xl">
            <div className="absolute top-0 right-0 p-3 sm:p-6 opacity-[0.03] group-hover:scale-110 transition-transform">
              <MapPin size={40} className="sm:size-20" />
            </div>
            <div className="text-gray-500 text-[8px] sm:text-[10px] font-black mb-1 sm:mb-2 uppercase tracking-[0.3em] group-hover:text-blue-500 transition-colors">Objective</div>
            <div className="text-3xl sm:text-4xl md:text-5xl font-black text-blue-400 tracking-tighter drop-shadow-[0_0_15px_rgba(96,165,250,0.3)]">#{team.currentStep}</div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="relative">
          {locationId === null ? (
            <div className="bg-[#0c1222] border-2 border-blue-500/20 p-4 sm:p-6 md:p-8 lg:p-12 rounded-xl sm:rounded-[2.5rem] relative overflow-hidden shadow-[0_0_50px_rgba(37,99,235,0.1)] animate-in fade-in zoom-in duration-500 group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-blue-500/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-6 sm:mb-10 border border-blue-500/20 backdrop-blur-md">
                  <Search size={12} className="text-blue-400 animate-pulse sm:size-4" />
                  <span className="text-[8px] sm:text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Intel Sync</span>
                </div>
                
                <div className="mb-6 sm:mb-12 max-w-sm sm:max-w-2xl">
                  {clueImage && (
                    <img
                      src={clueImage}
                      alt="Clue"
                      className="w-full max-h-40 sm:max-h-60 md:max-h-64 object-cover rounded-lg sm:rounded-2xl border border-blue-500/20 mb-4 sm:mb-6 shadow-[0_0_30px_rgba(37,99,235,0.2)]"
                    />
                  )}
                  <p className="text-base sm:text-2xl md:text-3xl lg:text-4xl font-black leading-snug sm:leading-tight text-white tracking-tight italic">
                    "{clue}"
                  </p>
                </div>
                
                {cooldown > 0 ? (
                  <div className="w-full max-w-xs sm:max-w-sm bg-red-600/10 border border-red-600/30 text-red-500 p-4 sm:p-8 rounded-lg sm:rounded-2xl flex flex-col items-center gap-3 sm:gap-4 relative overflow-hidden">
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-black uppercase tracking-[0.2em]">
                      <ShieldAlert size={16} className="animate-bounce sm:size-5" />
                      Lockout
                    </div>
                    <div className="text-4xl sm:text-5xl font-black font-mono tabular-nums">{cooldown}s</div>
                    <div className="w-full bg-red-600/20 h-1 sm:h-1.5 rounded-full mt-1 sm:mt-2">
                      <div 
                        className="bg-red-600 h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(220,38,38,0.5)]" 
                        style={{ width: `${(cooldown/60)*100}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowScanner(true)}
                    className="w-full max-w-xs sm:max-w-md group relative h-14 sm:h-20 overflow-hidden rounded-lg sm:rounded-2xl bg-blue-600 transition-all active:scale-[0.98] shadow-[0_10px_40px_rgba(37,99,235,0.3)]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <div className="flex items-center justify-center gap-2 sm:gap-4 text-sm sm:text-xl font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white">
                      <Search size={16} className="group-hover:rotate-12 transition-transform sm:size-6" />
                      <span className="hidden xs:inline">Scan</span><span className="inline xs:hidden">QR</span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#0c1222] border-2 border-red-500/20 p-4 sm:p-6 md:p-8 lg:p-12 rounded-xl sm:rounded-[2.5rem] relative overflow-hidden shadow-[0_0_80px_rgba(239,68,68,0.15)] animate-in fade-in zoom-in duration-700">
              {/* Decorative Background */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-red-600/10 blur-[80px] sm:blur-[150px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-blue-600/10 blur-[80px] sm:blur-[150px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.08]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%),linear-gradient(90deg,rgba(255,0,0,0.05),rgba(0,255,0,0.02),rgba(0,0,255,0.05))] z-10 bg-[length:100%_3px,4px_100%] pointer-events-none" />
              </div>

              <div className="absolute top-0 left-0 w-full h-1 sm:h-1.5 bg-gradient-to-r from-transparent via-red-600 to-transparent" />
              
              <div className="relative z-20 flex flex-col items-center">
                <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-red-500/15 px-3 sm:px-6 py-1.5 sm:py-2.5 rounded-full mb-6 sm:mb-10 border border-red-500/30 backdrop-blur-xl">
                  <ShieldAlert size={12} className="text-red-500 animate-pulse sm:size-4" />
                  <span className="text-[8px] sm:text-[11px] font-black text-red-500 uppercase tracking-[0.4em]">Challenge</span>
                </div>
                
                <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 sm:mb-8 tracking-tighter uppercase italic text-center drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                  Classified <span className="text-red-600">Transmission</span>
                </h2>
                
                <div className="bg-black/90 backdrop-blur-3xl p-4 sm:p-8 md:p-10 lg:p-14 rounded-lg sm:rounded-3xl border border-white/10 mb-8 sm:mb-12 shadow-[0_30px_60px_rgba(0,0,0,0.5)] w-full border-l-red-600 border-l-[4px] sm:border-l-[6px] relative group transition-all">
                  <div className="absolute top-3 sm:top-5 right-4 sm:right-8 flex items-center gap-1.5 sm:gap-2">
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping" />
                    <span className="text-[9px] sm:text-[11px] font-black text-red-600/70 uppercase tracking-widest italic">Live</span>
                  </div>
                  <p className="text-base sm:text-xl md:text-2xl lg:text-3xl text-gray-100 leading-snug font-bold italic tracking-tight text-center">
                    "{unlockedContent || 'Intel stream corrupted. Challenge required.'}"
                  </p>
                </div>

                {currentChallenge ? (
                  <div className="w-full max-w-sm sm:max-w-2xl md:max-w-3xl mb-8 sm:mb-12 space-y-4 sm:space-y-8 animate-in slide-in-from-bottom-6 duration-700">
                    <div className="flex items-center gap-2 sm:gap-4">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                      <span className="text-[9px] sm:text-[11px] font-black text-gray-500 uppercase tracking-[0.5em] whitespace-nowrap">Challenge</span>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    </div>
                    
                    {currentChallenge.imageUrl && (
                      <img
                        src={currentChallenge.imageUrl}
                        alt="Challenge"
                        className="w-full max-h-48 sm:max-h-60 md:max-h-80 object-cover rounded-lg sm:rounded-2xl md:rounded-3xl border border-white/10 mb-6 sm:mb-10 shadow-[0_0_40px_rgba(59,130,246,0.2)]"
                      />
                    )}
                    <p className="text-center text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black text-blue-500 mb-6 sm:mb-12 italic leading-tight tracking-tight px-2">
                      {currentChallenge.text}
                    </p>
                    
                    {currentChallenge.options && currentChallenge.options.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                        {currentChallenge.options.map((opt, i) => (
                          <button
                            key={i}
                            onClick={() => setAnswer(opt)}
                            className={`p-3 sm:p-5 md:p-7 rounded-lg sm:rounded-2xl border-2 transition-all font-black text-xs sm:text-sm md:text-base uppercase tracking-widest text-left relative overflow-hidden group shadow-lg ${
                              answer === opt 
                              ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_30px_rgba(37,99,235,0.5)] scale-[1.02]' 
                              : 'bg-black/60 border-white/10 text-gray-400 hover:border-blue-600/50 hover:text-white hover:bg-black/80'
                            }`}
                          >
                            <div className="flex items-center gap-2 sm:gap-5">
                              <span className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-black transition-colors flex-shrink-0 ${answer === opt ? 'bg-white text-blue-600' : 'bg-white/10 text-gray-600'}`}>
                                {String.fromCharCode(65 + i)}
                              </span>
                              <span className="truncate">{opt}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="w-full space-y-3 sm:space-y-4">
                        <div className="flex justify-between items-end px-2 sm:px-3">
                          <label className="text-[9px] sm:text-[11px] font-black text-gray-500 uppercase tracking-[0.4em]">Key</label>
                          <span className="text-[8px] sm:text-[9px] font-bold text-red-600/80 uppercase tracking-widest">Manual</span>
                        </div>
                        <input
                          type="text"
                          className="w-full bg-black/90 border-2 border-white/10 rounded-lg sm:rounded-2xl px-3 sm:px-10 py-3 sm:py-7 text-white focus:outline-none focus:border-red-600/60 transition-all font-mono tracking-[0.3em] sm:tracking-[0.4em] uppercase text-center text-lg sm:text-3xl placeholder:text-gray-900 shadow-2xl"
                          placeholder="••••"
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleVerifyAnswer()}
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full max-w-sm mb-8 sm:mb-12 space-y-4 sm:space-y-6 animate-in slide-in-from-bottom-6 duration-700">
                    <div className="bg-orange-600/10 border border-orange-600/30 p-3 sm:p-6 rounded-lg sm:rounded-2xl flex flex-col items-center gap-2 sm:gap-3 text-center">
                      <Loader2 className="text-orange-500 animate-spin size-5 sm:size-6" />
                      <p className="text-orange-500 font-black text-xs sm:text-sm uppercase tracking-widest">Signal Weak</p>
                      <p className="text-gray-400 text-[10px] sm:text-xs font-bold leading-relaxed">
                        Retrieval failed. Use manual key.
                      </p>
                    </div>
                    
                    <div className="space-y-2 sm:space-y-4">
                      <div className="flex justify-between items-end px-2 sm:px-3">
                        <label className="text-[9px] sm:text-[11px] font-black text-gray-500 uppercase tracking-[0.4em]">Key</label>
                        <span className="text-[8px] sm:text-[9px] font-bold text-red-600/80 uppercase tracking-widest">Bypass</span>
                      </div>
                      <input
                        type="text"
                        className="w-full bg-black/90 border-2 border-white/10 rounded-lg sm:rounded-2xl px-3 sm:px-10 py-3 sm:py-7 text-white focus:outline-none focus:border-red-600/60 transition-all font-mono tracking-[0.3em] sm:tracking-[0.4em] uppercase text-center text-lg sm:text-3xl placeholder:text-gray-900 shadow-2xl"
                        placeholder="••••"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleVerifyAnswer()}
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                <div className="w-full max-w-xs sm:max-w-md space-y-4 sm:space-y-6">
                  <button
                    onClick={handleVerifyAnswer}
                    className="w-full group relative h-12 sm:h-20 md:h-24 overflow-hidden rounded-lg sm:rounded-2xl bg-red-600 transition-all active:scale-[0.98] shadow-[0_20px_50px_rgba(220,38,38,0.4)]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <div className="flex items-center justify-center gap-2 sm:gap-5 text-xs sm:text-lg md:text-2xl font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-white">
                      <ShieldIcon size={16} className="group-hover:scale-110 group-hover:rotate-12 transition-transform sm:size-7 md:size-8" />
                      <span className="hidden xs:inline">Verify</span><span className="inline xs:hidden">OK</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => { setUnlockedContent(null); setLocationId(null); setCurrentChallenge(null); setAnswer(''); }}
                    className="flex items-center justify-center gap-2 sm:gap-4 w-full text-[9px] sm:text-[11px] font-black text-gray-600 hover:text-red-500 uppercase tracking-[0.5em] transition-all py-2 sm:py-3 group"
                  >
                    <X size={16} className="group-hover:rotate-90 transition-transform" /> Abort Operation
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard Section */}
        {showLeaderboard && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-[#0c1222] border border-white/5 rounded-lg sm:rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="p-3 sm:p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Trophy className="text-yellow-500 size-4 sm:size-5" />
                  <h3 className="font-black text-xs sm:text-sm uppercase tracking-widest">Standings</h3>
                </div>
                <button onClick={() => setShowLeaderboard(false)} className="text-gray-500 hover:text-white p-1">
                  <X size={18} className="sm:size-5" />
                </button>
              </div>
              <div className="p-2 sm:p-4 space-y-1.5 sm:space-y-2 max-h-80 overflow-y-auto">
                {Array.isArray(leaderboard) && leaderboard.map((t, idx) => (
                  <div 
                    key={t._id} 
                    className={`flex items-center justify-between p-2 sm:p-4 rounded-lg sm:rounded-2xl transition-all gap-2 text-xs sm:text-sm ${t._id === team?._id ? 'bg-blue-600/20 border border-blue-500/30' : 'bg-black/20'}`}
                  >
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                      <span className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 ${idx === 0 ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-400'}`}>
                        {idx + 1}
                      </span>
                      <div className="flex items-center gap-1 sm:gap-3 min-w-0">
                        <span className="font-bold text-gray-200 truncate">{t.name}</span>
                        {idx < 2 && (
                          <span className="text-[8px] sm:text-[10px] font-extrabold uppercase bg-green-600 text-black px-1.5 sm:px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0">OK</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-[7px] sm:text-[8px] font-black text-gray-500 uppercase tracking-widest">Pts</div>
                        <div className="font-black text-blue-400 text-xs sm:text-sm">{t.score}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[7px] sm:text-[8px] font-black text-gray-500 uppercase tracking-widest">Step</div>
                        <div className="font-black text-gray-300 text-xs sm:text-sm">#{t.currentStep}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Penalties */}
        {team.penalties > 0 && (
          <div className="bg-red-500/5 border border-red-500/10 p-3 sm:p-6 rounded-lg sm:rounded-[2rem] flex items-center justify-between group gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <div className="bg-red-500/20 p-2 sm:p-4 rounded-lg sm:rounded-2xl text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] flex-shrink-0">
                <ShieldAlert size={16} className="sm:size-6" />
              </div>
              <div className="min-w-0">
                <div className="text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-0.5 sm:mb-1">Infractions</div>
                <div className="font-black text-red-400 tracking-wider text-xs sm:text-sm">-{team.penalties} PT</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* QR Scanner Overlay */}
      {showScanner && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-300">
          <div className="p-3 sm:p-6 flex justify-between items-center text-white bg-[#0c1222] border-b border-white/5">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              <h3 className="font-black uppercase tracking-widest text-xs sm:text-sm">Scan QR</h3>
            </div>
            <button 
              onClick={() => setShowScanner(false)} 
              className="bg-white/5 hover:bg-white/10 p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-colors"
            >
              <X size={18} className="sm:size-6" />
            </button>
          </div>
          <div className="flex-1 relative bg-black">
            <QRScanner onScanSuccess={handleScanSuccess} />
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerDashboard;
