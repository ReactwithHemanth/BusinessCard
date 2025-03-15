import React, {createContext, useState, useContext, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({children}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on app load
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.log('Error retrieving user data:', error);
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  // Login function
  const login = async (username, password) => {
    // In a real app, you would make an API call to validate credentials
    // This is a simplified version for demonstration
    try {
      // Simulating API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simple validation (replace with actual API authentication)
      if (username && password) {
        const userData = {username};
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setIsLoggedIn(true);
        return {success: true};
      } else {
        return {success: false, error: 'Invalid credentials'};
      }
    } catch (error) {
      return {success: false, error: error.message};
    }
  };

  // Register function
  const register = async (username, password) => {
    // In a real app, you would make an API call to create a new user
    try {
      // Simulating API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simple validation (replace with actual API registration)
      if (username && password && password.length >= 6) {
        const userData = {username};
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setIsLoggedIn(true);
        return {success: true};
      } else {
        return {
          success: false,
          error:
            'Invalid registration data. Password must be at least 6 characters.',
        };
      }
    } catch (error) {
      return {success: false, error: error.message};
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.log('Error logging out:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        loading,
        login,
        register,
        logout,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
