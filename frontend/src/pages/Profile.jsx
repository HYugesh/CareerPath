import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from '../api/axiosConfig';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Settings,
  Activity,
  MapPin,
  Briefcase,
  Mail,
  Camera,
  Save,
  X,
  CheckCircle2,
  Award,
  TrendingUp,
  Layout,
  Lock,
  ShieldCheck
} from 'lucide-react';

export default function Profile() {
  const { user, setUser } = useAuth();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalAssessments: 0,
    totalInterviews: 0,
    activeRoadmaps: 0,
    completedSteps: 0
  });

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    bio: '',
    location: '',
    experience: 'beginner',
    role: ''
  });

  const [isEditing, setIsEditing] = useState(false);

  // Sync state with user context when loaded
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || 'Passionate learner exploring the world of AI.',
        location: user.location || 'Earth',
        experience: user.experience || 'beginner',
        role: user.role || 'Learner'
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get('/users/stats');
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    };
    if (user) {
      fetchStats();
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await axios.put('/users/profile', profileData);
      setUser({ ...user, ...data }); // Update context
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("Failed to save changes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Layout },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen text-white pt-24 pb-12" style={isDark ? { background: 'linear-gradient(to right, #000001, #000000)' } : { background: '#F8FAFC', color: '#111827' }}>
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="container max-w-5xl mx-auto px-6 relative z-10">

        {/* Profile Header Card */}
        <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden mb-8 shadow-2xl">
          {/* Banner */}
          <div className="h-48 bg-gradient-to-r from-blue-900 via-cyan-900 to-black relative">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          </div>

          <div className="px-8 pb-8">
            <div className="flex flex-col md:flex-row items-end -mt-16 gap-6">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-3xl bg-gray-900 border-4 border-gray-900 flex items-center justify-center text-4xl font-bold bg-gradient-to-br from-blue-500 to-cyan-600 shadow-xl overflow-hidden">
                  {getUserInitials(user?.name)}
                </div>
                <button className="absolute bottom-2 right-2 p-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Info */}
              <div className="flex-grow pb-0">
                <h1 className="text-3xl font-bold text-white mb-1">{user?.name}</h1>
                <p className="text-gray-400 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> {user?.email}
                  <span className="mx-2">•</span>
                  <MapPin className="w-4 h-4" /> {profileData.location}
                </p>
              </div>

              {/* Edit Button */}
              <button
                onClick={() => {
                  setIsEditing(true);
                  setActiveTab('settings');
                }}
                className="mb-4 px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/5 rounded-full font-medium transition-all"
              >
                Edit Profile
              </button>
            </div>

            {/* Header Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/5">
              <HeaderStat label="Assessments" value={stats.totalAssessments} />
              <HeaderStat label="Completed Steps" value={stats.completedSteps} />
              <HeaderStat label="Active Roadmaps" value={stats.activeRoadmaps} />
              <HeaderStat label="Interviews" value={stats.totalInterviews} />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Sidebar Navigation (Desktop) */}
          <div className="lg:col-span-3">
            <div className="bg-gray-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-2 sticky top-24">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'overview' && <OverviewTab stats={stats} user={user} />}
                {activeTab === 'activity' && <ActivityTab activities={stats.recentActivities} />}
                {activeTab === 'settings' && (
                  <SettingsTab
                    profileData={profileData}
                    setProfileData={setProfileData}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    handleProfileUpdate={handleProfileUpdate}
                    loading={loading}
                    setLoading={setLoading}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}

function HeaderStat({ label, value }) {
  return (
    <div className="text-center md:text-left">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-400 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function OverviewTab({ stats }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900/40 border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" /> Recent Progress
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Roadmap Completion</span>
              <span className="text-white font-mono">
                {stats.totalSteps > 0 ? Math.round((stats.completedSteps / stats.totalSteps) * 100) : 0}%
              </span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${stats.totalSteps > 0 ? (stats.completedSteps / stats.totalSteps) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-900/40 border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" /> Achievements
          </h3>
          <div className="flex gap-2">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-xl hover:scale-110 transition-transform cursor-pointer" title="First Steps">🚀</div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-xl hover:scale-110 transition-transform cursor-pointer" title="Code Warrior">💻</div>
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-xl hover:scale-110 transition-transform cursor-pointer" title="Interview Ready">🎤</div>
          </div>
        </div>
      </div>

      <ActivityTab activities={stats.recentActivities} limit={3} showHeader={true} />
    </div>
  );
}

function ActivityTab({ activities = [], limit = 10, showHeader = false }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const activityIcons = {
    CheckCircle2: CheckCircle2,
    Mail: Mail,
    Layout: Layout,
    Settings: Settings
  };

  const displayActivities = limit ? activities.slice(0, limit) : activities;

  return (
    <div className="bg-gray-900/40 border border-white/5 rounded-2xl p-6">
      {showHeader && <h3 className="text-lg font-bold mb-6">Recent Activity</h3>}
      {displayActivities.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No recent activity found.</p>
      ) : (
        <div className="relative border-l border-gray-800 ml-3 space-y-8 pl-8">
          {displayActivities.map((item) => {
            const Icon = activityIcons[item.icon] || Activity;
            return (
              <div key={item.id} className="relative">
                <span className={`absolute -left-[41px] p-2 rounded-full bg-gray-900 border border-gray-800 ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-white font-medium">{item.title}</h4>
                    <p className="text-gray-500 text-sm">{formatDate(item.time)}</p>
                  </div>
                  {item.score && (
                    <span className="px-2 py-1 rounded bg-white/5 text-xs font-mono text-gray-300 border border-white/5">
                      {item.score}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SettingsTab({ profileData, setProfileData, isEditing, setIsEditing, handleProfileUpdate, loading, setLoading }) {
  return (
    <div className="bg-gray-900/40 border border-white/5 rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold">Account Settings</h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-400 hover:text-white text-sm font-medium"
          >
            Edit Information
          </button>
        )}
      </div>

      <form onSubmit={handleProfileUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Full Name</label>
          <input
            type="text"
            value={profileData.name}
            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
            disabled={!isEditing}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-400">Email Address</label>
          <input
            type="email"
            value={profileData.email}
            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
            disabled={!isEditing}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-400">Location</label>
          <input
            type="text"
            value={profileData.location}
            onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
            disabled={!isEditing}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-400">Role</label>
          <input
            type="text"
            value={profileData.role}
            onChange={(e) => setProfileData({ ...profileData, role: e.target.value })}
            disabled={!isEditing}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-400">Experience Level</label>
          <select
            value={profileData.experience}
            onChange={(e) => setProfileData({ ...profileData, experience: e.target.value })}
            disabled={!isEditing}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 appearance-none"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-sm text-gray-400">Bio</label>
          <textarea
            rows={4}
            value={profileData.bio}
            onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
            disabled={!isEditing}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 resize-none"
          />
        </div>

        {isEditing && (
          <div className="md:col-span-2 flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-6 py-2 rounded-lg text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              {loading ? <span className="animate-spin">âŒ›</span> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        )}
      </form>

      {/* Change Password Section */}
      <div className="mt-12 pt-8 border-t border-white/5">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Lock className="w-5 h-5 text-blue-400" /> Security
        </h3>

        <PasswordChangeSection setLoading={setLoading} />
      </div>
    </div>
  );
}
function PasswordChangeSection({ setLoading }) {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      await axios.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setStatus({ type: 'success', message: 'Password updated successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error('Failed to change password', err);
      setStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update password. Please check your current password.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleChangePassword} className='grid grid-cols-1 md:grid-cols-2 gap-6'>
      <div className='space-y-2'>
        <label className='text-sm text-gray-400'>Current Password</label>
        <input
          type='password'
          required
          value={passwordData.currentPassword}
          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
          className='w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors'
          placeholder='••••••••'
        />
      </div>

      <div className='hidden md:block'></div>

      <div className='space-y-2'>
        <label className='text-sm text-gray-400'>New Password</label>
        <input
          type='password'
          required
          value={passwordData.newPassword}
          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
          className='w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors'
          placeholder='••••••••'
        />
        <p className='text-[10px] text-gray-500'>Min. 8 characters, 1 uppercase, 1 number</p>
      </div>

      <div className='space-y-2'>
        <label className='text-sm text-gray-400'>Confirm New Password</label>
        <input
          type='password'
          required
          value={passwordData.confirmPassword}
          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
          className='w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors'
          placeholder='••••••••'
        />
      </div>

      <div className='md:col-span-2 flex flex-col md:flex-row items-center justify-between gap-4 mt-2'>
        <div className='h-6'>
          <AnimatePresence mode='wait'>
            {status.message && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className={`text-sm flex items-center gap-2 ${status.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {status.type === 'success' ? <ShieldCheck className='w-4 h-4' /> : <X className='w-4 h-4' />}
                {status.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <button
          type='submit'
          className='w-full md:w-auto px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/10'
        >
          <Lock className='w-4 h-4' />
          Update Password
        </button>
      </div>
    </form>
  );
}
