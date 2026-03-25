import React, { createContext, useContext, useState, useEffect } from 'react';
import { verifyToken, login, register, registerAdmin, logoutUser, getProfile } from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    // Rely on httpOnly cookie automatically sent 
    verifyToken().then(res => {
      if (res.data.valid) {
        getProfile(res.data.decoded.userId)
            .then(p => setUser({ ...p.data, id: p.data._id }))
            .catch(() => setUser(res.data.decoded));
      }
    }).catch(() => {
      // no token or invalid 
    }).finally(() => setLoading(false));
  }, []);

  const loginUser = async (email, password) => {
    const res = await login({ email, password });
    setUser(res.data.user);
    setShowLoginModal(false);
    return res.data;
  };

  const registerUser = async (data) => {
    const res = await register(data);
    setUser(res.data.user);
    setShowLoginModal(false);
    return res.data;
  };

  const registerAdminUser = async (data) => {
    const res = await registerAdmin(data);
    setUser(res.data.user);
    return res.data;
  };

  const logout = async () => {
    try { await logoutUser(); } catch(e) {}
    setUser(null);
  };

  const requireAuth = (action) => {
    if (user) { action(); } else { setShowLoginModal(true); }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, registerUser, registerAdminUser, logout, showLoginModal, setShowLoginModal, requireAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
