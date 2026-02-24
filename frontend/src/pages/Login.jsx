import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Check, Github, Chrome, AlertCircle } from "lucide-react";

const InputField = ({ label, type, name, value, onChange, placeholder, icon: Icon, error, showPasswordToggle, onTogglePassword, isPasswordVisible, onFocus }) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-300 ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-400 transition-colors">
        <Icon size={20} />
      </div>
      <input
        type={type} name={name} value={value} onChange={onChange} onFocus={onFocus}
        className={`w-full pl-11 pr-${showPasswordToggle ? '12' : '4'} py-3 bg-white/5 border ${error ? 'border-red-500/50' : 'border-white/10 group-hover:border-white/20'} rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all duration-300`}
        placeholder={placeholder}
        required
      />
      {showPasswordToggle && (
        <button type="button" onClick={onTogglePassword} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer">
          {isPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}
    </div>
  </div>
);

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [globalError, setGlobalError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    // Check for success message from location state
    if (location.state?.message) {
      // You could show a success message here if needed
    }
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (globalError) setGlobalError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log("Form submitted with data:", { identifier: formData.identifier, passwordLength: formData.password?.length });
    
    if (!formData.identifier || !formData.password) {
      setGlobalError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setGlobalError("");

    try {
      console.log("Attempting login for:", formData.identifier);
      const user = await login(formData.identifier, formData.password);
      console.log("Login successful, user:", user);
      console.log("Navigating to home page...");

      // Navigate to home page after successful login
      navigate("/");
    } catch (err) {
      console.error("Login component caught error:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      const errorData = err.response?.data;
      
      // Check if user needs email verification
      if (errorData?.requiresVerification) {
        console.log("User needs verification, redirecting...");
        navigate("/verify-email", { 
          state: { 
            email: errorData.email,
            message: errorData.message 
          }
        });
        return;
      }
      
      const msg = errorData?.message || err.message || "Invalid email or password.";
      console.log("Setting error message:", msg);
      setGlobalError(msg);
    } finally {
      console.log("Login attempt finished, setting loading to false");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#0a0a0f]">
      {/* Background Orbs */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="w-full max-w-[420px] relative z-10">
        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome back</h1>
            <p className="text-gray-400">Enter your details to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <InputField label="Email or Username" type="text" name="identifier" value={formData.identifier} onChange={handleChange} placeholder="john@example.com" icon={Mail} />
              <InputField label="Password" type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" icon={Lock} showPasswordToggle={true} isPasswordVisible={showPassword} onTogglePassword={() => setShowPassword(!showPassword)} />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${rememberMe ? 'bg-blue-600 border-blue-600' : 'border-gray-500 group-hover:border-gray-400'}`}>
                  {rememberMe && <Check size={12} className="text-white" />}
                </div>
                <input type="checkbox" className="hidden" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <span className="text-gray-400 group-hover:text-gray-300 transition-colors">Remember me</span>
              </label>
              <Link to="/forgot-password" stroke="currentColor" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">Forgot password?</Link>
            </div>

            <AnimatePresence mode="wait">
              {globalError && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{globalError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" disabled={isLoading} className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Sign In"}
            </button>
          </form>

          {/* OAuth section commented out for future implementation
          <div className="my-8 flex items-center gap-4">
            <div className="h-[1px] flex-1 bg-white/10" />
            <span className="text-gray-500 text-sm">Or</span>
            <div className="h-[1px] flex-1 bg-white/10" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button" 
              onClick={initiateGoogleAuth}
              className="h-11 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-white/80 hover:text-white group"
            >
              <Chrome size={18} className="group-hover:text-blue-400 transition-colors" />
              <span className="text-sm font-medium">Google</span>
            </button>
            <button 
              type="button" 
              onClick={initiateGitHubAuth}
              className="h-11 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-white/80 hover:text-white group"
            >
              <Github size={18} className="group-hover:text-purple-400 transition-colors" />
              <span className="text-sm font-medium">GitHub</span>
            </button>
          </div>
          */}

          <div className="mt-8 text-center text-sm text-gray-400">
            Don't have an account? <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors hover:underline underline-offset-4">Sign up</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
