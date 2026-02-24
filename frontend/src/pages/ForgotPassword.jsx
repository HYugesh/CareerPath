import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../api/axiosConfig";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

const InputField = ({ label, type, name, value, onChange, placeholder, icon: Icon, error }) => (
    <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300 ml-1">{label}</label>
        <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-400 transition-colors">
                <Icon size={20} />
            </div>
            <input
                type={type} name={name} value={value} onChange={onChange}
                className={`w-full pl-11 pr-4 py-3 bg-white/5 border ${error ? 'border-red-500/50' : 'border-white/10 group-hover:border-white/20'} rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all duration-300`}
                placeholder={placeholder}
                required
            />
        </div>
    </div>
);

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState("idle"); // idle, loading, success, error
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;

        setStatus("loading");
        try {
            const response = await axios.post("/auth/forgot-password", { email });
            setStatus("success");
            setMessage(response.data.message);

            // Auto redirect to reset password after 2 seconds
            setTimeout(() => {
                navigate("/reset-password", { state: { email } });
            }, 3000);
        } catch (err) {
            setStatus("error");
            setMessage(err.response?.data?.message || "Something went wrong. Please try again.");
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#0a0a0f]">
            {/* Background Orbs */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="w-full max-w-[420px] relative z-10">
                <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-50" />

                    {status === "success" ? (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-4">
                            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 size={32} className="text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-4">Check your email</h2>
                            <p className="text-gray-400 mb-8 leading-relaxed">
                                We've sent a password reset code to <span className="text-white font-medium">{email}</span>.
                            </p>
                            <div className="flex flex-col gap-3">
                                <button onClick={() => navigate("/reset-password", { state: { email } })} className="w-full h-12 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all">
                                    Enter Reset Code
                                </button>
                                <button onClick={() => setStatus("idle")} className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
                                    Didn't receive email? Try again
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <>
                            <div className="mb-8">
                                <Link to="/login" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm mb-6 w-fit">
                                    <ArrowLeft size={16} /> Back to Sign In
                                </Link>
                                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Forgot Password?</h1>
                                <p className="text-gray-400">No worries, we'll send you reset instructions.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <InputField
                                    label="Email Address"
                                    type="email"
                                    name="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="john@example.com"
                                    icon={Mail}
                                    error={status === "error"}
                                />

                                <AnimatePresence mode="wait">
                                    {status === "error" && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                                            <AlertCircle size={16} className="shrink-0" />
                                            <span>{message}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <button
                                    type="submit"
                                    disabled={status === "loading"}
                                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {status === "loading" ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Code"}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
