import React, { createContext, useContext, useState, useEffect } from 'react';
import { checkAuth } from 'services/auth'; // Import the checkAuth method

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Default to false
  const [loading, setLoading] = useState(true); // Add a loading state

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const authStatus = await checkAuth(); // Call checkAuth to verify authentication
        setIsAuthenticated(authStatus);
      } catch (error) {
        console.error('Error during authentication check:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false); // Set loading to false after the check
      }
    };

    initializeAuth();
  }, []);

  const login = () => setIsAuthenticated(true);
  const logout = () => setIsAuthenticated(false);

  if (loading) {
    return <div>Loading...</div>; // Show a loading indicator while checking auth
  }

  return <AuthContext.Provider value={{ isAuthenticated, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
