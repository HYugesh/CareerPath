// In src/pages/Assessment.jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axiosConfig';
import { motion } from 'framer-motion';

// Domain images mapping with high-quality images and backgrounds
const domainImages = {
    "Web Development": {
        icon: "https://cdn-icons-png.flaticon.com/512/1055/1055687.png",
        bg: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=250&fit=crop&crop=center",
        gradient: "from-blue-500 to-cyan-500",
        lightGradient: "from-blue-50 to-cyan-50",
        borderColor: "border-blue-200",
        hoverBorder: "hover:border-blue-400"
    },
    "Data Science": {
        icon: "https://cdn-icons-png.flaticon.com/512/2103/2103633.png",
        bg: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop&crop=center",
        gradient: "from-green-500 to-emerald-500",
        lightGradient: "from-green-50 to-emerald-50",
        borderColor: "border-green-200",
        hoverBorder: "hover:border-green-400"
    },
    "Machine Learning": {
        icon: "https://cdn-icons-png.flaticon.com/512/8637/8637108.png",
        bg: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=250&fit=crop&crop=center",
        gradient: "from-cyan-500 to-emerald-500",
        lightGradient: "from-cyan-50 to-emerald-50",
        borderColor: "border-cyan-200",
        hoverBorder: "hover:border-cyan-400"
    },
    "Artificial Intelligence": {
        icon: "https://cdn-icons-png.flaticon.com/512/8637/8637854.png",
        bg: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&h=250&fit=crop&crop=center",
        gradient: "from-blue-500 to-cyan-500",
        lightGradient: "from-blue-50 to-cyan-50",
        borderColor: "border-blue-200",
        hoverBorder: "hover:border-blue-400"
    },
    "Cloud Computing": {
        icon: "https://cdn-icons-png.flaticon.com/512/4336/4336029.png",
        bg: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&h=250&fit=crop&crop=center",
        gradient: "from-sky-500 to-blue-500",
        lightGradient: "from-sky-50 to-blue-50",
        borderColor: "border-sky-200",
        hoverBorder: "hover:border-sky-400"
    },
    "Cybersecurity": {
        icon: "https://cdn-icons-png.flaticon.com/512/2092/2092757.png",
        bg: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=250&fit=crop&crop=center",
        gradient: "from-red-500 to-orange-500",
        lightGradient: "from-red-50 to-orange-50",
        borderColor: "border-red-200",
        hoverBorder: "hover:border-red-400"
    },
    "Mobile Development": {
        icon: "https://cdn-icons-png.flaticon.com/512/2232/2232241.png",
        bg: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop&crop=center",
        gradient: "from-emerald-500 to-teal-500",
        lightGradient: "from-emerald-50 to-teal-50",
        borderColor: "border-emerald-200",
        hoverBorder: "hover:border-emerald-400"
    },
    "DevOps": {
        icon: "https://cdn-icons-png.flaticon.com/512/6295/6295417.png",
        bg: "https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=400&h=250&fit=crop&crop=center",
        gradient: "from-orange-500 to-yellow-500",
        lightGradient: "from-orange-50 to-yellow-50",
        borderColor: "border-orange-200",
        hoverBorder: "hover:border-orange-400"
    },
    "Blockchain": {
        icon: "https://cdn-icons-png.flaticon.com/512/2091/2091665.png",
        bg: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=250&fit=crop&crop=center",
        gradient: "from-yellow-500 to-amber-500",
        lightGradient: "from-yellow-50 to-amber-50",
        borderColor: "border-yellow-200",
        hoverBorder: "hover:border-yellow-400"
    },
    "Game Development": {
        icon: "https://cdn-icons-png.flaticon.com/512/2780/2780137.png",
        bg: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=250&fit=crop&crop=center",
        gradient: "from-cyan-500 to-blue-600",
        lightGradient: "from-cyan-50 to-blue-50",
        borderColor: "border-cyan-200",
        hoverBorder: "hover:border-blue-400"
    }
};

// Get domain data with fallback
const getDomainData = (domainName) => {
    return domainImages[domainName] || {
        icon: "https://cdn-icons-png.flaticon.com/512/1087/1087927.png",
        bg: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=250&fit=crop&crop=center",
        gradient: "from-gray-500 to-slate-500",
        lightGradient: "from-gray-50 to-slate-50",
        borderColor: "border-gray-200",
        hoverBorder: "hover:border-gray-400"
    };
};



export default function Assessment() {
    const { user } = useAuth();
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
                // Fallback to default domains if API fails
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
        if (!user) {
            navigate('/login');
            return;
        }

        if (!customTopic.trim()) {
            alert('Please enter a topic');
            return;
        }

        // Navigate to difficulty selection page with custom topic
        navigate(`/assessment/${encodeURIComponent(customTopic.trim())}`);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen text-white"
            style={{ background: 'linear-gradient(to right, #000001, #000000)' }}
        >
            {/* Hero Section */}
            <div className="relative pt-24 pb-8">
                <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
                <div className="max-w-6xl mx-auto px-6 relative">
                    <div className="text-center mb-16" data-aos="fade-up">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center px-4 py-2 rounded-full bg-gray-800 border border-gray-700 text-blue-400 font-semibold mb-6 shadow-lg"
                        >
                            <span className="text-2xl mr-2">🧠</span>
                            AI-Powered Assessment
                        </motion.div>
                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-4xl md:text-5xl font-bold mb-6 text-white"
                        >
                            Test Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Technical Skills</span>
                        </motion.h1>
                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed"
                        >
                            Choose your domain and take our AI-powered assessment to discover your strengths, identify areas for improvement, and get personalized learning recommendations.
                        </motion.p>
                    </div>

                    {/* Assessment Features */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { icon: '⚡', title: 'Instant Results', desc: 'Get immediate feedback and detailed analysis of your performance', gradient: 'from-blue-500 to-cyan-500', bgColor: 'bg-gray-900', borderColor: 'border-gray-800' },
                            { icon: '🎯', title: 'Personalized Questions', desc: 'AI-generated questions tailored to your skill level and domain', gradient: 'from-cyan-500 to-emerald-500', bgColor: 'bg-gray-900', borderColor: 'border-gray-800' },
                            { icon: '📊', title: 'Detailed Analytics', desc: 'Comprehensive breakdown of your strengths and improvement areas', gradient: 'from-emerald-500 to-green-500', bgColor: 'bg-gray-900', borderColor: 'border-gray-800' }
                        ].map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 + (index * 0.1) }}
                                whileHover={{ y: -5, scale: 1.02 }}
                                className={`${feature.bgColor} rounded-2xl p-6 border ${feature.borderColor} text-center shadow-lg hover:shadow-xl transition-shadow`}
                                data-aos="fade-up"
                                data-aos-delay={index * 100}
                            >
                                <motion.div
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}
                                >
                                    <span className="text-2xl">{feature.icon}</span>
                                </motion.div>
                                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                                <p className="text-gray-400 text-sm">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Domain Selection */}
            <div className="max-w-6xl mx-auto px-6 pb-20">
                {/* Custom Quiz Section */}
                <div className="mb-12">
                    <div className="bg-[#0f1115] rounded-2xl p-8 border border-gray-800 hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden group">
                        {/* Subtle Background Glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                                    <span className="p-2 bg-blue-500/10 rounded-lg text-blue-400">🎨</span>
                                    Create Custom Quiz
                                </h3>
                                <p className="text-gray-400">Generate a quiz on any topic you want to test</p>
                            </div>
                            <button
                                onClick={() => setShowCustomQuiz(!showCustomQuiz)}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg shadow-blue-900/20"
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
                                className="space-y-6 mt-6 pt-6 border-t border-gray-800"
                            >
                                {/* Topic Input Only */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                                        Quiz Topic *
                                    </label>
                                    <input
                                        type="text"
                                        value={customTopic}
                                        onChange={(e) => setCustomTopic(e.target.value)}
                                        placeholder="e.g., React Hooks, Python Decorators, SQL Joins"
                                        className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        required
                                    />
                                </div>

                                {/* Next Button */}
                                <button
                                    type="submit"
                                    disabled={!customTopic.trim()}
                                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all transform hover:scale-[1.02] shadow-lg shadow-blue-900/20 text-lg flex items-center justify-center gap-2"
                                >
                                    <span>Next: Select Difficulty</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </button>
                            </motion.form>
                        )}
                    </div>
                </div>

                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-white mb-4">Or Choose a Domain</h2>
                    <p className="text-gray-400 text-lg">Select from our curated technology domains</p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {domains.map((domain, index) => {
                            const domainData = getDomainData(domain.name);

                            const handleDomainClick = (e) => {
                                if (!user) {
                                    e.preventDefault();
                                    navigate('/login');
                                }
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
                                        <div className={`relative overflow-hidden rounded-2xl bg-gray-900 border border-gray-800 hover:border-blue-500/50 transition-all duration-300 shadow-lg hover:shadow-blue-500/20`}>
                                            {/* Background Image */}
                                            <div className="relative h-48 overflow-hidden">
                                                <img
                                                    src={domainData.bg}
                                                    alt={domain.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-60"
                                                />
                                                <div className={`absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-90`}></div>

                                                {/* Icon */}
                                                <motion.div
                                                    whileHover={{ scale: 1.2, rotate: 10 }}
                                                    className="absolute top-4 right-4 w-16 h-16 bg-gray-800/80 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-gray-700"
                                                >
                                                    <img
                                                        src={domainData.icon}
                                                        alt={domain.name}
                                                        className="w-10 h-10 object-contain p-1"
                                                    />
                                                </motion.div>

                                                {/* Assessment Badge */}
                                                <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm font-medium border border-gray-700 shadow-sm">
                                                    15 Questions
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-6 bg-gray-900">
                                                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                                                    {domain.name}
                                                </h3>
                                                <p className="text-gray-400 mb-4 leading-relaxed">
                                                    {domain.description}
                                                </p>

                                                {/* Assessment Info */}
                                                <div className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center text-gray-500">
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        15-20 min
                                                    </div>
                                                    <div className="flex items-center text-blue-400 group-hover:text-blue-300 font-semibold">
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

                {/* Bottom CTA */}
                {/* <div className="text-center mt-16">
                    <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 max-w-2xl mx-auto shadow-sm">
                        <h3 className="text-2xl font-bold text-white mb-4">Not Sure Which Domain?</h3>
                        <p className="text-gray-400 mb-6">
                            Take our quick skill matcher to find the perfect assessment for your current level and career goals.
                        </p>
                        <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg">
                            🎯 Find My Domain
                        </button>
                    </div>
                </div> */}
            </div>
        </motion.div>
    );
}