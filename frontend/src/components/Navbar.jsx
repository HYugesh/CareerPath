import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileRef = useRef(null);

  // Track scroll for navbar background change
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    handleFullscreenChange();

    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    navigate('/');
  };

  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getUserAvatarColor = (name) => {
    if (!name) return 'bg-gray-500';
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-cyan-500', 'bg-emerald-500', 'bg-blue-500', 'bg-teal-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const isImmersiveRoute =
    location.pathname.includes('/quiz/') ||
    location.pathname === '/interview' ||
    location.pathname === '/interview-room' ||
    location.pathname === '/coding/compiler' ||
    (location.pathname.includes('/coding') && location.pathname !== '/coding' && location.pathname !== '/coding/arena' && location.pathname !== '/coding/compiler');

  if (isFullscreen || isImmersiveRoute) {
    return null;
  }

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/roadmap', label: 'Roadmap' },
    { to: '/assessment', label: 'Quiz' },
    { to: '/interview-landing', label: 'Interview' },
    { to: '/coding', label: 'CodeArena' },
    { to: '/jobs', label: 'Jobs' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
          ? isDark
            ? 'bg-black/80 backdrop-blur-xl shadow-2xl shadow-black/50 border-b border-gray-800/50'
            : 'bg-white/95 backdrop-blur-xl shadow-md shadow-black/10 border-b border-gray-200'
          : 'bg-transparent'
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-16">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow duration-300">
                  <span className="text-white font-bold text-sm">CP</span>
                </div>
                <span className={`text-xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${isDark ? 'from-blue-400 to-cyan-400' : 'from-blue-600 to-cyan-600'}`}>
                  CareerPath
                </span>
              </Link>
            </motion.div>

            {/* Desktop Navigation - Pill Container */}
            <div className="hidden lg:flex items-center">
              <div className={`flex items-center gap-1 px-2 py-1.5 rounded-full transition-all duration-500 ${
                scrolled
                  ? isDark ? 'bg-gray-900/60 border border-gray-700/50' : 'bg-gray-100/80 border border-gray-200'
                  : isDark ? 'bg-white/5 border border-white/10' : 'bg-black/5 border border-black/10'
                }`}>
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${isActive(link.to)
                      ? 'text-white bg-gradient-to-r from-blue-600/80 to-cyan-600/80 shadow-lg shadow-blue-500/20'
                      : isDark
                        ? 'text-gray-400 hover:text-white hover:bg-white/10'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-black/8'
                      }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Side - Auth + Mobile Menu */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle — always first on right */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                className="p-2 rounded-xl hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-black/10 transition-colors duration-300"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? (
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </motion.button>

              {user ? (
                <div className="relative" ref={profileRef}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-full hover:bg-white/10 transition-all duration-300 group"
                  >
                    <div className={`w-9 h-9 rounded-full ${getUserAvatarColor(user.name)} flex items-center justify-center text-white font-semibold text-sm ring-2 ring-transparent group-hover:ring-blue-400/50 transition-all duration-300`}>
                      {getUserInitials(user.name)}
                    </div>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform duration-300 hidden sm:block ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </motion.button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className={`absolute right-0 mt-3 w-72 backdrop-blur-xl border rounded-2xl shadow-2xl overflow-hidden ${isDark ? 'bg-gray-900/95 border-gray-700/50 shadow-black/50' : 'bg-white border-gray-200 shadow-black/15'}`}
                      >
                        <div className="p-5 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-b border-gray-700/50">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-full ${getUserAvatarColor(user.name)} flex items-center justify-center text-white font-bold ring-2 ring-white/20`}>
                              {getUserInitials(user.name)}
                            </div>
                            <div>
                              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.name}</p>
                              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
                            </div>
                          </div>
                        </div>

                        <div className="py-2 px-2">
                          <Link
                            to="/dashboard"
                            onClick={() => setIsProfileOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 rounded-xl ${isDark ? 'text-gray-300 hover:bg-white/5 hover:text-white' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
                          >
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7z" />
                            </svg>
                            <span className="text-sm font-medium">Dashboard</span>
                          </Link>

                          <Link
                            to="/profile"
                            onClick={() => setIsProfileOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 rounded-xl ${isDark ? 'text-gray-300 hover:bg-white/5 hover:text-white' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
                          >
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-sm font-medium">Profile Settings</span>
                          </Link>

                          <div className={`border-t my-2 mx-4 ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}></div>

                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 w-full text-left rounded-xl"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="text-sm font-medium">Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden lg:flex items-center gap-3">
                  <Link
                    to="/login"
                    className={`text-sm font-medium transition-colors duration-300 px-4 py-2 ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    Sign In
                  </Link>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Link
                      to="/login"
                      className="text-sm px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 inline-block"
                    >
                      Get Started
                    </Link>
                  </motion.div>
                </div>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`lg:hidden p-2 rounded-xl transition-colors duration-300 ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/8'}`}
              >
                <div className="w-6 h-6 flex flex-col justify-center items-center gap-1.5">
                  <motion.span
                    animate={mobileMenuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                    className={`block w-5 h-0.5 rounded-full origin-center transition-all ${isDark ? 'bg-white' : 'bg-gray-800'}`}
                  />
                  <motion.span
                    animate={mobileMenuOpen ? { opacity: 0, x: 20 } : { opacity: 1, x: 0 }}
                    className={`block w-5 h-0.5 rounded-full transition-all ${isDark ? 'bg-white' : 'bg-gray-800'}`}
                  />
                  <motion.span
                    animate={mobileMenuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                    className={`block w-5 h-0.5 rounded-full origin-center transition-all ${isDark ? 'bg-white' : 'bg-gray-800'}`}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className={`absolute right-0 top-0 bottom-0 w-80 backdrop-blur-xl border-l shadow-2xl ${isDark ? 'bg-gray-950/95 border-gray-800/50' : 'bg-white border-gray-200'}`}
            >
              <div className="p-6 pt-20">
                <div className="flex flex-col gap-2">
                  {navLinks.map((link, i) => (
                    <motion.div
                      key={link.to}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                    >
                      <Link
                        to={link.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`block px-5 py-3.5 rounded-xl text-base font-medium transition-all duration-300 ${isActive(link.to)
                          ? 'text-white bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30'
                          : isDark
                            ? 'text-gray-400 hover:text-white hover:bg-white/5'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {!user && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-8 flex flex-col gap-3"
                  >
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-center px-5 py-3 rounded-xl border border-gray-700 text-gray-300 font-medium hover:bg-white/5 transition-all duration-300"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-center px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold shadow-lg shadow-blue-600/25 transition-all duration-300"
                    >
                      Get Started
                    </Link>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}