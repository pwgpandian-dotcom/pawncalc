import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

async function loadProfile(authUser) {
  if (!authUser) return null;
  const { data } = await supabase
    .from('profiles')
    .select('id, name, role, email')
    .eq('id', authUser.id)
    .single();
  if (!data) return null;
  return { id: data.id, name: data.name, role: data.role, email: data.email || authUser.email };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const profile = await loadProfile(session?.user);
      if (active) { setUser(profile); setLoading(false); }
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const profile = await loadProfile(session?.user);
      if (active) setUser(profile);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const err = new Error(error.message);
      err.response = { data: { message: 'Invalid email or password' } };
      throw err;
    }
    const profile = await loadProfile(data.user);
    setUser(profile);
    return { user: profile };
  };

  const logout = () => {
    supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
