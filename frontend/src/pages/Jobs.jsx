import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import axios from '../api/axiosConfig';
import {
  Search, MapPin, Bell, BellOff, Trash2, ExternalLink,
  Briefcase, Clock, Building2, Loader2, Plus, X, RefreshCw,
  ChevronDown, Globe, Zap
} from 'lucide-react';

const POPULAR_ROLES = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer',
  'Full Stack Developer', 'Data Scientist', 'Machine Learning Engineer',
  'DevOps Engineer', 'Cloud Engineer', 'Product Manager', 'UI/UX Designer',
];

const SITES = [
  { id: 'indeed', label: 'Indeed' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'zip_recruiter', label: 'ZipRecruiter' },
];

export default function Jobs() {
  const { isDark } = useTheme();
  const [tab, setTab] = useState('search'); // 'search' | 'alerts'

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('Hyderabad, Telangana, India');
  const [hoursOld, setHoursOld] = useState(72);
  const [resultsWanted, setResultsWanted] = useState(20);
  const [selectedSites, setSelectedSites] = useState(['indeed', 'linkedin']);
  const [jobs, setJobs] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [expandedJob, setExpandedJob] = useState(null);

  // Alerts state
  const [alerts, setAlerts] = useState([]);
  const [alertRole, setAlertRole] = useState('');
  const [alertLocation, setAlertLocation] = useState('India');
  const [creatingAlert, setCreatingAlert] = useState(false);
  const [alertJobs, setAlertJobs] = useState({});
  const [loadingAlertJobs, setLoadingAlertJobs] = useState({});

  useEffect(() => { fetchAlerts(); }, []);

  const fetchAlerts = async () => {
    try {
      const { data } = await axios.get('/jobs/alerts');
      setAlerts(data.alerts);
    } catch { /* silent */ }
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchTerm.trim()) return;
    setSearching(true);
    setSearchError('');
    setJobs([]);
    try {
      const { data } = await axios.post('/jobs/scrape', {
        search_term: searchTerm,
        location,
        hours_old: hoursOld,
        results_wanted: resultsWanted,
        sites: selectedSites,
      });
      setJobs(data.jobs || []);
      if (!data.jobs?.length) setSearchError('No jobs found. Try different keywords or broaden the time range.');
    } catch (err) {
      setSearchError(err.response?.data?.detail || 'Scraping failed. Make sure the job service is running.');
    } finally {
      setSearching(false);
    }
  };

  const createAlert = async () => {
    if (!alertRole.trim()) return;
    setCreatingAlert(true);
    try {
      const { data } = await axios.post('/jobs/alerts', { role: alertRole, location: alertLocation });
      setAlerts(prev => [data.alert, ...prev]);
      setAlertRole('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create alert');
    } finally {
      setCreatingAlert(false);
    }
  };

  const deleteAlert = async (id) => {
    await axios.delete(`/jobs/alerts/${id}`);
    setAlerts(prev => prev.filter(a => a._id !== id));
  };

  const toggleAlert = async (id) => {
    const { data } = await axios.patch(`/jobs/alerts/${id}/toggle`);
    setAlerts(prev => prev.map(a => a._id === id ? data.alert : a));
  };

  const fetchAlertJobs = async (alert) => {
    setLoadingAlertJobs(prev => ({ ...prev, [alert._id]: true }));
    try {
      const { data } = await axios.get(`/jobs/alerts/${alert._id}/jobs`);
      setAlertJobs(prev => ({ ...prev, [alert._id]: data.jobs }));
      setAlerts(prev => prev.map(a => a._id === alert._id ? data.alert : a));
    } catch {
      setAlertJobs(prev => ({ ...prev, [alert._id]: [] }));
    } finally {
      setLoadingAlertJobs(prev => ({ ...prev, [alert._id]: false }));
    }
  };

  const toggleSite = (id) => setSelectedSites(prev =>
    prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
  );

  // ── Theme ──
  const page = isDark ? 'min-h-screen bg-black text-white pt-24 pb-16' : 'min-h-screen pt-24 pb-16';
  const pageStyle = isDark ? {} : { background: '#F8FAFC', color: '#111827' };
  const card = isDark ? 'bg-[#0f1115] border border-gray-800' : 'bg-white border border-gray-200 shadow-sm';
  const input = isDark
    ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500';
  const muted = isDark ? 'text-gray-400' : 'text-gray-500';
  const heading = isDark ? 'text-white' : 'text-gray-900';

  return (
    <div className={page} style={pageStyle}>
      <div className="max-w-6xl mx-auto px-4 md:px-6">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Briefcase size={20} className="text-white" />
            </div>
            <h1 className={`text-3xl font-bold ${heading}`}>Job Board</h1>
          </div>
          <p className={muted}>Search live job listings or set up alerts for your target roles.</p>
        </div>

        {/* Tabs */}
        <div className={`flex gap-1 p-1 rounded-xl mb-8 w-fit ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
          {[{ id: 'search', label: 'Search Jobs', icon: Search }, { id: 'alerts', label: 'Job Alerts', icon: Bell }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                tab === t.id
                  ? isDark ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-900 shadow'
                  : muted
              }`}>
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>

        {/* ── SEARCH TAB ── */}
        {tab === 'search' && (
          <div className="space-y-6">
            {/* Search form */}
            <div className={`rounded-2xl p-6 ${card}`}>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${muted}`}>Job Title / Role</label>
                    <div className="relative">
                      <Search size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${muted}`} />
                      <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="e.g. Software Engineer"
                        className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${input}`}
                      />
                    </div>
                    {/* Quick role chips */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {POPULAR_ROLES.slice(0, 5).map(r => (
                        <button key={r} type="button" onClick={() => setSearchTerm(r)}
                          className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                            searchTerm === r
                              ? 'bg-blue-600 text-white border-blue-600'
                              : isDark ? 'border-gray-700 text-gray-400 hover:border-blue-500 hover:text-blue-400' : 'border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600'
                          }`}>
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${muted}`}>Location</label>
                    <div className="relative">
                      <MapPin size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${muted}`} />
                      <input
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        placeholder="e.g. Hyderabad, India"
                        className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${input}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Filters row */}
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${muted}`}>Posted within</label>
                    <select value={hoursOld} onChange={e => setHoursOld(+e.target.value)}
                      className={`px-3 py-2 rounded-lg border text-sm focus:outline-none ${input}`}>
                      <option value={24}>24 hours</option>
                      <option value={48}>48 hours</option>
                      <option value={72}>3 days</option>
                      <option value={168}>1 week</option>
                      <option value={720}>30 days</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${muted}`}>Results</label>
                    <select value={resultsWanted} onChange={e => setResultsWanted(+e.target.value)}
                      className={`px-3 py-2 rounded-lg border text-sm focus:outline-none ${input}`}>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={30}>30</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${muted}`}>Sources</label>
                    <div className="flex gap-2">
                      {SITES.map(s => (
                        <button key={s.id} type="button" onClick={() => toggleSite(s.id)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                            selectedSites.includes(s.id)
                              ? 'bg-blue-600 text-white border-blue-600'
                              : isDark ? 'border-gray-700 text-gray-400 hover:border-gray-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={searching || !searchTerm.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-all">
                  {searching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                  {searching ? 'Scraping jobs...' : 'Search Jobs'}
                </button>
              </form>
            </div>

            {/* Results */}
            {searching && (
              <div className="flex flex-col items-center py-16 gap-4">
                <Loader2 size={32} className="animate-spin text-blue-500" />
                <p className={muted}>Scraping live job listings... this may take 15–30 seconds</p>
              </div>
            )}

            {searchError && !searching && (
              <div className={`rounded-xl p-4 text-sm ${isDark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                {searchError}
              </div>
            )}

            {!searching && jobs.length > 0 && (
              <div>
                <p className={`text-sm mb-4 ${muted}`}>{jobs.length} jobs found</p>
                <div className="space-y-3">
                  {jobs.map((job, i) => (
                    <JobCard key={i} job={job} isDark={isDark} expanded={expandedJob === i}
                      onToggle={() => setExpandedJob(expandedJob === i ? null : i)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ALERTS TAB ── */}
        {tab === 'alerts' && (
          <div className="space-y-6">
            {/* Create alert */}
            <div className={`rounded-2xl p-6 ${card}`}>
              <h3 className={`font-bold text-lg mb-4 ${heading}`}>Create Job Alert</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Briefcase size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${muted}`} />
                  <input
                    value={alertRole}
                    onChange={e => setAlertRole(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && createAlert()}
                    placeholder="Role (e.g. Frontend Developer)"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${input}`}
                  />
                </div>
                <div className="relative sm:w-52">
                  <MapPin size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${muted}`} />
                  <input
                    value={alertLocation}
                    onChange={e => setAlertLocation(e.target.value)}
                    placeholder="Location"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${input}`}
                  />
                </div>
                <button onClick={createAlert} disabled={creatingAlert || !alertRole.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-all shrink-0">
                  {creatingAlert ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Add Alert
                </button>
              </div>

              {/* Quick role chips */}
              <div className="flex flex-wrap gap-2 mt-4">
                {POPULAR_ROLES.map(r => (
                  <button key={r} onClick={() => setAlertRole(r)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      alertRole === r
                        ? 'bg-blue-600 text-white border-blue-600'
                        : isDark ? 'border-gray-700 text-gray-400 hover:border-blue-500 hover:text-blue-400' : 'border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600'
                    }`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Alert list */}
            {alerts.length === 0 ? (
              <div className={`rounded-2xl p-12 text-center ${card}`}>
                <Bell size={40} className={`mx-auto mb-3 ${muted}`} />
                <p className={`font-semibold ${heading}`}>No alerts yet</p>
                <p className={`text-sm mt-1 ${muted}`}>Create an alert to get notified about new jobs</p>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map(alert => (
                  <div key={alert._id} className={`rounded-2xl overflow-hidden ${card}`}>
                    <div className="p-5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${alert.active ? 'bg-blue-600/20' : isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                          <Bell size={16} className={alert.active ? 'text-blue-400' : muted} />
                        </div>
                        <div className="min-w-0">
                          <p className={`font-semibold truncate ${heading}`}>{alert.role}</p>
                          <p className={`text-xs flex items-center gap-1 ${muted}`}>
                            <MapPin size={11} /> {alert.location}
                            {alert.lastTriggered && (
                              <span className="ml-2">· Last checked {new Date(alert.lastTriggered).toLocaleDateString()}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => fetchAlertJobs(alert)} disabled={loadingAlertJobs[alert._id]}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}>
                          {loadingAlertJobs[alert._id] ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                          Fetch Jobs
                        </button>
                        <button onClick={() => toggleAlert(alert._id)} title={alert.active ? 'Pause' : 'Resume'}
                          className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} ${alert.active ? 'text-blue-400' : muted}`}>
                          {alert.active ? <Bell size={15} /> : <BellOff size={15} />}
                        </button>
                        <button onClick={() => deleteAlert(alert._id)}
                          className={`p-1.5 rounded-lg transition-colors text-red-400 ${isDark ? 'hover:bg-red-900/20' : 'hover:bg-red-50'}`}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Alert jobs */}
                    {alertJobs[alert._id] !== undefined && (
                      <div className={`border-t px-5 py-4 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                        {alertJobs[alert._id].length === 0 ? (
                          <p className={`text-sm ${muted}`}>No recent jobs found for this role.</p>
                        ) : (
                          <div className="space-y-2">
                            <p className={`text-xs font-semibold mb-3 ${muted}`}>{alertJobs[alert._id].length} recent jobs</p>
                            {alertJobs[alert._id].map((job, i) => (
                              <MiniJobCard key={i} job={job} isDark={isDark} muted={muted} heading={heading} />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Job Card ──────────────────────────────────────────────────────────────
function JobCard({ job, isDark, expanded, onToggle }) {
  const muted = isDark ? 'text-gray-400' : 'text-gray-500';
  const heading = isDark ? 'text-white' : 'text-gray-900';
  const card = isDark ? 'bg-[#0f1115] border border-gray-800 hover:border-gray-700' : 'bg-white border border-gray-200 hover:border-gray-300 shadow-sm';

  return (
    <div className={`rounded-xl transition-all ${card}`}>
      <div className="p-5 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className={`font-bold text-base ${heading}`}>{job.title || 'Untitled'}</h3>
              {job.is_remote && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-500 font-semibold">Remote</span>
              )}
              {job.job_type && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>{job.job_type}</span>
              )}
            </div>
            <div className={`flex items-center gap-3 text-sm flex-wrap ${muted}`}>
              {job.company && <span className="flex items-center gap-1"><Building2 size={13} />{job.company}</span>}
              {job.location && <span className="flex items-center gap-1"><MapPin size={13} />{job.location}</span>}
              {job.date_posted && <span className="flex items-center gap-1"><Clock size={13} />{job.date_posted}</span>}
              {job.site && <span className="flex items-center gap-1"><Globe size={13} />{job.site}</span>}
            </div>
            {(job.min_amount || job.max_amount) && (
              <p className="text-sm text-green-500 font-semibold mt-1">
                {job.currency} {job.min_amount && `${job.min_amount.toLocaleString()}`}{job.max_amount && ` – ${job.max_amount.toLocaleString()}`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {job.job_url && (
              <a href={job.job_url} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-all">
                Apply <ExternalLink size={11} />
              </a>
            )}
            <ChevronDown size={16} className={`${muted} transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && job.description && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`border-t px-5 py-4 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}
          >
            <p className={`text-sm leading-relaxed ${muted}`}>{job.description}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Mini Job Card (for alerts) ────────────────────────────────────────────
function MiniJobCard({ job, isDark, muted, heading }) {
  return (
    <div className={`flex items-center justify-between gap-3 p-3 rounded-lg ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold truncate ${heading}`}>{job.title}</p>
        <p className={`text-xs truncate ${muted}`}>{job.company} · {job.location}</p>
      </div>
      {job.job_url && (
        <a href={job.job_url} target="_blank" rel="noopener noreferrer"
          className="shrink-0 p-1.5 rounded-lg text-blue-400 hover:text-blue-300 transition-colors">
          <ExternalLink size={14} />
        </a>
      )}
    </div>
  );
}
