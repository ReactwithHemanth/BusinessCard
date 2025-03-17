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
  const login = async (username: string, password: string) => {
    try {
      // Simulating API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Admin hardcoded credentials (in a real app, this would be verified on the server)
      if (username === 'admin' && password === 'admin123') {
        const userData: any = {username, isAdmin: true};
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setIsLoggedIn(true);
        return {success: true};
      }
      // Regular user login
      else if (username && password) {
        const userData: any = {username, isAdmin: false};
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
  const register = async (username: string, password: string | any[]) => {
    try {
      // Simulating API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Prevent registering as admin
      if (username.toLowerCase() === 'admin') {
        return {success: false, error: 'This username is reserved'};
      }

      // Simple validation (replace with actual API registration)
      if (username && password && password.length >= 6) {
        const userData: {username: string; isAdmin: boolean} = {
          username,
          isAdmin: false,
        }; //+
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
        isAdmin: user?.isAdmin || false,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
