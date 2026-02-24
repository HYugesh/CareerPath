import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { saveToken } from "../utils/storage";
import api from "../api/axiosConfig";

export default function OAuthSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();
  
  useEffect(() => {
    const handleOAuthSuccess = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');
      
      if (error) {
        // Handle OAuth error
        navigate('/login', { 
          state: { 
            message: 'OAuth authentication failed. Please try again.' 
          }
        });
        return;
      }
      
      if (token) {
        try {
          // Save token and set authorization header
          saveToken(token);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Get user profile
          const response = await api.get('/auth/profile');
          setUser(response.data);
          
          // Redirect to dashboard after a brief success display
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
          
        } catch (error) {
          console.error('OAuth success handling error:', error);
          navigate('/login', { 
            state: { 
              message: 'Authentication failed. Please try again.' 
            }
          });
        }
      } else {
        // No token provided
        navigate('/login', { 
          state: { 
            message: 'Authentication failed. Please try again.' 
          }
        });
      }
    };
    
    handleOAuthSuccess();
  }, [searchParams, navigate, setUser]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#0a0a0f] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[500px] relative z-10"
      >
        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-10 shadow-2xl text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <CheckCircle size={80} className="text-green-500 mx-auto" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <h1 className="text-3xl font-bold text-white">Authentication Successful!</h1>
            <p className="text-gray-300">
              You have been successfully authenticated. Redirecting to your dashboard...
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-2 text-blue-400"
          >
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Setting up your account...</span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}