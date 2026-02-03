import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { teamAPI } from '../api';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

const QuizPage = () => {
  const [quizInfo, setQuizInfo] = useState(null);
  const [answers, setAnswers] = useState({});
  const [startTime] = useState(Date.now());
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuiz();
  }, []);

  const fetchQuiz = async () => {
    try {
      const { data } = await teamAPI.getQuiz();
      setQuizInfo(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load quiz');
      if (err.response?.status === 403) {
        // Already attempted or not unlocked
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quizInfo?.questions?.length) return;

    setFormError('');

    const unanswered = quizInfo.questions.filter((q) => !answers[q._id]);
    if (unanswered.length > 0) {
      setFormError('Please answer all questions before submitting');
      return;
    }

    setSubmitting(true);
    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    try {
      const payload = {
        answers: quizInfo.questions.map((q) => ({
          questionId: q._id,
          answer: answers[q._id]
        })),
        timeTaken
      };
      const { data } = await teamAPI.submitQuiz(payload);
      alert(data.message);
      navigate('/dashboard');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (error) return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6 text-center">
      <div className="max-w-md">
        <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
        <p className="text-xl font-bold">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="mt-4 text-blue-400">Back to Dashboard</button>
      </div>
    </div>
  );

  if (!quizInfo) return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      <p className="text-blue-400 font-black uppercase tracking-[0.3em] animate-pulse">Initializing Neural Link...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-3 sm:p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.1),transparent_50%)]" />
      
      <div className="max-w-2xl mx-auto py-6 sm:py-12 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-6 mb-6 sm:mb-12">
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="p-1.5 sm:p-2 bg-blue-600 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                <CheckCircle size={16} className="sm:size-5" />
              </div>
              <span className="text-[8px] sm:text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Quiz</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight uppercase italic">
              Step {quizInfo.step} <span className="text-blue-500">Quiz</span>
            </h1>
            <p className="text-gray-500 text-[8px] sm:text-xs font-bold uppercase tracking-[0.3em] mt-1 sm:mt-2">
              {quizInfo.questions?.length || 0} Questions
            </p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-md px-3 sm:px-6 py-2 sm:py-4 rounded-lg sm:rounded-2xl border border-white/10 flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <div className="p-1.5 sm:p-2 bg-white/5 rounded-full animate-pulse">
              <Clock className="text-blue-400 size-4 sm:size-5" />
            </div>
            <div>
              <div className="text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</div>
              <div className="font-mono font-bold text-blue-400 text-xs sm:text-sm">Active</div>
            </div>
          </div>
        </div>

        <div className="bg-[#0c1222] p-4 sm:p-8 md:p-10 rounded-lg sm:rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30" />
          
          <div className="mb-6 sm:mb-10">
            <p className="text-gray-500 text-[8px] sm:text-[10px] font-black mb-2 sm:mb-4 uppercase tracking-[0.3em]">Instructions</p>
            <p className="text-sm sm:text-lg md:text-2xl font-bold leading-relaxed text-gray-200">
              Answer all questions to proceed.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-8 md:space-y-10">
            {formError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold">
                {formError}
              </div>
            )}
            {quizInfo.questions.map((q, idx) => (
              <div key={q._id} className="bg-black/40 border border-white/5 rounded-lg sm:rounded-2xl p-3 sm:p-6 md:p-8 space-y-3 sm:space-y-6">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Q{idx + 1}</div>
                  <div className="text-[8px] sm:text-[10px] font-black text-green-400 uppercase tracking-widest">{q.points} pts</div>
                </div>

                {q.imageUrl && (
                  <img
                    src={q.imageUrl}
                    alt={`Q${idx + 1}`}
                    className="w-full max-h-40 sm:max-h-56 md:max-h-64 object-cover rounded-lg sm:rounded-xl border border-white/10"
                  />
                )}

                <p className="text-base sm:text-lg md:text-2xl font-bold text-gray-200 leading-relaxed">
                  {q.question}
                </p>

                {q.options && q.options.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
                    {q.options.map((opt, i) => (
                      <button
                        key={`${q._id}-${i}`}
                        type="button"
                        onClick={() => setAnswers((prev) => ({ ...prev, [q._id]: opt }))}
                        className={`p-2.5 sm:p-4 md:p-5 rounded-lg sm:rounded-xl border-2 text-left font-bold transition-all text-xs sm:text-sm md:text-base ${
                          answers[q._id] === opt
                            ? 'bg-blue-600 border-blue-400 text-white'
                            : 'bg-black/60 border-white/10 text-gray-400 hover:border-blue-500/60 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 sm:gap-4">
                          <span className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-black flex-shrink-0 ${
                            answers[q._id] === opt ? 'bg-white text-blue-600' : 'bg-white/10 text-gray-600'
                          }`}>
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="truncate">{opt}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="relative group/input">
                    <input
                      type="text"
                      className="w-full bg-black/40 border-2 border-white/5 rounded-lg sm:rounded-2xl px-3 sm:px-6 py-2 sm:py-4 text-sm sm:text-lg font-bold focus:outline-none focus:border-blue-500/50 focus:bg-black/60 transition-all placeholder:text-gray-700"
                      placeholder="Answer..."
                      value={answers[q._id] || ''}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q._id]: e.target.value }))}
                      disabled={submitting}
                      required
                    />
                    <div className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 opacity-20 group-focus-within/input:opacity-100 transition-opacity">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full animate-ping" />
                    </div>
                  </div>
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={submitting}
              className="w-full relative group/btn overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 group-hover/btn:from-blue-500 group-hover/btn:to-indigo-500 transition-all" />
              <div className="relative py-3 sm:py-5 md:py-6 rounded-lg sm:rounded-2xl flex items-center justify-center gap-2 sm:gap-4 text-xs sm:text-base md:text-xl font-black uppercase tracking-widest text-white">
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span className="hidden xs:inline">Sending</span><span className="inline xs:hidden">...</span>
                  </>
                ) : (
                  <>
                    Submit
                    <CheckCircle size={16} className="group-hover/btn:scale-110 transition-transform sm:size-6" />
                  </>
                )}
              </div>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
