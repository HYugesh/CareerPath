import { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Link as LinkIcon,
    Plus,
    ExternalLink,
    Trash2,
    Loader2,
    Globe,
    PlusCircle,
    X
} from 'lucide-react';

export default function PortfolioLinks() {
    const [portfolios, setPortfolios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        fetchPortfolios();
    }, []);

    const fetchPortfolios = async () => {
        try {
            const response = await axios.get('/portfolio');
            setPortfolios(response.data);
        } catch (err) {
            console.error('Error fetching portfolios:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newTitle || !newUrl) return;

        setAdding(true);
        try {
            const response = await axios.post('/portfolio', {
                title: newTitle,
                url: newUrl.startsWith('http') ? newUrl : `https://${newUrl}`
            });
            setPortfolios(response.data);
            setNewTitle('');
            setNewUrl('');
            setShowForm(false);
        } catch (err) {
            console.error('Error adding portfolio:', err);
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            const response = await axios.delete(`/portfolio/${id}`);
            setPortfolios(response.data);
        } catch (err) {
            console.error('Error deleting portfolio:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="bg-gray-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                        <Globe className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Digital Portfolios</h3>
                        <p className="text-sm text-gray-400">Manage your project links</p>
                    </div>
                </div>

                <button
                    onClick={() => setShowForm(!showForm)}
                    className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all"
                >
                    {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </button>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleAdd}
                        className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4"
                    >
                        <div>
                            <input
                                type="text"
                                placeholder="Project Title (e.g. GitHub Profile, Behance)"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500/50 transition-all outline-none"
                                required
                            />
                        </div>
                        <div>
                            <input
                                type="text"
                                placeholder="URL (e.g. github.com/username)"
                                value={newUrl}
                                onChange={(e) => setNewUrl(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500/50 transition-all outline-none"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={adding}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                        >
                            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                            Add Link
                        </button>
                    </motion.form>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 gap-3">
                {portfolios.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-gray-500 bg-white/5 rounded-2xl border border-dashed border-white/10">
                        <LinkIcon className="w-8 h-8 mx-auto mb-3 opacity-20" />
                        <p className="text-xs">No links added yet.</p>
                    </div>
                ) : (
                    portfolios.map((item) => (
                        <motion.div
                            key={item._id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="group bg-white/5 border border-white/5 rounded-2xl p-4 hover:border-blue-500/30 transition-all flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 group-hover:scale-110 transition-transform">
                                    <LinkIcon className="w-4 h-4" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-white font-bold text-sm truncate">{item.title}</p>
                                    <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] text-gray-500 hover:text-blue-400 transition-colors truncate block"
                                    >
                                        {item.url.replace(/^https?:\/\//, '')}
                                    </a>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-gray-500 hover:text-white transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                                <button
                                    onClick={() => handleDelete(item._id)}
                                    className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
