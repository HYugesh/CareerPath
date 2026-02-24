import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axiosConfig";
import { saveToken, getToken, clearToken } from "../utils/storage";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state

  // Check for a token on initial app load
  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = getToken();
      if (token) {
        try {
          // Add this header for the upcoming request
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          // Assume you have a backend route like '/api/auth/profile'
          // that returns the user's data based on their token.
          const response = await api.get('/auth/profile');
          setUser(response.data);
        } catch (error) {
          // Token is invalid or expired
          clearToken();
        }
      }
      setLoading(false); // Stop loading once checked
    };

    checkLoggedIn();
  }, []);

  const login = async (identifier, password) => {
    try {
      // Clear any existing token before attempting login
      clearToken();
      delete api.defaults.headers.common['Authorization'];

      // Send login request to backend to validate against database
      const res = await api.post("/auth/login", { identifier, password });

      // Ensure we have a token in the response
      if (!res.data.token) {
        throw new Error("No authentication token received");
      }

      // Save the token and set headers
      saveToken(res.data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;

      // Set the user state
      setUser(res.data.user);
      return res.data.user;
    } catch (error) {
      console.error("Login error:", error);
      // Re-throw the error so the Login component can handle it
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await api.post("/auth/register", { name, email, password });

      // New flow: Don't auto-login, return response for verification redirect
      return res.data;
    } catch (error) {
      // Re-throw the error so the Register component can handle it
      throw error;
    }
  };

  const socialLogin = async (data) => {
    try {
      const res = await api.post("/auth/social-login", data);

      if (!res.data.token) {
        throw new Error("No authentication token received");
      }

      saveToken(res.data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      setUser(res.data.user);
      return res.data.user;
    } catch (error) {
      console.error("Social login error:", error);
      throw error;
    }
  };

  /* OAuth functions commented out for future implementation
  const initiateGoogleAuth = () => {
    try {
      window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/google`;
    } catch (error) {
      console.error('Google OAuth initiation error:', error);
    }
  };

  const initiateGitHubAuth = () => {
    try {
      window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/github`;
    } catch (error) {
      console.error('GitHub OAuth initiation error:', error);
    }
  };
  */

  const verifyOTP = async (email, otp) => {
    try {
      const res = await api.post("/auth/verify-otp", { email, otp });
      return res.data;
    } catch (error) {
      console.error("OTP verification error:", error);
      throw error;
    }
  };

  const resendVerificationCode = async (email) => {
    try {
      const res = await api.post("/auth/resend-verification", { email });
      return res.data;
    } catch (error) {
      console.error("Resend verification error:", error);
      throw error;
    }
  };

  const logout = () => {
    clearToken();
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  // Don't render children until the token check is complete
  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
      login, 
      register, 
      logout, 
      loading, 
      socialLogin, 
      verifyOTP, 
      resendVerificationCode
      // OAuth functions commented out for future implementation
      // initiateGoogleAuth,
      // initiateGitHubAuth
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);