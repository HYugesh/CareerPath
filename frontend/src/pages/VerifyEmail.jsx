import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import api from "../api/axiosConfig";

export default function VerifyEmail() {
    const { token } = useParams();
    const [status, setStatus] = useState("verifying"); // verifying, success, error
    const [message, setMessage] = useState("");

    useEffect(() => {
        const verifyToken = async () => {
            try {
                const res = await api.get(`/auth/verify-email/${token}`);
                setStatus("success");
                setMessage(res.data.message);
            } catch (err) {
                setStatus("error");
                setMessage(err.response?.data?.message || "Verification failed. The link may have expired.");
            }
        };

        if (token) {
            verifyToken();
        }
    }, [token]);

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#0a0a0f] relative overflow-hidden">
            {/* Dynamic Background */}
            <div className="absolute inset-0 w-full h-full">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[500px] relative z-10"
            >
                <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-10 shadow-2xl text-center space-y-6">
                    {status === "verifying" && (
                        <div className="space-y-6">
                            <Loader2 size={60} className="text-blue-500 animate-spin mx-auto" />
                            <h1 className="text-2xl font-bold text-white">Verifying your email...</h1>
                            <p className="text-gray-400">Please wait while we confirm your account.</p>
                        </div>
                    )}

                    {status === "success" && (
                        <div className="space-y-6">
                            <CheckCircle size={60} className="text-green-500 mx-auto" />
                            <h1 className="text-3xl font-bold text-white">Verification Successful!</h1>
                            <p className="text-gray-300">{message}</p>
                            <div className="pt-4">
                                <Link
                                    to="/login"
                                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-blue-500/30 transition-all inline-block"
                                >
                                    Proceed to Login
                                </Link>
                            </div>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="space-y-6">
                            <XCircle size={60} className="text-red-500 mx-auto" />
                            <h1 className="text-3xl font-bold text-white">Verification Failed</h1>
                            <p className="text-gray-300">{message}</p>
                            <div className="pt-4">
                                <Link
                                    to="/register"
                                    className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all inline-block"
                                >
                                    Back to Sign Up
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
