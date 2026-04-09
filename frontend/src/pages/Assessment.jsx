// In src/pages/Assessment.jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from '../api/axiosConfig';
import { motion } from 'framer-motion';

// Domain images mapping with high-quality images and backgrounds
const domainImages = {
    "Web Development": {
        icon: "https://cdn-icons-png.flaticon.com/512/1055/1055687.png",
        bg: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=250&fit=crop&crop=center",
        gradient: "from-blue-500 to-cyan-500",
        accentColor: "#3b82f6",
    },
    "Data Science": {
        icon: "https://cdn-icons-png.flaticon.com/512/2103/2103633.png",
        bg: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop&crop=center",
        gradient: "from-green-500 to-emerald-500",
        accentColor: "#10b981",
    },
    "Machine Learning": {
        icon: "https://cdn-icons-png.flaticon.com/512/8637/8637108.png",
        bg: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=250&fit=crop&crop=center",
        gradient: "from-cyan-500 to-emerald-500",
        accentColor: "#06b6d4",
    },
    "Artificial Intelligence": {
        icon: "https://cdn-icons-png.flaticon.com/512/8637/8637854.png",
        bg: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&h=250&fit=crop&crop=center",
        gradient: "from-blue-500 to-cyan-500",
        accentColor: "#3b82f6",
    },
    "Cloud Computing": {
        icon: "https://cdn-icons-png.flaticon.com/512/4336/4336029.png",
        bg: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&h=250&fit=crop&crop=center",
        gradient: "from-sky-500 to-blue-500",
        accentColor: "#0ea5e9",
    },
    "Cybersecurity": {
        icon: "https://cdn-icons-png.flaticon.com/512/2092/2092757.png",
        bg: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=250&fit=crop&crop=center",
        gradient: "from-red-500 to-orange-500",
        accentColor: "#ef4444",
    },
    "Mobile Development": {
        icon: "https://cdn-icons-png.flaticon.com/512/2232/2232241.png",
        bg: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop&crop=center",
        gradient: "from-emerald-500 to-teal-500",
        accentColor: "#10b981",
    },
    "DevOps": {
        icon: "https://cdn-icons-png.flaticon.com/512/6295/6295417.png",
        bg: "https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=400&h=250&fit=crop&crop=center",
        gradient: "from-orange-500 to-yellow-500",
        accentColor: "#f97316",
    },
    "Blockchain": {
        icon: "https://cdn-icons-png.flaticon.com/512/2091/2091665.png",
        bg: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=250&fit=crop&crop=center",
        gradient: "from-yellow-500 to-amber-500",
        accentColor: "#eab308",
    },
    "Game Development": {
        icon: "https://cdn-icons-png.flaticon.com/512/2780/2780137.png",
        bg: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=250&fit=crop&crop=center",
        gradient: "from-cyan-500 to-blue-600",
        accentColor: "#06b6d4",
    }
};

const getDomainData = (domainName) => {
    return domainImages[domainName] || {
        icon: "https://cdn-icons-png.flaticon.com/512/1087/1087927.png",
        bg: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=250&fit=crop&crop=center",
        gradient: "from-gray-500 to-slate-500",
        accentColor: "#6b7280",
    };
};

export default function Assessment() {
    const { user } = useAuth();
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const [domains, setDomains] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCustomQuiz, setShowCustomQuiz] = useState(false);
    const [customTopic, setCustomTopic] = useState('');

    useEffect(() => {
        const fetchDomains = async () => {
            try {
                const res = await axios.get('/domains');
                setDomains(res.data);
            } catch (error) {
                console.error("Failed to fetch domains:", error);
                setDomains([
                    { _id: '1', name: 'Web Development', description: 'Master modern web technologies including HTML, CSS, JavaScript, React, and Node.js' },
                    { _id: '2', name: 'Data Science', description: 'Learn data analysis, visualization, statistics, and machine learning fundamentals' },
                    { _id: '3', name: 'Machine Learning', description: 'Explore ML algorithms, neural networks, and deep learning techniques' },
                    { _id: '4', name: 'Artificial Intelligence', description: 'Understand AI concepts, natural language processing, and computer vision' },
                    { _id: '5', name: 'Cloud Computing', description: 'Master cloud platforms like AWS, Azure, and Google Cloud' },
                    { _id: '6', name: 'Cybersecurity', description: 'Learn security principles, ethical hacking, and network protection' },
                    { _id: '7', name: 'Mobile Development', description: 'Build native and cross-platform mobile applications' },
                    { _id: '8', name: 'DevOps', description: 'Master CI/CD, containerization, and infrastructure automation' },
                    { _id: '9', name: 'Blockchain', description: 'Understand blockchain technology and smart contract development' },
                    { _id: '10', name: 'Game Development', description: 'Create games using Unity, Unreal Engine, and game design principles' }
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchDomains();
    }, []);

    const handleCustomQuizSubmit = (e) => {
        e.preventDefault();
        if (!user) { navigate('/login'); return; }
        if (!customTopic.trim()) { alert('Please enter a topic'); return; }
        navigate(`/assessment/${encodeURIComponent(customTopic.trim())}`);
    };

    // Theme-aware class helpers
    const pageBg = isDark
        ? 'min-h-screen text-white'
        : 'min-h-screen assessment-light-page';

    const pageStyle = isDark
        ? { background: 'linear-gradient(to right, #000001, #000000)' }
        : {};

    const badgeCls = isDark
        ? 'inline-flex items-center px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-gray-800 border border-gray-700 text-blue-400 font-semibold mb-4 md:mb-6 shadow-lg text-sm md:text-base'
        : 'inline-flex items-center px-3 md:px-4 py-1.5 md:py-2 rounded-full assessment-badge font-semibold mb-4 md:mb-6 shadow-lg text-sm md:text-base';

    const headingCls = isDark
        ? 'text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-white px-4'
        : 'text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 assessment-heading px-4';

    const subTextCls = isDark
        ? 'text-base md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed px-4'
        : 'text-base md:text-xl assessment-subtext max-w-3xl mx-auto leading-relaxed px-4';

    const featureCardCls = isDark
        ? 'bg-gray-900 rounded-2xl p-6 border border-gray-800 text-center shadow-lg hover:shadow-xl transition-shadow'
        : 'assessment-feature-card rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300';

    const featureTitleCls = isDark ? 'text-lg font-bold text-white mb-2' : 'text-lg font-bold assessment-feature-title mb-2';
    const featureDescCls = isDark ? 'text-gray-400 text-sm' : 'assessment-feature-desc text-sm';

    const customQuizBoxCls = isDark
        ? 'bg-[#0f1115] rounded-xl md:rounded-2xl p-6 md:p-8 border border-gray-800 hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden group'
        : 'assessment-custom-box rounded-xl md:rounded-2xl p-6 md:p-8 transition-all duration-300 relative overflow-hidden group';

    const customQuizTitleCls = isDark
        ? 'text-xl md:text-2xl font-bold text-white mb-2 flex items-center gap-2 md:gap-3'
        : 'text-xl md:text-2xl font-bold assessment-custom-title mb-2 flex items-center gap-2 md:gap-3';

    const sectionTitleCls = isDark
        ? 'text-2xl md:text-3xl font-bold text-white mb-3 md:mb-4'
        : 'text-2xl md:text-3xl font-bold assessment-section-title mb-3 md:mb-4';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={pageBg}
            style={pageStyle}
        >
            {/* Hero Section */}
            <div className="relative pt-20 md:pt-24 pb-6 md:pb-8">
                <div className={`absolute inset-0 bg-grid-pattern ${isDark ? 'opacity-5' : 'opacity-[0.03]'}`}></div>
                <div className="max-w-6xl mx-auto px-4 md:px-6 relative">
                    <div className="text-center mb-12 md:mb-16" data-aos="fade-up">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className={badgeCls}
                        >
                            <span className="text-xl md:text-2xl mr-2">🧠</span>
                            AI-Powered Assessment
                        </motion.div>
                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className={headingCls}
                        >
                            Test Your{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">
                                Technical Skills
                            </span>
                        </motion.h1>
                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className={subTextCls}
                        >
                            Choose your domain and take our AI-powered assessment to discover your strengths, identify areas for improvement, and get personalized learning recommendations.
                        </motion.p>
                    </div>

                    {/* Assessment Features */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                        {[
                            { icon: '⚡', title: 'Instant Results', desc: 'Get immediate feedback and detailed analysis of your performance', gradient: 'from-blue-500 to-cyan-500' },
                            { icon: '🎯', title: 'Personalized Questions', desc: 'AI-generated questions tailored to your skill level and domain', gradient: 'from-cyan-500 to-emerald-500' },
                            { icon: '📊', title: 'Detailed Analytics', desc: 'Comprehensive breakdown of your strengths and improvement areas', gradient: 'from-emerald-500 to-green-500' }
                        ].map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 + (index * 0.1) }}
                                whileHover={{ y: -5, scale: 1.02 }}
                                className={featureCardCls}
                                data-aos="fade-up"
                                data-aos-delay={index * 100}
                            >
                                <motion.div
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}
                                >
                                    <span className="text-2xl">{feature.icon}</span>
                                </motion.div>
                                <h3 className={featureTitleCls}>{feature.title}</h3>
                                <p className={featureDescCls}>{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Domain Selection */}
            <div className="max-w-6xl mx-auto px-4 md:px-6 pb-16 md:pb-20">
                {/* Custom Quiz Section */}
                <div className="mb-8 md:mb-12">
                    <div className={customQuizBoxCls}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 md:mb-6 relative z-10 gap-4">
                            <div>
                                <h3 className={customQuizTitleCls}>
                                    <span className="p-1.5 md:p-2 bg-blue-500/10 rounded-lg text-blue-400 text-lg md:text-base">🎨</span>
                                    Create Custom Quiz
                                </h3>
                                <p className={isDark ? 'text-sm md:text-base text-gray-400' : 'text-sm md:text-base assessment-subtext'}>
                                    Generate a quiz on any topic you want to test
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCustomQuiz(!showCustomQuiz)}
                                className="w-full md:w-auto px-5 md:px-6 py-2.5 md:py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg shadow-blue-900/20 text-sm md:text-base"
                            >
                                {showCustomQuiz ? 'Hide' : 'Create Custom Quiz'}
                            </button>
                        </div>

                        {showCustomQuiz && (
                            <motion.form
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                onSubmit={handleCustomQuizSubmit}
                                className={`space-y-6 mt-6 pt-6 border-t ${isDark ? 'border-gray-800' : 'border-blue-100'}`}
                            >
                                <div>
                                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'assessment-label'}`}>
                                        Quiz Topic *
                                    </label>
                                    <input
                                        type="text"
                                        value={customTopic}
                                        onChange={(e) => setCustomTopic(e.target.value)}
                                        placeholder="e.g., React Hooks, Python Decorators, SQL Joins"
                                        className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                            isDark
                                                ? 'bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500'
                                                : 'assessment-input'
                                        }`}
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!customTopic.trim()}
                                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all transform hover:scale-[1.02] shadow-lg shadow-blue-900/20 text-lg flex items-center justify-center gap-2"
                                >
                                    <span>Next: Select Difficulty</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </button>
                            </motion.form>
                        )}
                    </div>
                </div>

                <div className="text-center mb-8 md:mb-12">
                    <h2 className={sectionTitleCls}>Or Choose a Domain</h2>
                    <p className={isDark ? 'text-base md:text-lg text-gray-400' : 'text-base md:text-lg assessment-subtext'}>
                        Select from our curated technology domains
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {domains.map((domain, index) => {
                            const domainData = getDomainData(domain.name);

                            const handleDomainClick = (e) => {
                                if (!user) { e.preventDefault(); navigate('/login'); }
                            };

                            return (
                                <motion.div
                                    key={domain._id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    whileHover={{ y: -10, scale: 1.02 }}
                                    data-aos="fade-up"
                                    data-aos-delay={index * 50}
                                >
                                    <Link
                                        to={user ? `/assessment/${domain.name}` : '#'}
                                        className="group block"
                                        onClick={handleDomainClick}
                                    >
                                        <div
                                            className={`relative overflow-hidden rounded-2xl transition-all duration-300 shadow-lg ${
                                                isDark
                                                    ? 'bg-gray-900 border border-gray-800 hover:border-blue-500/50 hover:shadow-blue-500/20'
                                                    : 'assessment-domain-card'
                                            }`}
                                            style={!isDark ? { '--accent': domainData.accentColor } : {}}
                                        >
                                            {/* Background Image */}
                                            <div className="relative h-48 overflow-hidden">
                                                <img
                                                    src={domainData.bg}
                                                    alt={domain.name}
                                                    className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${isDark ? 'opacity-60' : 'opacity-75'}`}
                                                />
                                                <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-gray-900' : 'from-white/95'} to-transparent opacity-90`}></div>

                                                {/* Accent color tint overlay in light mode */}
                                                {!isDark && (
                                                    <div
                                                        className="absolute inset-0 opacity-10"
                                                        style={{ background: `linear-gradient(to bottom, transparent, ${domainData.accentColor}40)` }}
                                                    ></div>
                                                )}

                                                {/* Icon */}
                                                <motion.div
                                                    whileHover={{ scale: 1.2, rotate: 10 }}
                                                    className={`absolute top-4 right-4 w-16 h-16 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg ${
                                                        isDark
                                                            ? 'bg-gray-800/80 border border-gray-700'
                                                            : 'assessment-domain-icon-box'
                                                    }`}
                                                    style={!isDark ? { borderColor: `${domainData.accentColor}40` } : {}}
                                                >
                                                    <img src={domainData.icon} alt={domain.name} className="w-10 h-10 object-contain p-1" />
                                                </motion.div>

                                                {/* Assessment Badge */}
                                                <div className={`absolute top-4 left-4 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium shadow-sm ${
                                                    isDark
                                                        ? 'bg-gray-900/90 text-white border border-gray-700'
                                                        : 'assessment-badge-sm'
                                                }`}>
                                                    15 Questions
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className={`p-6 ${isDark ? 'bg-gray-900' : 'assessment-domain-content'}`}>
                                                <h3
                                                    className={`text-xl font-bold mb-3 transition-colors ${isDark ? 'text-white group-hover:text-blue-400' : 'assessment-domain-title'}`}
                                                    style={!isDark ? { '--accent': domainData.accentColor } : {}}
                                                >
                                                    {domain.name}
                                                </h3>
                                                <p className={`mb-4 leading-relaxed ${isDark ? 'text-gray-400' : 'assessment-domain-desc'}`}>
                                                    {domain.description}
                                                </p>

                                                <div className="flex items-center justify-between text-sm">
                                                    <div className={`flex items-center ${isDark ? 'text-gray-500' : 'assessment-time-text'}`}>
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        15-20 min
                                                    </div>
                                                    <div className={`flex items-center font-semibold ${isDark ? 'text-blue-400 group-hover:text-blue-300' : 'assessment-start-link'}`}>
                                                        Start Assessment
                                                        <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
