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
        const { data } = await teamAPI.getLeaderboard();
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
    
    // Don't show loading toast immediately - wait a moment to avoid flickering
    let scanToast;
    const toastTimer = setTimeout(() => {
      scanToast = toast.loading('Decrypting QR code...');
    }, 300);
    
    try {
      const { data } = await teamAPI.scanQR(qrCode);
      clearTimeout(toastTimer);
      if (scanToast) toast.dismiss(scanToast);
      toast.success('Access Granted: Intel Decrypted!');
      setUnlockedContent(data.pdfContent || data.content || null);
      setLocationId(data.locationId);
      setCurrentChallenge(data.challenge);
      setChallengeStartTime(Date.now());
      setShowScanner(false);
      fetchStatus();
    } catch (err) {
      clearTimeout(toastTimer);
      if (scanToast) toast.dismiss(scanToast);
      const status = err.response?.status;
      if (status === 400 || status === 429 || status === 404) {
        const remaining = err.response?.data?.remainingSeconds || 60;
        setCooldown(remaining);
        setShowScanner(false);
        toast.error(err.response?.data?.message || 'Security breach detected. Lockout initiated.');
      } else {
        toast.error(err.response?.data?.message || 'Scan failed');
      }
    }
  };

  const handleVerifyAnswer = async () => {
    if (!answer.trim()) return toast.error('Enter verification key or answer');
    if (!currentChallenge || !locationId) return; // Guard against race conditions
    
    const verifyToast = toast.loading('Verifying security clearance...');
    try {
      const timeTaken = challengeStartTime ? Math.round((Date.now() - challengeStartTime) / 1000) : 0;
      const { data } = await teamAPI.verifyAnswer({ 
        answer, 
        locationId, 
        questionId: currentChallenge?.id,
        timeTaken
      });
      
      // Clear UI FIRST before showing any feedback
      setUnlockedContent(null);
      setLocationId(null);
      setCurrentChallenge(null);
      setChallengeStartTime(null);
      setAnswer('');
      
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

      // Wait a bit before fetching status to ensure backend is updated
      setTimeout(() => {
        fetchStatus();
        fetchLeaderboard();
      }, 500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed', { id: verifyToast });
      // Only fetch status on error to show updated cooldown
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
    <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center gap-8">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <ShieldIcon className="absolute inset-0 m-auto text-blue-500" size={32} />
      </div>
      <div className="text-center space-y-2">
        <p className="text-blue-500 font-black text-xl tracking-wider uppercase animate-pulse">INITIALIZING</p>
        <p className="text-gray-600 font-bold text-xs uppercase tracking-widest">Corporate Intelligence Network</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white w-full font-sans selection:bg-blue-500/30">
      <style>{`
        /* Custom scrollbar styling */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
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
      <nav className="bg-[#0c1222]/80 backdrop-blur-xl border-b border-blue-500/20 p-3 sm:p-4 sticky top-0 z-40 shadow-2xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="bg-linear-to-br from-blue-500 to-blue-600 p-2 sm:p-3 rounded-lg shadow-[0_0_25px_rgba(37,99,235,0.5)] shrink-0">
              <ShieldIcon size={20} className="text-white sm:size-6" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-black text-base sm:text-xl tracking-tight uppercase text-blue-500 truncate">
                {team.name}
              </span>
              <div className="flex items-center gap-2 text-[9px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
                <span>OPERATIVE STATUS</span>
                {isQualified && (
                  <span className="bg-green-500 text-black px-2 py-0.5 rounded text-[8px] font-extrabold ml-2">VERIFIED</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <button 
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-lg"
              title="Rankings"
            >
              <Trophy size={20} />
            </button>
            <button 
              onClick={handleLogout} 
              className="bg-red-500/20 p-2.5 rounded-lg hover:bg-red-500 hover:text-white text-red-400 transition-all border border-red-500/30 shadow-lg"
              title="Exit"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
        {/* Mission Header */}
        <div className="bg-linear-to-r from-black via-blue-950/20 to-black border border-blue-500/30 rounded-xl p-6 shadow-2xl">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase tracking-tight mb-2">
                MISSION DASHBOARD <span className="text-blue-500">// PHASE {team.currentStep}</span>
              </h1>
              <p className="text-gray-400 text-sm font-medium">Corporate Intelligence Operations</p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="bg-black/80 border border-blue-500/30 rounded-lg px-2 sm:px-4 py-2 sm:py-3">
                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                  <Trophy size={14} className="text-blue-500 sm:size-4" />
                  <span className="text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-wider">Score</span>
                </div>
                <div className="text-lg sm:text-2xl font-black text-blue-500">{team.score.toString().padStart(3, '0')}</div>
              </div>
              <div className="bg-black/80 border border-blue-500/30 rounded-lg px-2 sm:px-4 py-2 sm:py-3">
                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                  <Activity size={14} className="text-blue-500 sm:size-4" />
                  <span className="text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-wider">Rank</span>
                </div>
                <div className="text-lg sm:text-2xl font-black text-blue-500">#{leaderboard.findIndex(t => t._id === team._id) + 1 || '01'}</div>
              </div>
              <div className="bg-black/80 border border-blue-500/30 rounded-lg px-2 sm:px-4 py-2 sm:py-3">
                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                  <Clock size={14} className="text-blue-500 sm:size-4" />
                  <span className="text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-wider">Time</span>
                </div>
                <div className="text-lg sm:text-2xl font-black text-blue-500">{elapsedTime}</div>
              </div>
            </div>
          </div>
        </div>
        {/* Full Screen Status Overlays */}
        {!gameStatus.isStarted && (
          <div className="fixed inset-0 z-200 bg-[#020617] flex flex-col items-center justify-center p-6">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-blue-500/5 blur-[120px] rounded-full animate-pulse" />
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
            </div>

            <div className="relative z-20 max-w-2xl w-full text-center space-y-12">
              <div className="relative inline-block">
                <div className="w-48 h-48 bg-linear-to-br from-blue-500/20 to-blue-600/10 rounded-3xl flex items-center justify-center mx-auto border-2 border-blue-500/30 shadow-[0_0_80px_rgba(37,99,235,0.3)]">
                  <ShieldIcon size={96} className="text-blue-500" strokeWidth={1.5} />
                </div>
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center border-4 border-[#020617] shadow-2xl">
                  <Clock size={28} className="text-black animate-pulse" />
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-6xl font-black text-white tracking-tighter uppercase leading-none">
                  OPERATION <span className="text-blue-500">STANDBY</span>
                </h2>
                <div className="flex items-center justify-center gap-4">
                  <div className="h-px w-12 bg-linear-to-r from-transparent to-blue-500/50" />
                  <p className="text-blue-500 font-black text-sm uppercase tracking-[0.3em]">Awaiting Deployment</p>
                  <div className="h-px w-12 bg-linear-to-l from-transparent to-blue-500/50" />
                </div>
              </div>
              
              <div className="bg-black/80 backdrop-blur-xl p-12 rounded-3xl border-2 border-blue-500/20 shadow-2xl space-y-8">
                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-blue-500 to-transparent" />
                
                <p className="text-gray-300 font-bold text-lg leading-relaxed">
                  Agent <span className="text-blue-500 uppercase font-black">{team?.name || '---'}</span> cleared for deployment. Stand by for mission brief.
                </p>
                
                <div className="flex justify-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" />
                </div>
              </div>

              <button 
                onClick={() => { localStorage.clear(); navigate('/login'); }}
                className="text-xs font-black text-gray-600 hover:text-red-500 uppercase tracking-widest transition-colors"
              >
                Abort Mission
              </button>
            </div>
          </div>
        )}

        {gameStatus.isStarted && gameStatus.isPaused && (
          <div className="fixed inset-0 z-100 bg-[#020617]/95 backdrop-blur-xl flex items-center justify-center p-6">
            <div className="relative max-w-md w-full">
              <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full" />
              <div className="bg-black border-2 border-blue-500/30 p-12 rounded-3xl shadow-2xl relative text-center">
                <div className="w-24 h-24 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-8 border-2 border-blue-500/40">
                  <Pause size={48} className="text-blue-500" />
                </div>
                <h2 className="text-4xl font-black text-white mb-4 uppercase tracking-tight">OPERATION PAUSED</h2>
                <p className="text-gray-400 font-bold text-sm uppercase tracking-wider">
                  Mission temporarily suspended
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Active Infractions Alert */}
        {team.penalties > 0 && (
          <div className="bg-linear-to-r from-red-950/40 to-black border border-red-500/30 rounded-lg p-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="bg-red-500/20 p-2 rounded">
                <AlertCircle size={24} className="text-red-500" />
              </div>
              <div>
                <div className="text-[10px] font-black text-red-400 uppercase tracking-wider mb-1">Active Infractions</div>
                <div className="text-3xl font-black text-red-500">-{team.penalties * 5} PTS</div>
              </div>
            </div>
          </div>
        )}

        {/* Intel Target Card */}
        <div className="relative">
          {locationId === null ? (
            <div className="bg-linear-to-br from-blue-950/20 via-black to-black border-2 border-blue-500/30 p-6 md:p-10 rounded-xl relative overflow-hidden shadow-[0_0_50px_rgba(37,99,235,0.15)]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl" />
              
              {/* Intel Target Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Target size={24} className="text-blue-500" />
                  <span className="text-sm font-black text-blue-500 uppercase tracking-wider">INTEL_TARGET_{String(team.currentStep).padStart(2, '0')}</span>
                </div>
                <div className="bg-blue-500/20 border border-blue-500/30 px-3 py-1 rounded">
                  <span className="text-xs font-black text-blue-500">★ PRIORITY</span>
                </div>
              </div>
              
              {/* Intel Image/Content */}
              <div className="relative bg-black/60 border border-blue-500/20 rounded-lg overflow-hidden mb-6 group">
                {clueImage ? (
                  <div className="relative">
                    <img
                      src={clueImage}
                      alt="Intel Target"
                      className="w-full h-auto max-h-96 object-contain bg-black"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-white text-base sm:text-lg font-bold drop-shadow-lg">{clue}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Lock size={48} className="text-blue-500/30 mx-auto mb-4" />
                    <p className="text-xl font-bold text-white mb-2">Decryption Key Required</p>
                    <p className="text-sm text-gray-400">{clue}</p>
                  </div>
                )}
              </div>
              {/* Action Button */}
              <button
                onClick={() => setShowScanner(true)}
                disabled={cooldown > 0}
                className={`w-full group flex items-center justify-center gap-3 px-8 py-4 rounded-lg font-black text-sm uppercase tracking-wider transition-all shadow-xl ${
                  cooldown > 0 
                    ? 'bg-red-900/40 border-2 border-red-500/50 text-red-400 cursor-not-allowed' 
                    : 'bg-linear-to-r from-blue-500 to-blue-600 border-2 border-blue-400 text-white hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] hover:scale-[1.02] active:scale-95'
                }`}
              >
                {cooldown > 0 ? (
                  <>
                    <Clock size={20} className="animate-spin" />
                    <span>COOLDOWN: {cooldown}s</span>
                  </>
                ) : (
                  <>
                    <Terminal size={20} className="group-hover:rotate-12 transition-transform" />
                    <span>ENGAGE REMOTE SCANNER</span>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="bg-[#0a0e1a] border border-red-500/30 p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl relative overflow-hidden shadow-[0_0_60px_rgba(239,68,68,0.2)] animate-in fade-in zoom-in duration-500 max-w-2xl mx-auto">
              {/* Decorative Top Border */}
              <div className="absolute top-0 left-0 w-full h-0.5 bg-linear-to-r from-transparent via-red-500 to-transparent" />
              
              {/* Background Effects */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[100px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full" />
              </div>
              
              <div className="relative z-20 space-y-6 sm:space-y-8">
                {/* Challenge Badge */}
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-2 bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/30">
                    <ShieldAlert size={14} className="text-red-500" />
                    <span className="text-[10px] sm:text-xs font-black text-red-500 uppercase tracking-[0.3em]">Challenge</span>
                  </div>
                </div>
                
                {/* Title */}
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-center uppercase tracking-tight">
                  <span className="text-white">Classified </span>
                  <span className="text-red-500">Transmission</span>
                </h2>
                
                {/* PDF Content - Cleaner Display */}
                <div className="bg-[#050812] border-l-4 border-red-500 p-4 sm:p-6 rounded-lg relative">
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black text-red-500/70 uppercase tracking-wider">Live</span>
                  </div>
                  <p className="text-sm sm:text-base md:text-lg text-gray-200 leading-relaxed font-medium italic pr-12">
                    "{unlockedContent || 'Intel stream corrupted. Challenge required.'}"
                  </p>
                </div>

                {currentChallenge ? (
                  <div className="space-y-6">
                    {/* Challenge Label */}
                    <div className="text-center">
                      <span className="text-xs font-black text-gray-500 uppercase tracking-[0.3em]">Challenge</span>
                    </div>
                    
                    {/* Challenge Image */}
                    {currentChallenge.imageUrl && (
                      <img
                        src={currentChallenge.imageUrl}
                        alt="Challenge"
                        className="w-full h-auto max-h-64 object-contain rounded-lg border border-white/10 bg-black"
                      />
                    )}
                    
                    {/* Question */}
                    <p className="text-center text-base sm:text-lg md:text-xl font-bold text-blue-400 leading-relaxed px-2">
                      {currentChallenge.text}
                    </p>
                    
                    {/* Options */}
                    {currentChallenge.options && currentChallenge.options.length > 0 ? (
                      <div className="space-y-2 sm:space-y-3">
                        {currentChallenge.options.map((opt, i) => (
                          <button
                            key={i}
                            onClick={() => setAnswer(opt)}
                            className={`w-full p-4 rounded-xl border transition-all font-bold text-sm text-left flex items-center gap-3 ${
                              answer === opt 
                              ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' 
                              : 'bg-[#050812] border-white/10 text-gray-300 hover:border-blue-600/30 hover:bg-[#0a0e1a]'
                            }`}
                          >
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                              answer === opt ? 'bg-white text-blue-600' : 'bg-white/5 text-gray-600'
                            }`}>
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className="uppercase tracking-wide">{opt}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center px-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Access Key</label>
                          <span className="text-[9px] font-bold text-red-500/70 uppercase tracking-wide">Manual Entry</span>
                        </div>
                        <input
                          type="text"
                          className="w-full bg-[#050812] border border-white/10 rounded-xl px-6 py-4 text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono tracking-[0.3em] uppercase text-center text-xl placeholder:text-gray-800"
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
                  <div className="space-y-4">
                    <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-lg flex flex-col items-center gap-2 text-center">
                      <Loader2 className="text-orange-500 animate-spin size-5" />
                      <p className="text-orange-500 font-bold text-xs uppercase tracking-wide">Challenge Loading</p>
                      <p className="text-gray-500 text-xs font-medium">Attempting retrieval...</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center px-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Bypass Key</label>
                        <span className="text-[9px] font-bold text-red-500/70 uppercase tracking-wide">Emergency</span>
                      </div>
                      <input
                        type="text"
                        className="w-full bg-[#050812] border border-white/10 rounded-xl px-6 py-4 text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono tracking-[0.3em] uppercase text-center text-xl placeholder:text-gray-800"
                        placeholder="••••"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleVerifyAnswer()}
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                  <button
                    onClick={handleVerifyAnswer}
                    disabled={!answer.trim()}
                    className="w-full group relative h-14 sm:h-16 overflow-hidden rounded-xl bg-red-600 hover:bg-red-500 disabled:bg-gray-800 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-[0_10px_30px_rgba(220,38,38,0.3)] disabled:shadow-none"
                  >
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                    <div className="flex items-center justify-center gap-3 text-sm sm:text-base font-black uppercase tracking-[0.2em] text-white">
                      <ShieldIcon size={18} className="group-hover:scale-110 transition-transform sm:size-5" />
                      <span>OK</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => { setUnlockedContent(null); setLocationId(null); setCurrentChallenge(null); setAnswer(''); }}
                    className="flex items-center justify-center gap-2 w-full text-[10px] font-black text-gray-600 hover:text-red-500 uppercase tracking-[0.3em] transition-colors py-2 group"
                  >
                    <X size={14} className="group-hover:rotate-90 transition-transform" /> Abort Operation
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard Section */}
        {showLeaderboard && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-black border-2 border-blue-500/30 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-blue-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-linear-to-r from-blue-950/20 to-black">
                <div className="flex items-center gap-3">
                  <Trophy className="text-blue-500 size-5 sm:size-6" />
                  <h3 className="font-black text-base sm:text-lg uppercase tracking-wider text-white">GLOBAL RANKINGS</h3>
                </div>
                <button onClick={() => setShowLeaderboard(false)} className="text-gray-500 hover:text-blue-500 p-2 rounded-lg hover:bg-blue-500/10 transition-all">
                  <X size={20} className="sm:size-6" />
                </button>
              </div>
              <div className="p-4 space-y-2 max-h-96 overflow-y-auto" style={{scrollbarWidth: 'thin', scrollbarColor: 'rgba(59, 130, 246, 0.5) rgba(0, 0, 0, 0.3)'}}>
                {Array.isArray(leaderboard) && leaderboard.map((t, idx) => (
                  <div 
                    key={t._id} 
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-xl transition-all gap-2 sm:gap-3 ${t._id === team?._id ? 'bg-blue-500/20 border-2 border-blue-500/50' : 'bg-black/40 border border-blue-500/10 hover:border-blue-500/30'}`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 w-full sm:w-auto">
                      <span className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-black text-xs sm:text-sm shrink-0 ${idx === 0 ? 'bg-linear-to-br from-blue-400 to-blue-600 text-white shadow-lg' : idx === 1 ? 'bg-gray-400 text-black' : idx === 2 ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-400'}`}>
                        {idx + 1}
                      </span>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-3 min-w-0 flex-1">
                        <span className="font-black text-white truncate text-sm sm:text-base">{t.name}</span>
                        {idx < 2 && (
                          <span className="text-[10px] sm:text-xs font-black uppercase bg-green-500 text-black px-2 py-0.5 sm:py-1 rounded whitespace-nowrap shrink-0">QUALIFIED</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 sm:gap-6 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-left sm:text-right">
                        <div className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1">Score</div>
                        <div className="font-black text-blue-500 text-base sm:text-lg">{t.score}</div>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1">Phase</div>
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
          <div className="bg-red-500/5 border border-red-500/10 p-3 sm:p-6 rounded-lg sm:rounded-4xl flex items-center justify-between group gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <div className="bg-red-500/20 p-2 sm:p-4 rounded-lg sm:rounded-2xl text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] shrink-0">
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
        <div className="fixed inset-0 z-100 bg-black flex flex-col animate-in fade-in duration-300">
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
