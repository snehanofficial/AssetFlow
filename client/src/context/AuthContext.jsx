/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiFetch from '../utils/api.js';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user details
  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await apiFetch('/auth/me');
      if (res.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      if (res.success && res.data?.accessToken) {
        sessionStorage.setItem('accessToken', res.data.accessToken);
        // Load actual user profile details
        const meRes = await apiFetch('/auth/me');
        if (meRes.success && meRes.data?.user) {
          setUser(meRes.data.user);
        }
      }
      return res;
    } catch (err) {
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Signup/Register handler
  const signup = async (name, email, password) => {
    setLoading(true);
    try {
      const res = await apiFetch('/auth/signup', {
        method: 'POST',
        body: { name, email, password },
      });

      if (res.success && res.data?.accessToken) {
        sessionStorage.setItem('accessToken', res.data.accessToken);
        if (res.data.employee) {
          setUser(res.data.employee);
        } else {
          // Fallback to fetch profile if not fully returned
          const meRes = await apiFetch('/auth/me');
          if (meRes.success && meRes.data?.user) {
            setUser(meRes.data.user);
          }
        }
      }
      return res;
    } catch (err) {
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = async () => {
    setLoading(true);
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // Proceed with clearing local state even if server logout fails
    } finally {
      sessionStorage.removeItem('accessToken');
      setUser(null);
      setLoading(false);
    }
  };

  // On mount, check if there is an active session
  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, logout, refetchUser: fetchCurrentUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
