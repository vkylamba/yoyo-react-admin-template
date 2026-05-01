import React, { createContext, useContext, useState, useEffect } from 'react';
import { checkAuth } from 'services/auth'; // Import the checkAuth method

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Default to false
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Add a loading state

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const authUser = await checkAuth(); // Call checkAuth to verify authentication
        setUser(authUser);
        setIsAuthenticated(Boolean(authUser));
      } catch (error) {
        console.error('Error during authentication check:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false); // Set loading to false after the check
      }
    };

    initializeAuth();
  }, []);

  const login = async () => {
    const authUser = await checkAuth();
    setUser(authUser);
    setIsAuthenticated(Boolean(authUser));
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return <div>Loading...</div>; // Show a loading indicator while checking auth
  }

  return <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
