import { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload,
    FileText,
    CheckCircle2,
    AlertCircle,
    Loader2,
    TrendingUp,
    Brain,
    Lightbulb,
    Target,
    ArrowRight,
    RefreshCcw,
    History,
    Eye,
    Trash2
} from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

export default function ResumeAnalysis() {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [status, setStatus] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const response = await axios.get('/resume/status');
            setStatus(response.data);
        } catch (err) {
            console.error('Error fetching resume status:', err);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setError(null);
        } else {
            setError('Please upload a PDF file');
            setFile(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('resume', file);

        try {
            await axios.post('/resume/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFile(null);
            await fetchStatus();
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyze = async () => {
        setAnalyzing(true);
        setError(null);
        try {
            const response = await axios.post('/resume/analyze-existing');
            setStatus(prev => ({
                ...prev,
                score: response.data.score,
                analysis: response.data,
                lastAnalyzedAt: new Date()
            }));
        } catch (err) {
            setError(err.response?.data?.message || 'Analysis failed');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleViewResume = () => {
        axios.get('/resume/view', { responseType: 'blob' })
            .then(response => {
                const fileURL = URL.createObjectURL(response.data);
                window.open(fileURL, '_blank');
            })
            .catch(err => {
                console.error('Error viewing resume:', err);
                setError('Failed to open resume file');
            });
    };

    const handleDeleteResume = async () => {
        if (window.confirm("Are you sure you want to delete your resume?")) {
            try {
                await axios.delete('/resume/delete');
                setStatus({ exists: false });
                setFile(null);
                setError(null);
            } catch (err) {
                console.error('Delete error:', err);
                setError('Failed to delete resume');
            }
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Step 1: Manage Resume Section */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="bg-gray-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden h-full flex flex-col"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                        <Upload className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">1. Manage Resume</h3>
                        <p className="text-sm text-gray-400">Upload or update your career document</p>
                    </div>
                </div>

                {status?.exists ? (
                    <div className="flex-grow flex flex-col">
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-6 mb-6 group relative overflow-hidden">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-blue-500/10 rounded-xl">
                                    <FileText className="w-8 h-8 text-blue-400" />
                                </div>
                                <div className="flex-grow min-w-0 pr-24">
                                    <p className="text-white font-bold truncate">{status.fileName}</p>
                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                        <History className="w-3 h-3" />
                                        Uploaded on {new Date(status.lastUploadedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="absolute top-6 right-6 flex gap-2">
                                <button
                                    onClick={handleViewResume}
                                    className="p-2.5 bg-white/5 hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 rounded-xl transition-all border border-white/5 hover:border-blue-500/30"
                                    title="Open Resume"
                                >
                                    <Eye className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleDeleteResume}
                                    className="p-2.5 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-xl transition-all border border-white/5 hover:border-red-500/30"
                                    title="Delete Resume"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="mt-auto space-y-4">
                            <p className="text-xs text-gray-500 text-center">Want to update? Choose a new file below</p>
                            <div className="flex items-center gap-4">
                                <input type="file" onChange={handleFileChange} accept=".pdf" className="hidden" id="update-upload" />
                                <label
                                    htmlFor="update-upload"
                                    className="flex-grow h-12 flex items-center justify-center border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-colors text-sm text-white font-medium"
                                >
                                    {file ? file.name : 'Select New PDF'}
                                </label>
                                {file && (
                                    <button
                                        onClick={handleUpload}
                                        disabled={loading}
                                        className="h-12 px-6 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all flex items-center gap-2"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                                        Update
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-grow flex flex-col justify-center">
                        <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center hover:border-blue-500/30 transition-all group cursor-pointer relative overflow-hidden">
                            <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-colors" />
                            <input type="file" onChange={handleFileChange} accept=".pdf" className="hidden" id="initial-upload" />
                            <label htmlFor="initial-upload" className="cursor-pointer relative z-10">
                                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                    <Upload className="w-8 h-8 text-blue-400" />
                                </div>
                                <p className="text-white font-bold mb-1">{file ? file.name : 'Choose File'}</p>
                                <p className="text-xs text-gray-500">Only PDF files, max 5MB</p>
                            </label>
                        </div>
                        {file && (
                            <button
                                onClick={handleUpload}
                                disabled={loading}
                                className="w-full mt-6 py-4 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2 shadow-xl shadow-white/5"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Upload'}
                            </button>
                        )}
                    </div>
                )}

                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2"
                    >
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </motion.div>
                )}
            </motion.div>

            {/* Step 2: Analysis Section */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.1 }}
                className="bg-gray-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden flex flex-col"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                        <Brain className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">2. ATS Intelligence</h3>
                        <p className="text-sm text-gray-400">AI-powered technical evaluation</p>
                    </div>
                </div>

                {!status?.exists ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-center p-8 bg-black/20 rounded-2xl border border-white/5">
                        <AlertCircle className="w-12 h-12 text-gray-700 mb-4" />
                        <h4 className="text-gray-500 font-bold">Resume Required</h4>
                        <p className="text-xs text-gray-600 mt-2 max-w-[200px]">Please upload your resume in Step 1 to unlock AI analysis</p>
                    </div>
                ) : !status.analysis ? (
                    <div className="flex-grow flex flex-col items-center justify-center">
                        <div className="w-24 h-24 mb-6 opacity-20">
                            <CircularProgressbar value={0} text="?" styles={buildStyles({ textColor: '#fff', pathColor: '#10B981', trailColor: 'rgba(255,255,255,0.05)' })} />
                        </div>
                        <button
                            onClick={handleAnalyze}
                            disabled={analyzing}
                            className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-3"
                        >
                            {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
                            {analyzing ? 'Analyzing Content...' : 'Verify ATS Compatibility'}
                        </button>
                    </div>
                ) : (
                    <div className="flex-grow space-y-6">
                        <div className="flex items-center gap-6 p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="w-20 h-20 flex-shrink-0">
                                <CircularProgressbar
                                    value={status.score}
                                    text={`${status.score}`}
                                    styles={buildStyles({
                                        pathColor: status.score > 80 ? '#10B981' : status.score > 60 ? '#F59E0B' : '#EF4444',
                                        textColor: '#fff',
                                        trailColor: 'rgba(255,255,255,0.05)',
                                        textSize: '28px',
                                    })}
                                />
                            </div>
                            <div>
                                <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mb-1">Current Score</p>
                                <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">{status.analysis.summary}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                                <p className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-2">
                                    <CheckCircle2 className="w-3 h-3" /> Strengths
                                </p>
                                <div className="space-y-1">
                                    {status.analysis.strengths.slice(0, 2).map((s, i) => (
                                        <p key={i} className="text-[10px] text-gray-400 truncate tracking-tight">• {s}</p>
                                    ))}
                                </div>
                            </div>
                            <div className="p-4 bg-yellow-500/5 rounded-xl border border-yellow-500/10">
                                <p className="text-xs font-bold text-yellow-400 mb-2 flex items-center gap-2">
                                    <TrendingUp className="w-3 h-3" /> Growth
                                </p>
                                <div className="space-y-1">
                                    {status.analysis.improvements.slice(0, 2).map((s, i) => (
                                        <p key={i} className="text-[10px] text-gray-400 truncate tracking-tight">• {s}</p>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleAnalyze}
                            disabled={analyzing}
                            className="w-full py-3 text-xs font-bold text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/10 transition-all flex items-center justify-center gap-2"
                        >
                            {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
                            Refresh AI Analysis
                        </button>
                    </div>
                )}
            </motion.div>

            {/* Full Analysis Results */}
            <AnimatePresence>
                {status?.analysis && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-2 mt-8 space-y-8"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h5 className="flex items-center gap-2 text-blue-400 font-bold text-sm uppercase tracking-wider">
                                    <Target className="w-4 h-4" /> Crucial Keywords Missing
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                    {status.analysis.missingKeywords.map((kw, i) => (
                                        <span key={i} className="px-3 py-1 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-full text-[10px] font-medium">
                                            {kw}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h5 className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wider">
                                    <Lightbulb className="w-4 h-4 text-yellow-400" /> Strategic Suggestions
                                </h5>
                                <div className="grid gap-3">
                                    {status.analysis.suggestions.map((s, i) => (
                                        <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                                            <span className="w-5 h-5 flex-shrink-0 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                                            <p className="text-[11px] text-gray-400 leading-tight">{s}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
