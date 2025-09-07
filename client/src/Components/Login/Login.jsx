import React, { useState } from "react";
import { Eye, EyeOff, Lock, Mail, LogIn, AlertCircle } from "lucide-react";
import { authService } from "../../utils/authService";
import "./Login.css";

const Login = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Use the auth service to login
      const response = await authService.login(formData.email, formData.password);
      
      // The auth service already stores the tokens and user data
      // Just call the success callback to redirect to dashboard
      if (onLoginSuccess && response.user) {
        onLoginSuccess(response.user);
      }
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials and try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo">
            <img src="../../../public/1732864917491 (1).png" className="logo-img" alt="Elsewedy Logo" />
            <div className="logo-text">
              <p>Elsewedy</p>
              <p>Capstone System</p>
            </div>
          </div>
          <h2>Welcome Back</h2>
          <p>Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <Mail size={20} className="input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
                className="form-inputt"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock size={20} className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required
                className="form-inputt"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="password-toggle"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* <div className="form-options">
            <label className="checkbox-wrapper">
              <input type="checkbox" className="checkbox" />
              <span className="checkmark"></span>
              Remember me
            </label>
            <a href="#" className="forgot-password">
              Forgot Password?
            </a>
          </div> */}

          <button
            type="submit"
            disabled={isLoading}
            className="login-button"
          >
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              <>
                <LogIn size={20} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account?{" "}
            <a href="#" className="signup-link">
              Contact Administrator
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

// Note: This component now passes dynamic user data to the Dashboard
// No more hardcoded fallback values
