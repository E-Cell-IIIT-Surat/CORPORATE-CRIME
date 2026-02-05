import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../api';
import toast from 'react-hot-toast';
import QuestionContent from '../components/QuestionContent';
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
  FileQuestion,
  UserCheck,
  Lightbulb
} from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('teams');
  const [teams, setTeams] = useState([]);
  const [pendingTeams, setPendingTeams] = useState([]);
  const [locations, setLocations] = useState([]);
  const [clues, setClues] = useState([]);
  const [hints, setHints] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [gameStatus, setGameStatus] = useState({ isStarted: false, isPaused: false, startTime: null });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [eventDuration, setEventDuration] = useState(120); // minutes
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showClueModal, setShowClueModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);
  const [editingHint, setEditingHint] = useState(null);
  const [newLocation, setNewLocation] = useState({ code: '', order: 1, category: 'ALL', pdfContent: '', answer: '' });
  const [newClue, setNewClue] = useState({ step: 1, category: 'A', text: '', image: null, imageUrl: '' });
  const [newHint, setNewHint] = useState({ step: 1, category: 'ALL', title: '', content: '' });
  const [newQuestion, setNewQuestion] = useState({ step: 1, category: 'A', question: '', options: '', correctAnswer: '', points: 10 });
  const [cluePreview, setCluePreview] = useState(null);
  const questionInputRef = useRef(null);
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

  const handleResetTeam = async (id) => {
    if (!window.confirm('Reset this team\'s progress? (Score and progress will be cleared)')) return;
    const resetToast = toast.loading('Resetting team progress...');
    try {
      await adminAPI.resetTeam(id);
      toast.success('Team progress reset successfully.', { id: resetToast });
      fetchData();
    } catch (err) {
      toast.error('Reset failed.', { id: resetToast });
    }
  };

  const handleCreateLocation = async (e) => {
    e.preventDefault();
    const createToast = toast.loading('Creating location...');
    try {
      await adminAPI.createLocation(newLocation);
      toast.success('Location created successfully!', { id: createToast });
      setShowLocationModal(false);
      setNewLocation({ code: '', order: 1, category: 'ALL', pdfContent: '', answer: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create location', { id: createToast });
    }
  };

  const handleDeleteLocation = async (id) => {
    if (!window.confirm('Are you sure you want to delete this location?')) return;
    const deleteToast = toast.loading('Deleting location...');
    try {
      await adminAPI.deleteLocation(id);
      toast.success('Location deleted', { id: deleteToast });
      fetchData();
    } catch (err) {
      toast.error('Delete failed', { id: deleteToast });
    }
  };

  const handleCreateClue = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('step', String(newClue.step));
      formData.append('category', newClue.category);
      formData.append('text', newClue.text);
      
      // If image file is provided, append it; otherwise use imageUrl
      if (newClue.image) {
        formData.append('image', newClue.image);
      } else if (newClue.imageUrl) {
        formData.append('imageUrl', newClue.imageUrl);
      }
      
      await adminAPI.createClue(formData);
      toast.success('Clue encrypted and stored.');
      setShowClueModal(false);
      setNewClue({ step: 1, category: 'A', text: '', image: null, imageUrl: '' });
      setCluePreview(null);
      fetchData();
    } catch (err) {
      toast.error('Data storage failed.');
    }
  };

  const handleCreateHint = async (e) => {
    e.preventDefault();
    const createToast = toast.loading('Publishing hint...');
    try {
      await adminAPI.createHint({
        step: Number(newHint.step),
        category: newHint.category,
        title: newHint.title,
        content: newHint.content
      });
      toast.success('Hint published.', { id: createToast });
      setShowHintModal(false);
      setNewHint({ step: 1, category: 'ALL', title: '', content: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Hint publish failed.', { id: createToast });
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

      await adminAPI.createQuestion(formData);
      toast.success('Question deployed.');
      setShowQuestionModal(false);
      setNewQuestion({ step: 1, category: 'A', question: '', options: '', correctAnswer: '', points: 10 });
      fetchData();
    } catch (err) {
      toast.error('Question creation failed.');
    }
  };

  const insertQuestionSnippet = (snippet) => {
    setNewQuestion((prev) => {
      const current = prev.question || '';
      const textarea = questionInputRef.current;
      if (!textarea) {
        return { ...prev, question: current + snippet };
      }
      const start = typeof textarea.selectionStart === 'number' ? textarea.selectionStart : current.length;
      const end = typeof textarea.selectionEnd === 'number' ? textarea.selectionEnd : current.length;
      const next = current.slice(0, start) + snippet + current.slice(end);

      requestAnimationFrame(() => {
        textarea.focus();
        const cursor = start + snippet.length;
        textarea.setSelectionRange(cursor, cursor);
      });

      return { ...prev, question: next };
    });
  };

  const handleInlineImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        insertQuestionSnippet(`\n\n![image](${reader.result})\n\n`);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
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

  const handleDeleteHint = async (id) => {
    if (!window.confirm('Delete this hint?')) return;
    const deleteToast = toast.loading('Deleting hint...');
    try {
      await adminAPI.deleteHint(id);
      toast.success('Hint deleted.', { id: deleteToast });
      fetchData();
    } catch (err) {
      toast.error('Delete failed.', { id: deleteToast });
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'teams') {
        const { data } = await adminAPI.getTeams();
        setTeams(data);
      } else if (activeTab === 'approvals') {
        const { data } = await adminAPI.getPendingTeams();
        setPendingTeams(data);
      } else if (activeTab === 'locations') {
        const { data } = await adminAPI.getLocations();
        setLocations(data);
      } else if (activeTab === 'clues') {
        const { data } = await adminAPI.getClues();
        setClues(data);
      } else if (activeTab === 'hints') {
        const { data } = await adminAPI.getHints();
        setHints(data);
      } else if (activeTab === 'questions') {
        const { data } = await adminAPI.getQuestions();
        setQuestions(data);
      } else if (activeTab === 'leaderboard') {
        const { data } = await adminAPI.getLeaderboard();
        setLeaderboard(data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { id: 'teams', label: 'Teams', icon: Users },
    { id: 'approvals', label: 'Approvals', icon: UserCheck },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'clues', label: 'Clues', icon: ShieldIcon },
    { id: 'hints', label: 'Hints', icon: Lightbulb },
    { id: 'questions', label: 'Questions', icon: FileQuestion },
  ];

  return (
    <div className="flex min-h-screen bg-gray-950 text-white font-['Orbitron',sans-serif]">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-80 border-r border-white/5 bg-black/40 backdrop-blur-md p-6 overflow-y-auto">
        <div className="mb-8 pb-8 border-b border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/20">
              <ShieldAlert className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">ADMIN HQ</h1>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Command Center</p>
            </div>
          </div>

          {/* Desktop game controls */}
          <div className="space-y-4">
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Game Status</div>
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

      {/* Mobile Sidebar */}
      <aside className={`lg:hidden fixed inset-y-0 left-0 w-80 border-r border-white/5 bg-black backdrop-blur-md p-6 overflow-y-auto transition-transform duration-300 z-50 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-8 pb-8 border-b border-white/10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/20">
                <ShieldAlert className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight">ADMIN HQ</h1>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Command Center</p>
              </div>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mobile game controls */}
          <div className="space-y-4">
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Game Status</div>
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
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10"
              aria-label="Open navigation"
            >
              <Menu size={20} className="text-gray-300" />
            </button>
            <img src="/CORPORATE CRIME.png" alt="Corporate Crime" className="h-14 object-contain" />
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
            {activeTab === 'approvals' && (
              <div className="space-y-4">
                {pendingTeams.length === 0 ? (
                  <div className="bg-gray-900 rounded-2xl border border-white/5 p-12 text-center">
                    <UserCheck className="mx-auto mb-4 text-gray-600" size={48} />
                    <p className="text-gray-500 font-bold text-lg">No pending team approvals</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {pendingTeams.map((team) => (
                      <div key={team._id} className="bg-gray-900 rounded-2xl border border-white/5 p-6 hover:border-red-500/20 transition-all">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                              <h3 className="text-2xl font-black text-white">{team.name}</h3>
                              <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-lg text-xs font-black border border-yellow-500/30">
                                PENDING
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Team Leader</p>
                                <p className="text-white font-bold">{team.teamLeader}</p>
                                <p className="text-gray-400 text-sm">{team.teamLeaderEmail}</p>
                              </div>
                              
                              {team.members && team.members.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Team Members ({team.members.length})</p>
                                  <div className="space-y-1">
                                    {team.members.map((member, idx) => (
                                      <div key={idx} className="text-sm">
                                        <p className="text-white font-semibold">{member.name}</p>
                                        <p className="text-gray-500 text-xs">{member.email}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                Category: <strong className="text-gray-400">{team.category}</strong>
                              </span>
                              <span className="flex items-center gap-1">
                                Registered: <strong className="text-gray-400">{new Date(team.createdAt).toLocaleString()}</strong>
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex lg:flex-col gap-3 min-w-35">
                            <button 
                              onClick={() => handleApproveTeam(team._id)}
                              className="flex-1 lg:flex-initial flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-black text-sm transition-all"
                            >
                              <ShieldIcon size={16} />
                              Approve
                            </button>
                            <button 
                              onClick={() => handleRejectTeam(team._id)}
                              className="flex-1 lg:flex-initial flex items-center justify-center gap-2 px-6 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl font-black text-sm transition-all"
                            >
                              <Trash2 size={16} />
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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
              <div className="space-y-6">
                {leaderboard.length > 0 ? (
                  <div className="grid gap-4">
                    {leaderboard.map((team, index) => (
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
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-white/5 rounded-2xl border border-dashed border-white/10 text-gray-500 font-bold italic">
                    No teams in the leaderboard yet
                  </div>
                )}
              </div>
            )}

            {activeTab === 'locations' && (
              <div className="space-y-8">
                <button 
                  onClick={() => setShowLocationModal(true)}
                  className="bg-red-600 hover:bg-red-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-xl shadow-red-600/20 active:scale-95 w-full sm:w-auto"
                >
                  <Plus size={24} /> Create New Location/QR
                </button>

                {/* Mobile Cards */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                  {locations.map((location) => (
                    <div key={location._id} className="bg-gray-900 rounded-2xl border border-white/5 p-5 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">QR Code</div>
                          <code className="bg-gray-800 px-3 py-1 rounded text-sm text-blue-400 inline-block">{location.code}</code>
                        </div>
                        <button 
                          onClick={() => handleDeleteLocation(location._id)}
                          className="p-2 bg-red-500/10 text-red-500 rounded-lg"
                          title="Delete Location"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-black/40 rounded-xl p-3 text-center">
                          <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Order</div>
                          <div className="text-white font-black">#{location.order}</div>
                        </div>
                        <div className="bg-black/40 rounded-xl p-3 text-center">
                          <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Category</div>
                          <div className="text-white font-black">{location.category}</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Content</div>
                        <p className="text-gray-400 text-sm wrap-break-word">{location.pdfContent || 'N/A'}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Answer</div>
                        <code className="text-green-400 font-mono text-sm wrap-break-word">{location.answer}</code>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block bg-gray-900 rounded-2xl border border-white/5 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-225">
                      <thead className="bg-white/5 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">
                        <tr>
                          <th className="px-8 py-6">QR Code</th>
                          <th className="px-8 py-6 text-center">Order</th>
                          <th className="px-8 py-6 text-center">Category</th>
                          <th className="px-8 py-6">Content</th>
                          <th className="px-8 py-6">Answer</th>
                          <th className="px-8 py-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {locations.map((location) => (
                          <tr key={location._id} className="hover:bg-white/5 transition-colors group">
                            <td className="px-8 py-6 font-bold text-lg">
                              <code className="bg-gray-800 px-3 py-1 rounded text-sm text-blue-400">{location.code}</code>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <span className="text-gray-300 font-mono">#{location.order}</span>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded-lg text-xs font-black border border-white/5">
                                {location.category}
                              </span>
                            </td>
                            <td className="px-8 py-6">
                              <p className="text-gray-400 text-sm truncate max-w-xs">{location.pdfContent || 'N/A'}</p>
                            </td>
                            <td className="px-8 py-6">
                              <code className="text-green-400 font-mono text-sm">{location.answer}</code>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <button 
                                onClick={() => handleDeleteLocation(location._id)}
                                className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-all"
                                title="Delete Location"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
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

            {activeTab === 'hints' && (
              <div className="space-y-8">
                <button 
                  onClick={() => setShowHintModal(true)}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition-all shadow-xl shadow-yellow-500/20 active:scale-95"
                >
                  <Plus size={24} /> Create New Hint
                </button>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {hints.map((hint) => (
                    <div key={hint._id} className="bg-gray-900 p-8 rounded-2xl border border-white/5 group hover:border-white/10 transition-all">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex flex-wrap gap-3">
                          <span className="bg-yellow-500/20 text-yellow-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-yellow-500/20">Step {hint.step}</span>
                          <span className="bg-white/5 text-gray-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5">Cat {hint.category}</span>
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${hint.isActive ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                            {hint.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => handleDeleteHint(hint._id)}
                            className="p-2 hover:bg-red-500/10 rounded-xl text-red-500/50 hover:text-red-500 transition-colors"
                            title="Delete Hint"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-xl font-black text-white mb-3">{hint.title}</h3>
                      <p className="text-gray-300 leading-relaxed">{hint.content}</p>
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
                      <QuestionContent
                        text={q.question}
                        imageUrl={q.imageUrl}
                        containerClassName="space-y-4 mb-4"
                        textClassName="text-xl font-medium text-gray-200 leading-relaxed"
                        imageClassName="w-full h-48 object-cover rounded-xl border border-white/10"
                      />
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

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowLocationModal(false)} />
          <div className="relative bg-gray-900 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl md:text-2xl font-black mb-4 sm:mb-6 md:mb-8 flex items-center gap-2 sm:gap-3">
              <MapPin className="text-red-500 size-5 sm:size-6" />
              <span>CREATE LOCATION/QR</span>
            </h2>
            <form onSubmit={handleCreateLocation} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">QR Code</label>
                <input 
                  type="text" 
                  required 
                  placeholder="QR_CODE_123"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm focus:outline-none focus:border-red-500 transition-colors"
                  value={newLocation.code}
                  onChange={(e) => setNewLocation({...newLocation, code: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Order</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm focus:outline-none focus:border-red-500 transition-colors"
                    value={newLocation.order}
                    onChange={(e) => setNewLocation({...newLocation, order: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Category</label>
                  <select 
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm focus:outline-none focus:border-red-500 transition-colors"
                    value={newLocation.category}
                    onChange={(e) => setNewLocation({...newLocation, category: e.target.value})}
                  >
                    {['ALL','A','B','C','D','E'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Content (PDF/Text)</label>
                <textarea 
                  rows="3"
                  placeholder="Content to display at this location..."
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm focus:outline-none focus:border-red-500 transition-colors resize-none"
                  value={newLocation.pdfContent}
                  onChange={(e) => setNewLocation({...newLocation, pdfContent: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Answer</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Correct answer"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm focus:outline-none focus:border-red-500 transition-colors"
                  value={newLocation.answer}
                  onChange={(e) => setNewLocation({...newLocation, answer: e.target.value})}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-black text-sm transition-all"
                >
                  CREATE
                </button>
                <button 
                  type="button"
                  onClick={() => setShowLocationModal(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 px-6 py-3 rounded-xl font-black text-sm transition-all"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clue Modal */}
      {showClueModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-4">
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
                <label className="block text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Image Upload (Local Only)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-[11px] sm:text-sm text-gray-400"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setNewClue({ ...newClue, image: file, imageUrl: '' });
                    setCluePreview(file ? URL.createObjectURL(file) : null);
                  }}
                />
              </div>
              <div className="text-center text-[10px] text-gray-600 font-bold">OR</div>
              <div>
                <label className="block text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Image URL (For Deployment)</label>
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-[11px] sm:text-sm"
                  value={newClue.imageUrl}
                  onChange={(e) => {
                    setNewClue({ ...newClue, imageUrl: e.target.value, image: null });
                    setCluePreview(e.target.value || null);
                  }}
                />
                <p className="text-[9px] text-gray-600 mt-1">Use Imgur, Cloudinary, or any public image URL</p>
              </div>
              
              {cluePreview && (
                <img
                  src={cluePreview}
                  alt="Clue preview"
                  className="mt-3 sm:mt-4 w-full h-32 sm:h-40 object-cover rounded-lg border border-white/10"
                />
              )}
              
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

      {/* Hint Modal */}
      {showHintModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowHintModal(false)} />
          <div className="relative bg-gray-900 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl md:text-2xl font-black mb-4 sm:mb-6 md:mb-8 flex items-center gap-2 sm:gap-3">
              <Lightbulb className="text-yellow-400 size-5 sm:size-6" />
              <span>ADD HINT</span>
            </h2>
            <form onSubmit={handleCreateHint} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Step</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm focus:outline-none focus:border-yellow-500 transition-colors"
                    value={newHint.step}
                    onChange={(e) => setNewHint({ ...newHint, step: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Category</label>
                  <select 
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm focus:outline-none focus:border-yellow-500 transition-colors"
                    value={newHint.category}
                    onChange={(e) => setNewHint({ ...newHint, category: e.target.value })}
                  >
                    {['ALL','A','B','C','D','E'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Title</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm focus:outline-none focus:border-yellow-500 transition-colors"
                  value={newHint.title}
                  onChange={(e) => setNewHint({ ...newHint, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Hint Content</label>
                <textarea 
                  required
                  rows="4"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm focus:outline-none focus:border-yellow-500 transition-colors resize-none"
                  value={newHint.content}
                  onChange={(e) => setNewHint({ ...newHint, content: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="submit"
                  className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-3 rounded-xl font-black text-sm transition-all"
                >
                  PUBLISH
                </button>
                <button 
                  type="button"
                  onClick={() => setShowHintModal(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 px-6 py-3 rounded-xl font-black text-sm transition-all"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-4">
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
                <label className="block text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Question (Markdown)</label>
                <textarea
                  ref={questionInputRef}
                  required
                  rows="5"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  value={newQuestion.question}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                  placeholder="Type text and use image uploads to insert inline"
                />
                <div className="mt-3">
                  <label className="block text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Insert Inline Image (Upload)</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-[11px] sm:text-sm text-gray-400"
                    onChange={handleInlineImageUpload}
                  />
                </div>
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
