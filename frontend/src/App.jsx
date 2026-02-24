import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Roadmap from './pages/Roadmap';
import RoadmapDetail from './pages/RoadmapDetail';
import ModuleDetail from './pages/ModuleDetail';
import Assessment from './pages/Assessment';
import DifficultySelection from './pages/DifficultySelection';
import Quiz from './pages/Quiz';
import Results from './pages/Results';
import Assistant from './pages/Assistant';
import VoiceDemo from './components/VoiceDemo';
import GeminiCodeArena from './pages/GeminiCodeArena';
import InterviewRoom from './pages/InterviewRoom';
import InterviewLanding from './pages/InterviewLanding';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import EmailVerification from './pages/EmailVerification';
// import OAuthSuccess from './pages/OAuthSuccess'; // Commented out for future implementation

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<EmailVerification />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        {/* OAuth route commented out for future implementation */}
        {/* <Route path="/oauth/success" element={<OAuthSuccess />} /> */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/roadmap" element={<ProtectedRoute><Roadmap /></ProtectedRoute>} />
        <Route path="/roadmap/:id" element={<ProtectedRoute><RoadmapDetail /></ProtectedRoute>} />
        <Route path="/roadmap/:roadmapId/module/:moduleId" element={<ProtectedRoute><ModuleDetail /></ProtectedRoute>} />
        <Route path="/assessment" element={<Assessment />} />
        <Route path="/assessment/:domain" element={<ProtectedRoute><DifficultySelection /></ProtectedRoute>} />
        <Route path="/assessment/quiz/:id" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
        <Route path="/assessment/results/:id" element={<ProtectedRoute><Results /></ProtectedRoute>} />
        
        {/* Roadmap Quiz Route (Dual Mode Support) */}
        <Route path="/roadmap/:roadmapId/module/:moduleId/quiz/:id" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
        
        {/* Sub-Topic Quiz Route */}
        <Route path="/roadmap/:roadmapId/module/:moduleId/subtopic/:subComponentId/quiz/:id" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
        
        <Route path="/interview-landing" element={<InterviewLanding />} />
        <Route path="/interview" element={<ProtectedRoute><InterviewRoom /></ProtectedRoute>} />
        <Route path="/interview-old" element={<Assistant />} />
        <Route path="/voice-demo" element={<ProtectedRoute><VoiceDemo /></ProtectedRoute>} />
        <Route path="/coding" element={<ProtectedRoute><GeminiCodeArena /></ProtectedRoute>} />
        <Route path="/interview-room" element={<ProtectedRoute><InterviewRoom /></ProtectedRoute>} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />
        <Navbar />
        <main className="min-h-screen">
          <AnimatedRoutes />
        </main>
      </Router>
    </AuthProvider>
  );
}
