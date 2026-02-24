import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Play,
  Settings,
  ChevronRight,
  Mic,
  BrainCircuit,
  BarChart3,
  X,
  Check,
  Star,
  Clock,
  Target,
  UserCircle2
} from 'lucide-react';

/**
 * Interview Landing Page - Redesigned for visual excellence
 */
export default function InterviewLanding() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // States
  const [showConfig, setShowConfig] = useState(false);
  const [activeTab, setActiveTab] = useState('role');
  const [interviewConfig, setInterviewConfig] = useState({
    role: 'Frontend Developer',
    experience: 'intermediate',
    duration: 20,
    focus: 'mixed',
    difficulty: 'adaptive'
  });

  const handleStartInterview = () => {
    if (!user) {
      navigate('/login', { state: { from: '/interview-landing' } });
      return;
    }
    setShowConfig(true);
  };

  const handleConfigureAndStart = () => {
    localStorage.setItem('interviewConfig', JSON.stringify(interviewConfig));
    navigate('/interview');
  };

  const roles = [
    'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
    'Java Developer', 'Data Analyst', 'Data Scientist',
    'DevOps Engineer', 'Product Manager', 'UI/UX Designer'
  ];

  const experienceLevels = [
    { value: 'fresher', label: 'Fresher', description: '0-1 years' },
    { value: 'intermediate', label: 'Intermediate', description: '2-4 years' },
    { value: 'experienced', label: 'Experienced', description: '5+ years' }
  ];

  const durations = [
    { value: 10, label: '10 min', description: 'Blitz' },
    { value: 20, label: '20 min', description: 'Standard' },
    { value: 30, label: '30 min', description: 'Deep Dive' }
  ];

  const focusAreas = [
    { value: 'technical', label: 'Technical', icon: <BrainCircuit className="w-5 h-5" /> },
    { value: 'hr', label: 'HR', icon: <UserCircle2 className="w-5 h-5" /> },
    { value: 'mixed', label: 'Mixed', icon: <Target className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen text-slate-200 font-sans selection:bg-blue-500/30 selection:text-blue-200" style={{ background: '#0A0E14' }}>
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-20">

        {/* Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

          {/* Hero Content */}
          <div className="lg:col-span-7 space-y-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Next-Gen Mock Interviews
              </div>

              <h1 className="text-6xl lg:text-8xl font-black text-white leading-[1.1] tracking-tight mb-8">
                Master your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400">
                  Career Path.
                </span>
              </h1>

              <p className="text-xl text-slate-400 leading-relaxed max-w-xl">
                Experience realistic, AI-powered mock interviews tailored to your role. Get instant feedback and improve your confidence.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-wrap gap-4 pt-4"
            >
              <button
                onClick={handleStartInterview}
                className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-blue-500/20 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <span className="flex items-center gap-2">
                  Start Practice <Play size={18} fill="currentColor" />
                </span>
              </button>

              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 text-slate-300 font-bold rounded-2xl transition-all flex items-center gap-2"
              >
                Explore Features <Settings size={18} />
              </button>
            </motion.div>

            {/* Quick Stats/Features */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-3 gap-8 pt-12 border-t border-slate-800/50"
            >
              {[
                { label: 'Latency', value: '1.2s', icon: <Clock className="text-blue-400" size={16} /> },
                { label: 'Role Specific', value: '50+', icon: <Target className="text-indigo-400" size={16} /> },
                { label: 'AI Model', value: 'GPT-4o', icon: <BrainCircuit className="text-cyan-400" size={16} /> },
              ].map((stat, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-tighter">
                    {stat.icon} {stat.label}
                  </div>
                  <div className="text-xl font-bold text-slate-200">{stat.value}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right Section - Interactive Card */}
          <div className="lg:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative aspect-square lg:aspect-auto lg:h-[600px] w-full bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-[40px] p-8 shadow-2xl overflow-hidden group"
            >
              {/* Card Background Glow */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full group-hover:bg-blue-500/20 transition-colors duration-700" />

              <div className="h-full flex flex-col justify-between relative z-10">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                      <Mic className="text-blue-400" />
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3].map(i => <div key={i} className="w-1 h-3 bg-blue-500/40 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />)}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mx-auto flex items-center justify-center shadow-2xl shadow-blue-500/20 p-1">
                      <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden border-2 border-white/10">
                        <span className="text-4xl">🤖</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">AI Interviewer</h3>
                      <p className="text-blue-400/80 text-sm font-medium">Listening for your response...</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Question</span>
                    </div>
                    <p className="text-slate-200 text-sm leading-relaxed">
                      "How do you handle state management across large-scale React applications with complex data flows?"
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Play size={16} fill="white" className="ml-1" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-blue-400 uppercase tracking-widest">Status</div>
                        <div className="text-white font-bold">In Session</div>
                      </div>
                    </div>
                    <BarChart3 className="text-blue-400" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Features Preview - Bristom Style Icons */}
        <div id="features" className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'Real-time TTS', desc: 'Hear natural voices with zero delay.', icon: <Mic className="w-6 h-6" /> },
            { title: 'AI Analysis', desc: 'Detailed skill-based feedback after every session.', icon: <BrainCircuit className="w-6 h-6" /> },
            { title: 'Adaptive DB', desc: 'Questions that grow with your technical skill.', icon: <Check className="w-6 h-6" /> },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-3xl bg-slate-900/20 border border-slate-800/40 hover:border-blue-500/30 transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                <div className="text-slate-400 group-hover:text-white">{f.icon}</div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Configuration Modal - Ultra Clean Glassmorphism */}
      <AnimatePresence>
        {showConfig && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfig(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >
              {/* Left Side Navigation */}
              <div className="w-full md:w-64 bg-slate-800/30 p-8 border-b md:border-b-0 md:border-r border-slate-800">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-white mb-8 px-2">Setup</h2>
                  {[
                    { id: 'role', label: 'Role', icon: <Target size={16} /> },
                    { id: 'level', label: 'Experience', icon: <Star size={16} /> },
                    { id: 'duration', label: 'Timeline', icon: <Clock size={16} /> },
                    { id: 'focus', label: 'Focus', icon: <BrainCircuit size={16} /> },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>

                <div className="hidden md:block mt-24">
                  <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                    <p className="text-[10px] uppercase tracking-widest text-blue-400 font-black mb-1">Status</p>
                    <p className="text-xs text-slate-400 font-medium">Configure to begin session</p>
                  </div>
                </div>
              </div>

              {/* Right Side Content */}
              <div className="flex-1 p-8 flex flex-col h-[500px]">
                <div className="flex-1">
                  {activeTab === 'role' && (
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                      <div className="text-xs font-black text-blue-500 uppercase tracking-[0.2em] mb-2">Selection</div>
                      <h3 className="text-2xl font-bold text-white mb-6">Which role are you practicing?</h3>
                      <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {roles.map((role) => (
                          <button
                            key={role}
                            onClick={() => setInterviewConfig(prev => ({ ...prev, role }))}
                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${interviewConfig.role === role ? 'bg-blue-600/10 border-blue-500/50 text-blue-400 font-bold' : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10'}`}
                          >
                            {role}
                            {interviewConfig.role === role && <Check size={16} />}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'level' && (
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                      <div className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em] mb-2">Experience</div>
                      <h3 className="text-2xl font-bold text-white mb-6">Expertise Level</h3>
                      <div className="space-y-3">
                        {experienceLevels.map((lvl) => (
                          <button
                            key={lvl.value}
                            onClick={() => setInterviewConfig(prev => ({ ...prev, experience: lvl.value }))}
                            className={`w-full text-left p-4 rounded-2xl border transition-all ${interviewConfig.experience === lvl.value ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                          >
                            <div className={`font-bold ${interviewConfig.experience === lvl.value ? 'text-indigo-400' : 'text-slate-200'}`}>{lvl.label}</div>
                            <div className="text-xs text-slate-500">{lvl.description}</div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'duration' && (
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                      <div className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em] mb-2">Time</div>
                      <h3 className="text-2xl font-bold text-white mb-6">Session Duration</h3>
                      <div className="grid grid-cols-1 gap-3">
                        {durations.map((dur) => (
                          <button
                            key={dur.value}
                            onClick={() => setInterviewConfig(prev => ({ ...prev, duration: dur.value }))}
                            className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${interviewConfig.duration === dur.value ? 'bg-emerald-600/10 border-emerald-500/50 text-emerald-400 font-bold' : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10'}`}
                          >
                            <div className="flex items-center gap-3">
                              <Clock size={16} />
                              <span>{dur.label}</span>
                            </div>
                            <span className="text-xs opacity-60 font-medium">{dur.description}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'focus' && (
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                      <div className="text-xs font-black text-purple-500 uppercase tracking-[0.2em] mb-2">Priority</div>
                      <h3 className="text-2xl font-bold text-white mb-6">Focus Objective</h3>
                      <div className="grid grid-cols-1 gap-3">
                        {focusAreas.map((f) => (
                          <button
                            key={f.value}
                            onClick={() => setInterviewConfig(prev => ({ ...prev, focus: f.value }))}
                            className={`flex items-center gap-4 p-5 rounded-2xl border transition-all ${interviewConfig.focus === f.value ? 'bg-purple-600/10 border-purple-500/50 text-purple-400 font-bold' : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10'}`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${interviewConfig.focus === f.value ? 'bg-purple-600/20' : 'bg-white/10'}`}>
                              {f.icon}
                            </div>
                            <span>{f.label} Interview</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="pt-6 border-t border-slate-800 flex items-center justify-between gap-4">
                  <button
                    onClick={() => setShowConfig(false)}
                    className="p-4 text-slate-500 hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>

                  <button
                    onClick={handleConfigureAndStart}
                    className="flex-1 py-4 bg-white text-slate-950 font-black rounded-2xl hover:bg-blue-50 transition-all flex items-center justify-center gap-2 group"
                  >
                    Launch Interview <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Styles for custom scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}