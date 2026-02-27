import { useEffect, useState } from "react";
import axios from "../api/axiosConfig";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { motion } from "framer-motion";
import {
  BookOpen,
  Code2,
  BrainCircuit,
  Target,
  Trash2,
  Plus,
  TrendingUp,
  Award,
  Clock,
  ArrowRight,
  Zap,
  Activity,
  FileCheck,
  Globe
} from "lucide-react";
import ResumeAnalysis from "../components/ResumeAnalysis";
import PortfolioLinks from "../components/PortfolioLinks";

export default function Dashboard() {
  const { user } = useAuth();
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAssessments: 0,
    totalInterviews: 0,
    completedSteps: 0,
    averageScore: 0
  });

  // Helper functions
  const getCompletedStepsCount = (roadmap) => {
    if (!roadmap.modules || !Array.isArray(roadmap.modules)) return 0;
    return roadmap.modules.filter(m => m.status === 'COMPLETED' || m.completed === true).length;
  };

  const getTotalStepsCount = (roadmap) => {
    if (!roadmap.modules || !Array.isArray(roadmap.modules)) return 0;
    return roadmap.modules.length;
  };

  useEffect(() => {
    if (user?.id) {
      const fetchDashboardData = async () => {
        try {
          const roadmapsRes = await axios.get(`/roadmaps`);
          const roadmapsData = roadmapsRes.data?.data || [];
          setRoadmaps(roadmapsData);

          const statsRes = await axios.get('/users/stats');
          const statsData = statsRes.data;

          setStats({
            totalAssessments: statsData.totalAssessments,
            totalInterviews: statsData.totalInterviews,
            completedSteps: statsData.completedSteps,
            averageScore: statsData.averageScore
          });
        } catch (err) {
          console.error("Failed to fetch dashboard data", err);
          setRoadmaps([]);
        } finally {
          setLoading(false);
        }
      };
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleDelete = async (roadmapId) => {
    if (window.confirm('Are you sure you want to delete this roadmap?')) {
      try {
        await axios.delete(`/roadmaps/${roadmapId}`);
        setRoadmaps(roadmaps.filter((roadmap) => roadmap._id !== roadmapId));
      } catch (err) {
        console.error("Failed to delete roadmap", err);
        alert("Failed to delete roadmap. Please try again.");
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-blue-400 font-medium animate-pulse">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pb-20 pt-24" style={{ background: 'linear-gradient(to right, #000001, #000000)' }}>
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        className="container mx-auto px-6 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-12 gap-4 md:gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-2">
              Welcome back, {user?.name?.split(' ')[0] || 'Explorer'} 👋
            </h1>
            <p className="text-gray-400 text-base md:text-lg">Your learning journey continues here.</p>
          </div>

          <Link
            to="/roadmap/create-personalized"
            className="group flex items-center gap-2 px-5 md:px-6 py-2.5 md:py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] w-full sm:w-auto justify-center"
          >
            <Plus className="w-5 h-5" />
            <span>New Roadmap</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12 md:mb-16">
          <StatCard
            icon={<Award className="w-6 h-6 text-yellow-400" />}
            value={`${stats.averageScore}%`}
            label="Average Score"
            trend="+5% vs last week"
            color="yellow"
          />
          <StatCard
            icon={<Target className="w-6 h-6 text-emerald-400" />}
            value={stats.completedSteps}
            label="Steps Completed"
            trend="Keep it up!"
            color="emerald"
          />
          <StatCard
            icon={<Activity className="w-6 h-6 text-blue-400" />}
            value={stats.totalAssessments}
            label="Assessments"
            trend="2 Pending"
            color="blue"
          />
          <StatCard
            icon={<BrainCircuit className="w-6 h-6 text-cyan-400" />}
            value={stats.totalInterviews}
            label="Interviews"
            trend="Mastering AI"
            color="cyan"
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Main Column: Roadmaps */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4 md:space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                Active Roadmaps
              </h2>
              <Link to="/roadmap" className="text-xs md:text-sm text-gray-400 hover:text-white transition-colors">
                View All
              </Link>
            </div>

            {roadmaps.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-4">
                {roadmaps.slice(0, 3).map((roadmap) => (
                  <RoadmapCard
                    key={roadmap._id}
                    roadmap={roadmap}
                    onDelete={handleDelete}
                    completedSteps={getCompletedStepsCount(roadmap)}
                    totalSteps={getTotalStepsCount(roadmap)}
                  />
                ))}
              </div>
            )}
          </motion.div>

          {/* Side Column: Quick Actions */}
          <motion.div variants={itemVariants} className="space-y-4 md:space-y-6">
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
              Quick Actions
            </h2>
            <div className="grid gap-3 md:gap-4">
              <QuickActionCard
                to="/assessment"
                icon={<Code2 className="w-6 h-6" />}
                title="Skill Assessment"
                desc="Test your knowledge"
                gradient="from-blue-600 to-cyan-600"
              />
              <QuickActionCard
                to="/interview"
                icon={<BrainCircuit className="w-6 h-6" />}
                title="AI Interview"
                desc="Practice soft skills"
                gradient="from-cyan-600 to-emerald-600"
              />
              <QuickActionCard
                to="/coding"
                icon={<Code2 className="w-6 h-6" />}
                title="Code Arena"
                desc="Solve algorithms"
                gradient="from-emerald-600 to-teal-600"
              />
            </div>

            {/* Daily Tip or Motivation */}
            <div className="bg-gradient-to-br from-gray-900 to-black border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
              <h3 className="font-bold text-lg mb-2 z-10 relative">💡 Daily Insight</h3>
              <p className="text-gray-400 text-sm z-10 relative leading-relaxed">
                "Consistency is key. 30 minutes of coding every day is better than 5 hours once a week."
              </p>
            </div>
          </motion.div>
        </div>

        {/* Digital Presence & Career Section */}
        <div className="mt-12 md:mt-16 grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
          <div className="xl:col-span-2">
            <div className="flex items-center gap-3 mb-6 md:mb-8">
              <div className="p-2 md:p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl md:rounded-2xl text-white shadow-lg shadow-blue-500/20">
                <FileCheck className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white">Resume Optimizer</h2>
                <p className="text-sm md:text-base text-gray-400">AI-powered technical evaluation</p>
              </div>
            </div>
            <ResumeAnalysis />
          </div>

          <div className="xl:col-span-1">
            <div className="flex items-center gap-3 mb-6 md:mb-8">
              <div className="p-2 md:p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl md:rounded-2xl text-white shadow-lg shadow-purple-500/20">
                <Globe className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white">Portfolios</h2>
                <p className="text-sm md:text-base text-gray-400">Live project links</p>
              </div>
            </div>
            <PortfolioLinks />
          </div>
        </div>

      </motion.div>
    </div>
  );
}

function StatCard({ icon, value, label, trend, color }) {
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 p-6 rounded-2xl hover:border-white/20 transition-all hover:-translate-y-1 duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl bg-${color}-500/10 group-hover:bg-${color}-500/20 transition-colors`}>
          {icon}
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full bg-${color}-500/10 text-${color}-400`}>
          {trend}
        </span>
      </div>
      <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
      <p className="text-gray-400 text-sm">{label}</p>
    </div>
  );
}

function RoadmapCard({ roadmap, onDelete, completedSteps, totalSteps }) {
  const completed = completedSteps;
  const total = totalSteps;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="group relative bg-gray-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-4 md:p-6 hover:border-blue-500/50 transition-all duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6">
        <div className="w-14 h-14 md:w-16 md:h-16 flex-shrink-0">
          <CircularProgressbar
            value={percentage}
            text={`${percentage}%`}
            styles={buildStyles({
              pathColor: percentage >= 100 ? '#10B981' : '#3B82F6',
              textColor: '#fff',
              trailColor: 'rgba(255,255,255,0.1)',
              textSize: '24px',
              pathTransitionDuration: 0.5,
            })}
          />
        </div>

        <div className="flex-grow w-full sm:w-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
            <div className="flex-1">
              <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                {roadmap.title || roadmap.primaryDomain || 'Untitled Roadmap'}
              </h3>
              <p className="text-xs md:text-sm text-gray-400 mt-1">
                {completed} of {total} steps completed
              </p>
            </div>

            <button
              onClick={() => onDelete(roadmap._id)}
              className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all self-end sm:self-auto"
              title="Delete Roadmap"
            >
              <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-2 md:gap-3">
            <Link
              to={`/roadmap/${roadmap._id}`}
              className="text-xs md:text-sm font-semibold bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg text-white border border-white/5 transition-all flex items-center justify-center gap-2"
            >
              Continue Learning <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ to, icon, title, desc, gradient }) {
  return (
    <Link to={to} className="block group">
      <div className={`bg-gradient-to-r ${gradient} p-[1px] rounded-2xl`}>
        <div className="bg-gray-950 rounded-2xl p-4 flex items-center gap-4 h-full relative overflow-hidden">
          <div className={`p-3 rounded-lg bg-gradient-to-br ${gradient} text-white group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
          <div>
            <h4 className="font-bold text-white">{title}</h4>
            <p className="text-xs text-gray-400">{desc}</p>
          </div>
          <ArrowRight className="absolute right-4 text-white/20 group-hover:text-white/80 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="border border-dashed border-gray-700 rounded-3xl p-12 flex flex-col items-center justify-center text-center text-gray-500 hover:border-gray-500 transition-colors bg-gray-900/20">
      <BookOpen className="w-12 h-12 mb-4 opacity-50" />
      <h3 className="text-xl font-bold text-white mb-2">No Roadmaps Yet</h3>
      <p className="mb-6 max-w-xs mx-auto">Start your first learning journey today and track your progress.</p>
      <Link
        to="/roadmap"
        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold transition-all shadow-lg shadow-blue-500/20"
      >
        Explore Roadmaps
      </Link>
    </div>
  );
}
