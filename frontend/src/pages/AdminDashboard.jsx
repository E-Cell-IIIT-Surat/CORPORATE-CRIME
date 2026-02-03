import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../api';
import toast from 'react-hot-toast';
import { 
  Users, 
  MapPin, 
  Trophy, 
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  Menu,
  X,
  Play,
  Pause,
  Square,
  ShieldAlert,
  Clock8,
  ShieldCheck as ShieldIcon,
  FileQuestion
} from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('teams');
  const [teams, setTeams] = useState([]);
  const [clues, setClues] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [leaderboard, setLeaderboard] = useState({});
  const [gameStatus, setGameStatus] = useState({ isStarted: false, isPaused: false, startTime: null });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [eventDuration, setEventDuration] = useState(120); // minutes
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showClueModal, setShowClueModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [newClue, setNewClue] = useState({ step: 1, category: 'A', text: '', image: null });
  const [newQuestion, setNewQuestion] = useState({ step: 1, category: 'A', question: '', options: '', correctAnswer: '', points: 10, image: null });
  const [cluePreview, setCluePreview] = useState(null);
  const [questionPreview, setQuestionPreview] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token || role !== 'admin') {
      navigate('/admin/login');
    }
  }, [navigate]);

  useEffect(() => {
    fetchGameStatus();
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    let interval;
    if (gameStatus.isStarted && !gameStatus.isPaused) {
      interval = setInterval(() => {
        // COUNTDOWN timer for admin as well
        if (gameStatus.endTime) {
          const end = new Date(gameStatus.endTime).getTime();
          const now = new Date().getTime();
          const remaining = Math.max(0, Math.floor((end - now) / 1000));
          setElapsedTime(remaining);
        } else if (gameStatus.startTime) {
          // Fallback to count-up
          const start = new Date(gameStatus.startTime).getTime();
          const now = new Date().getTime();
          setElapsedTime(Math.max(0, Math.floor((now - start) / 1000)));
        }
      }, 1000);
    } else if (!gameStatus.isStarted) {
      setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [gameStatus.isStarted, gameStatus.isPaused, gameStatus.startTime, gameStatus.endTime]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const fetchGameStatus = async () => {
    try {
      const { data } = await adminAPI.getGameStatus();
      setGameStatus(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGameControl = async (action) => {
    const controlToast = toast.loading(`${action.toUpperCase()}ing mission...`);
    try {
      const durationToSend = action === 'start' ? eventDuration : undefined;
      const { data } = await adminAPI.toggleGame(action, durationToSend);
      setGameStatus(data);
      toast.success(`Mission ${action === 'start' ? 'initiated' : action === 'pause' ? 'suspended' : 'terminated'}.`, { id: controlToast });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Game control failed';
      toast.error(msg, { id: controlToast });
    }
  };

  const handleRemovePenalty = async (id) => {
    try {
      await adminAPI.removePenalty(id);
      toast.success('Security infraction pardoned.');
      fetchData();
    } catch (err) {
      toast.error('Failed to adjust penalties.');
    }
  };

  const handleAdjustTime = async (id, minutes) => {
    try {
      await adminAPI.adjustTime(id, minutes);
      toast.success(`Mission clock adjusted by ${minutes}m.`);
      fetchData();
    } catch (err) {
      toast.error('Temporal adjustment failed.');
    }
  };

  const handleDeleteTeam = async (id) => {
    if (!window.confirm('PERMANENTLY DELETE this team and all their data?')) return;
    try {
      await adminAPI.deleteTeam(id);
      toast.success('Team purged from database.');
      fetchData();
    } catch (err) {
      toast.error('Deletion failed.');
    }
  };

  const handleCreateClue = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('step', String(newClue.step));
      formData.append('category', newClue.category);
      formData.append('text', newClue.text);
      if (newClue.image) formData.append('image', newClue.image);
      await adminAPI.createClue(formData);
      toast.success('Clue encrypted and stored.');
      setShowClueModal(false);
      setNewClue({ step: 1, category: 'A', text: '', image: null });
      setCluePreview(null);
      fetchData();
    } catch (err) {
      toast.error('Data storage failed.');
    }
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('step', String(newQuestion.step));
      formData.append('category', newQuestion.category);
      formData.append('question', newQuestion.question);
      formData.append('correctAnswer', newQuestion.correctAnswer);
      formData.append('points', String(newQuestion.points));
      if (newQuestion.options) formData.append('options', newQuestion.options);
      if (newQuestion.image) formData.append('image', newQuestion.image);
      await adminAPI.createQuestion(formData);
      toast.success('Question deployed.');
      setShowQuestionModal(false);
      setNewQuestion({ step: 1, category: 'A', question: '', options: '', correctAnswer: '', points: 10, image: null });
      setQuestionPreview(null);
      fetchData();
    } catch (err) {
      toast.error('Question creation failed.');
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await adminAPI.deleteQuestion(id);
      toast.success('Question removed.');
      fetchData();
    } catch (err) {
      toast.error('Deletion failed.');
    }
  };

  const handleDeleteClue = async (id) => {
    if (!window.confirm('Delete this clue?')) return;
    try {
      await adminAPI.deleteClue(id);
      toast.success('Clue purged.');
      fetchData();
    } catch (err) {
      toast.error('Purge failed.');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'teams') {
        const { data } = await adminAPI.getTeams();
        setTeams(data);
      } else if (activeTab === 'clues') {
        const { data } = await adminAPI.getClues();
        setClues(data);
      } else if (activeTab === 'questions') {
        const { data } = await adminAPI.getQuestions();
        setQuestions(data);
      } else if (activeTab === 'leaderboard') {
        const { data } = await adminAPI.getLeaderboard();
        setLeaderboard(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetTeam = async (id) => {
    if (!window.confirm('Are you sure you want to reset this team? All progress will be lost.')) return;
    try {
      await adminAPI.resetTeam(id);
      toast.success('Team mission status reset.');
      fetchData();
    } catch (err) {
      toast.error('Reset failed.');
    }
  };

  const navItems = [
    { id: 'teams', label: 'Teams', icon: Users },
    { id: 'clues', label: 'Clues', icon: MapPin },
    { id: 'questions', label: 'Questions', icon: FileQuestion },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col md:flex-row w-full overflow-x-hidden">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-3 sm:p-4 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
          <ShieldIcon size={20} className="sm:size-6" />
          <span className="truncate">ADMIN</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-400">
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800 p-4 sm:p-6 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:w-72 lg:w-80
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="hidden md:flex items-center gap-2 text-red-500 font-black text-xl lg:text-2xl mb-8 lg:mb-10 tracking-tighter group cursor-default">
          <div className="bg-red-600/10 p-2 rounded-xl border border-red-500/20 group-hover:border-red-500 transition-all">
            <ShieldIcon size={24} className="lg:size-8 group-hover:scale-110 transition-transform" />
          </div>
          <span className="bg-linear-to-r from-red-500 to-red-800 bg-clip-text text-transparent text-lg lg:text-2xl">PORTAL</span>
        </div>

        {/* Mobile Controls */}
        <div className="lg:hidden mb-8 space-y-4">
          <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Game Status</div>
          {!gameStatus.isStarted ? (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Event Duration (minutes)</label>
                <input 
                  type="number" 
                  value={eventDuration} 
                  onChange={(e) => setEventDuration(Number(e.target.value))} 
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-red-500"
                  min="1"
                  max="480"
                />
              </div>
              <button 
                onClick={() => handleGameControl('start')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 rounded-xl text-xs font-black"
              >
                <Play size={14} fill="currentColor" /> START EVENT ({eventDuration}min)
              </button>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => handleGameControl('pause')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black ${gameStatus.isPaused ? 'bg-yellow-600' : 'bg-white/5'}`}
              >
                {gameStatus.isPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
                {gameStatus.isPaused ? 'RESUME' : 'PAUSE'}
              </button>
              <button 
                onClick={() => handleGameControl('stop')}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600/20 text-red-500 rounded-xl text-xs font-black"
              >
                <Square size={14} fill="currentColor" /> STOP
              </button>
            </div>
          )}
        </div>
        
        <nav className="space-y-2">
          {navItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === item.id ? 'bg-red-600 shadow-lg shadow-red-900/20 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              <item.icon size={20} /> {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top bar */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-6 md:px-10 bg-gray-950/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-black capitalize tracking-tight">{activeTab}</h1>
            
            {/* Global Timer */}
            {gameStatus.isStarted && (
              <div className="hidden sm:flex flex-col items-center px-6 py-2 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Event Time</span>
                <span className={`text-xl font-mono font-black tracking-wider ${gameStatus.isPaused ? 'text-yellow-500 animate-pulse' : 'text-blue-400'}`}>
                  {formatTime(elapsedTime)}
                </span>
              </div>
            )}

            {/* Global Controls */}
            <div className="hidden lg:flex items-center gap-4 bg-black/40 p-1 rounded-2xl border border-white/5">
              {!gameStatus.isStarted ? (
                <>
                  <div className="flex items-center gap-2 px-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Duration:</label>
                    <input 
                      type="number" 
                      value={eventDuration} 
                      onChange={(e) => setEventDuration(Number(e.target.value))} 
                      className="w-20 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-red-500"
                      min="1"
                      max="480"
                    />
                    <span className="text-xs text-gray-500 font-bold">min</span>
                  </div>
                  <button 
                    onClick={() => handleGameControl('start')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-xl text-xs font-black transition-all"
                  >
                    <Play size={14} fill="currentColor" /> START EVENT
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleGameControl('pause')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${gameStatus.isPaused ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-white/5 hover:bg-white/10'}`}
                  >
                    {gameStatus.isPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
                    {gameStatus.isPaused ? 'RESUME' : 'PAUSE'}
                  </button>
                  <button 
                    onClick={() => handleGameControl('stop')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white rounded-xl text-xs font-black transition-all"
                  >
                    <Square size={14} fill="currentColor" /> STOP
                  </button>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={fetchData} 
            disabled={loading}
            className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/5 group"
          >
            <RefreshCw size={20} className={`${loading ? 'animate-spin text-red-500' : 'text-gray-400 group-hover:text-white'}`} />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10 bg-[radial-gradient(circle_at_50%_0%,rgba(220,38,38,0.05),transparent_50%)]">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'teams' && (
              <div className="space-y-4">
                {/* Desktop Table */}
                <div className="hidden lg:block bg-gray-900 rounded-2xl border border-white/5 shadow-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-white/5 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">
                      <tr>
                        <th className="px-8 py-6">Team Name</th>
                        <th className="px-8 py-6 text-center">Category</th>
                        <th className="px-8 py-6 text-center">Current Step</th>
                        <th className="px-8 py-6 text-center">Score</th>
                        <th className="px-8 py-6 text-right">Control</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {teams.map((team) => (
                        <tr key={team._id} className="hover:bg-white/5 transition-colors group">
                          <td className="px-8 py-6 font-bold text-lg">
                            {team.name}
                            <div className="text-[10px] text-gray-500 font-medium">ID: {team._id.slice(-6)}</div>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded-lg text-xs font-black border border-white/5">
                              {team.category}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-center text-blue-400 font-mono font-bold">#{team.currentStep}</td>
                          <td className="px-8 py-6 text-center">
                            <div className="text-green-400 font-black text-xl">{team.score}</div>
                            <div className="text-[10px] text-red-500/60 font-bold uppercase tracking-widest">{team.penalties} Penalty</div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleAdjustTime(team._id, 5)}
                                className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-all"
                                title="Add 5 Mins"
                              >
                                <Clock8 size={18} />
                              </button>
                              <button 
                                onClick={() => handleRemovePenalty(team._id)}
                                className="p-2 hover:bg-yellow-500/10 text-yellow-500 rounded-lg transition-all"
                                title="Remove 1 Penalty"
                              >
                                <ShieldAlert size={18} />
                              </button>
                              <button 
                                onClick={() => handleResetTeam(team._id)}
                                className="p-2 hover:bg-white/10 text-gray-400 rounded-lg transition-all"
                                title="Reset Progress"
                              >
                                <RefreshCw size={18} />
                              </button>
                              <button 
                                onClick={() => handleDeleteTeam(team._id)}
                                className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-all"
                                title="Delete Team"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile/Tablet Cards */}
                <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teams.map((team) => (
                    <div key={team._id} className="bg-gray-900 p-6 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-black">{team.name}</h3>
                          <span className="inline-block mt-1 bg-gray-800 text-gray-400 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-white/5">
                            Category {team.category}
                          </span>
                        </div>
                        <button 
                          onClick={() => handleResetTeam(team._id)}
                          className="text-red-500 p-2 bg-red-500/10 rounded-lg"
                        >
                          <RefreshCw size={18} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="bg-white/5 p-4 rounded-xl text-center">
                          <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Step</div>
                          <div className="text-blue-400 font-black text-xl">#{team.currentStep}</div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl text-center">
                          <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Score</div>
                          <div className="text-green-400 font-black text-xl">{team.score}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div className="space-y-12">
                {['A','B','C','D','E'].map((cat) => (
                  <div key={cat} className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-px flex-1 bg-white/5" />
                      <h2 className="text-sm font-black text-gray-500 uppercase tracking-[0.4em]">Category {cat}</h2>
                      <div className="h-px flex-1 bg-white/5" />
                    </div>
                    
                    <div className="grid gap-4">
                      {leaderboard[cat]?.length > 0 ? (
                        leaderboard[cat].map((team, index) => (
                          <div key={team._id} className="bg-gray-900 p-6 rounded-2xl border border-white/5 flex items-center gap-8 hover:border-red-500/20 transition-all group">
                            <div className={`text-3xl font-black w-16 h-16 flex items-center justify-center rounded-2xl ${
                              index === 0 ? 'bg-yellow-500 text-black' : 
                              index === 1 ? 'bg-gray-300 text-black' : 
                              index === 2 ? 'bg-amber-700 text-white' : 
                              'bg-gray-800 text-gray-500'
                            }`}>
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="text-2xl font-black tracking-tight group-hover:text-red-500 transition-colors">{team.name}</div>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs font-bold text-red-500/80 uppercase tracking-widest">{team.penalties} Penalties</span>
                                <div className="w-1 h-1 rounded-full bg-gray-700" />
                                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Step {team.currentStep}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-4xl font-black text-green-400 tracking-tighter">{team.score}</div>
                              <div className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Total Pts</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10 bg-white/5 rounded-2xl border border-dashed border-white/10 text-gray-500 font-bold italic">
                          No teams in this category yet
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'clues' && (
              <div className="space-y-8">
                <button 
                  onClick={() => setShowClueModal(true)}
                  className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition-all shadow-xl shadow-red-600/20 active:scale-95"
                >
                  <Plus size={24} /> Create New Clue
                </button>
                
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {clues.map((clue) => (
                    <div key={clue._id} className="bg-gray-900 p-8 rounded-2xl border border-white/5 group hover:border-white/10 transition-all">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex gap-3">
                          <span className="bg-blue-600/20 text-blue-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/20">Step {clue.step}</span>
                          <span className="bg-white/5 text-gray-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5">Cat {clue.category}</span>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => handleDeleteClue(clue._id)}
                            className="p-2 hover:bg-red-500/10 rounded-xl text-red-500/50 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      {clue.imageUrl && (
                        <img
                          src={clue.imageUrl}
                          alt={`Clue ${clue.step}`}
                          className="w-full h-48 object-cover rounded-xl border border-white/10 mb-6"
                        />
                      )}
                      <p className="text-xl font-medium text-gray-300 leading-relaxed italic select-all cursor-text">
                        "{clue.text}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'questions' && (
              <div className="space-y-8">
                <button 
                  onClick={() => setShowQuestionModal(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                >
                  <Plus size={24} /> Create New Question
                </button>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {questions.map((q) => (
                    <div key={q._id} className="bg-gray-900 p-8 rounded-2xl border border-white/5 group hover:border-white/10 transition-all">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex gap-3">
                          <span className="bg-blue-600/20 text-blue-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/20">Step {q.step}</span>
                          <span className="bg-white/5 text-gray-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5">Cat {q.category}</span>
                          <span className="bg-green-600/10 text-green-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/20">{q.points} pts</span>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => handleDeleteQuestion(q._id)}
                            className="p-2 hover:bg-red-500/10 rounded-xl text-red-500/50 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      {q.imageUrl && (
                        <img
                          src={q.imageUrl}
                          alt={`Question ${q.step}`}
                          className="w-full h-48 object-cover rounded-xl border border-white/10 mb-6"
                        />
                      )}
                      <p className="text-xl font-medium text-gray-200 leading-relaxed mb-4">
                        {q.question}
                      </p>
                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-400">
                          {q.options.map((opt, idx) => (
                            <div key={idx} className="bg-black/40 border border-white/5 rounded-lg px-3 py-2">
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Clue Modal */}
      {showClueModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowClueModal(false)} />
          <div className="relative bg-gray-900 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl md:text-2xl font-black mb-4 sm:mb-6 md:mb-8 flex items-center gap-2 sm:gap-3">
              <MapPin className="text-red-500 size-5 sm:size-6" />
              <span>ADD CLUE</span>
            </h2>
            <form onSubmit={handleCreateClue} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Step</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm focus:outline-none focus:border-red-500 transition-colors"
                    value={newClue.step}
                    onChange={(e) => setNewClue({...newClue, step: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Category</label>
                  <select 
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm focus:outline-none focus:border-red-500 transition-colors"
                    value={newClue.category}
                    onChange={(e) => setNewClue({...newClue, category: e.target.value})}
                  >
                    {['A','B','C','D','E','ALL'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Clue Text</label>
                <textarea 
                  required 
                  rows="3"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm focus:outline-none focus:border-red-500 transition-colors resize-none"
                  value={newClue.text}
                  onChange={(e) => setNewClue({...newClue, text: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Image (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-[11px] sm:text-sm text-gray-400"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setNewClue({ ...newClue, image: file });
                    setCluePreview(file ? URL.createObjectURL(file) : null);
                  }}
                />
                {cluePreview && (
                  <img
                    src={cluePreview}
                    alt="Clue preview"
                    className="mt-3 sm:mt-4 w-full h-32 sm:h-40 object-cover rounded-lg border border-white/10"
                  />
                )}
              </div>
              <div className="flex gap-2 sm:gap-4 pt-2 sm:pt-4">
                <button 
                  type="button"
                  onClick={() => setShowClueModal(false)}
                  className="flex-1 px-3 sm:px-6 py-2 sm:py-4 rounded-lg text-xs sm:text-sm font-bold border border-white/10 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-3 sm:px-6 py-2 sm:py-4 rounded-lg text-xs sm:text-sm font-bold bg-red-600 hover:bg-red-500 transition-colors shadow-lg shadow-red-600/20"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowQuestionModal(false)} />
          <div className="relative bg-gray-900 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 max-w-lg sm:max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl md:text-2xl font-black mb-4 sm:mb-6 md:mb-8 flex items-center gap-2 sm:gap-3">
              <FileQuestion className="text-blue-500 size-5 sm:size-6" />
              <span>ADD QUESTION</span>
            </h2>
            <form onSubmit={handleCreateQuestion} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Step</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    value={newQuestion.step}
                    onChange={(e) => setNewQuestion({ ...newQuestion, step: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Category</label>
                  <select
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    value={newQuestion.category}
                    onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })}
                  >
                    {['A','B','C','D','E','ALL'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Points</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    value={newQuestion.points}
                    onChange={(e) => setNewQuestion({ ...newQuestion, points: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Question</label>
                <textarea
                  required
                  rows="3"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  value={newQuestion.question}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Options (one per line)</label>
                <textarea
                  rows="2"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  value={newQuestion.options}
                  onChange={(e) => setNewQuestion({ ...newQuestion, options: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Correct Answer</label>
                <input
                  type="text"
                  required
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  value={newQuestion.correctAnswer}
                  onChange={(e) => setNewQuestion({ ...newQuestion, correctAnswer: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Image (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-[11px] sm:text-sm text-gray-400"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setNewQuestion({ ...newQuestion, image: file });
                    setQuestionPreview(file ? URL.createObjectURL(file) : null);
                  }}
                />
                {questionPreview && (
                  <img
                    src={questionPreview}
                    alt="Question preview"
                    className="mt-3 sm:mt-4 w-full h-32 sm:h-40 object-cover rounded-lg border border-white/10"
                  />
                )}
              </div>

              <div className="flex gap-2 sm:gap-4 pt-2 sm:pt-4">
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="flex-1 px-3 sm:px-6 py-2 sm:py-4 rounded-lg text-xs sm:text-sm font-bold border border-white/10 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 sm:px-6 py-2 sm:py-4 rounded-lg text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
