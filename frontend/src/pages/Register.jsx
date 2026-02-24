import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, Github, Chrome, AlertCircle } from "lucide-react";

const InputField = ({ label, type, name, value, onChange, placeholder, icon: Icon, error, showPasswordToggle, onTogglePassword, isPasswordVisible }) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-300 ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-400 transition-colors">
        <Icon size={20} />
      </div>
      <input
        type={type} name={name} value={value} onChange={onChange}
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
    {error && <p className="text-xs text-red-400 ml-1">{error}</p>}
  </div>
);

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Full name is required";
    if (!formData.email) newErrors.email = "Email address is required";
    else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      newErrors.email = "Please provide a valid email address";
    }
    if (!formData.password) newErrors.password = "Password is required";
    else {
      if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters long";
      else if (!/[A-Z]/.test(formData.password)) newErrors.password = "Password must contain at least one uppercase letter";
      else if (!/[0-9]/.test(formData.password)) newErrors.password = "Password must contain at least one number";
    }
    if (!formData.confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    if (globalError) setGlobalError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log("Registration form submitted with data:", { 
      name: formData.name, 
      email: formData.email, 
      passwordLength: formData.password?.length,
      confirmPasswordLength: formData.confirmPassword?.length
    });
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) { 
      console.log("Validation errors:", validationErrors);
      setErrors(validationErrors); 
      return; 
    }
    
    setIsLoading(true); 
    setGlobalError("");
    
    try {
      console.log("Calling register function...");
      const response = await register(formData.name, formData.email, formData.password);
      console.log("Registration response:", response);
      
      // Check if registration requires verification
      if (response.requiresVerification) {
        console.log("Registration requires verification, redirecting...");
        navigate("/verify-email", { 
          state: { 
            email: formData.email,
            message: response.message 
          }
        });
      } else {
        console.log("Registration successful, redirecting to home page...");
        // Fallback: if somehow auto-login still happens
        navigate("/");
      }
    } catch (err) {
      console.error("Registration error:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      const errorMsg = err.response?.data?.message || err.message || "Registration failed.";
      console.log("Setting error message:", errorMsg);
      setGlobalError(errorMsg);
    } finally { 
      console.log("Registration attempt finished, setting loading to false");
      setIsLoading(false); 
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#0a0a0f] relative overflow-hidden">
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="w-full max-w-[450px] relative z-10">
        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Create Account</h1>
            <p className="text-gray-400">Join CareerPath to accelerate your tech journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <InputField label="Full Name" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" icon={User} error={errors.name} />
              <InputField label="Email Address" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" icon={Mail} error={errors.email} />
              <InputField label="Password" type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" icon={Lock} error={errors.password} showPasswordToggle={true} isPasswordVisible={showPassword} onTogglePassword={() => setShowPassword(!showPassword)} />
              <InputField label="Confirm Password" type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" icon={Lock} error={errors.confirmPassword} showPasswordToggle={true} isPasswordVisible={showConfirmPassword} onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)} />
            </div>

            <AnimatePresence>
              {globalError && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{globalError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" disabled={isLoading} className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:-translate-y-0.5 disabled:opacity-70 flex items-center justify-center gap-2">
              {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Sign Up"}
            </button>
          </form>

          {/* OAuth section commented out for future implementation
          <div className="my-8 flex items-center gap-4">
            <div className="h-[1px] flex-1 bg-white/10" />
            <span className="text-gray-500 text-sm font-light">OR</span>
            <div className="h-[1px] flex-1 bg-white/10" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button" 
              onClick={initiateGoogleAuth}
              className="h-11 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-white group disabled:opacity-50"
            >
              <Chrome size={18} className="text-blue-400" />
              <span className="text-sm font-medium">Google</span>
            </button>
            <button 
              type="button" 
              onClick={initiateGitHubAuth}
              className="h-11 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-white group disabled:opacity-50"
            >
              <Github size={18} className="text-purple-400" />
              <span className="text-sm font-medium">GitHub</span>
            </button>
          </div>
          */}

          <div className="mt-8 text-center text-sm text-gray-400">
            Already have an account? <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors hover:underline underline-offset-4">Sign in</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}