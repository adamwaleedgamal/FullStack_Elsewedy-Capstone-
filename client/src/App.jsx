import React, { useState, useEffect } from "react";
import Dashboard from "./Components/Dashboard/Dashboard";
import Login from "./Components/Login/Login";
import LoadingSpinner from "./Components/LoadingSpinner/LoadingSpinner";
import { authService } from "./utils/authService";
import { NotificationProvider } from "./contexts/NotificationContext";
import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in using auth service
    const checkAuthStatus = async () => {
      try {
        // First check if we have a valid access token in memory
        if (authService.isAuthenticated()) {
          const storedUser = authService.getStoredUser();
          if (storedUser) {
            setUser(storedUser);
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          }
        }

        // If no valid access token, try to refresh using the refresh token from cookies
        // But only try once, don't create an infinite loop
        console.log("No valid access token found, attempting to refresh...");
        
        try {
          await authService.refreshToken();
          
          // Check again after refresh
          if (authService.isAuthenticated()) {
            const storedUser = authService.getStoredUser();
            if (storedUser) {
              setUser(storedUser);
              setIsAuthenticated(true);
              console.log("Successfully refreshed token and restored session");
            } else {
              console.log("Token refreshed but no user data found");
              authService.logout();
            }
          } else {
            console.log("Token refresh failed - no valid refresh token available");
          }
        } catch (refreshError) {
          console.log("Token refresh failed:", refreshError.message);
          // Don't try again, just go to login
          authService.logout();
        }
      } catch (error) {
        console.log("Authentication check failed:", error.message);
        // Clear any invalid auth state
        authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <NotificationProvider>
        <div className="App">
          <LoadingSpinner />
        </div>
      </NotificationProvider>
    );
  }

  return (
    <NotificationProvider>
      <div className="App">
        {isAuthenticated ? (
          <Dashboard onLogout={handleLogout} user={user} />
        ) : (
          <Login onLoginSuccess={handleLoginSuccess} />
        )}
      </div>
    </NotificationProvider>
  );
}

export default App;

// Note: This app now passes dynamic user data to all components
// No more hardcoded IDs, uses user.id from login instead
