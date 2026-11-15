import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

export type UserMode = 'MERCHANT' | 'NORMAL_USER';

interface AuthContextType {
  user: any;
  merchant: any;
  token: string | null;
  loading: boolean;
  userMode: UserMode;
  geminiApiKey: string;
  sarvamApiKey: string;
  setUserMode: (mode: UserMode) => void;
  setGeminiApiKey: (key: string) => void;
  setSarvamApiKey: (key: string) => void;
  loginWithOtp: (mobile: string, otp: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [merchant, setMerchant] = useState<any>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('finrescue_token'));
  const [loading, setLoading] = useState(true);
  const [userMode, setUserModeState] = useState<UserMode>(
    (localStorage.getItem('finrescue_user_mode') as UserMode) || 'MERCHANT'
  );
  const [geminiApiKey, setGeminiApiKeyState] = useState<string>(
    localStorage.getItem('finrescue_gemini_key') || ''
  );
  const [sarvamApiKey, setSarvamApiKeyState] = useState<string>(
    localStorage.getItem('finrescue_sarvam_key') || 'sk_9xuqt11g_iHKWscjOLRGdJX92BuWXcZsj'
  );

  const setUserMode = (mode: UserMode) => {
    setUserModeState(mode);
    localStorage.setItem('finrescue_user_mode', mode);
  };

  const setGeminiApiKey = (key: string) => {
    setGeminiApiKeyState(key);
    localStorage.setItem('finrescue_gemini_key', key);
    if (key) {
      api.post('/agent/set-key', { apiKey: key }).catch(() => {});
    }
  };

  const setSarvamApiKey = (key: string) => {
    setSarvamApiKeyState(key);
    localStorage.setItem('finrescue_sarvam_key', key);
    if (key) {
      api.post('/agent/set-sarvam-key', { apiKey: key }).catch(() => {});
    }
  };

  const refreshUser = async () => {
    if (!localStorage.getItem('finrescue_token')) {
      setUser(null);
      setMerchant(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      setMerchant(res.data.merchant);
    } catch (e) {
      console.error('Failed to fetch user', e);
      localStorage.removeItem('finrescue_token');
      setToken(null);
      setUser(null);
      setMerchant(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const loginWithOtp = async (mobile: string, otp: string): Promise<boolean> => {
    try {
      const res = await api.post('/auth/verify-otp', { mobile, otp });
      if (res.data.success && res.data.token) {
        localStorage.setItem('finrescue_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        await refreshUser();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Login error', e);
      return false;
    }
  };

  const logout = () => {
    api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('finrescue_token');
    setToken(null);
    setUser(null);
    setMerchant(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        merchant,
        token,
        loading,
        userMode,
        geminiApiKey,
        sarvamApiKey,
        setUserMode,
        setGeminiApiKey,
        setSarvamApiKey,
        loginWithOtp,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
