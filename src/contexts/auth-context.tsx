"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { useRouter } from 'next/navigation';

const IS_DEV = process.env.NODE_ENV === 'development';
const TOKEN_VERIFY_INTERVAL = IS_DEV ? 30 * 60 * 1000 : 5 * 60 * 1000; // 30 minutes in dev, 5 minutes in prod

interface User {
  id: number;
  username: string;
  email: string;
  roles: string[];
  created_at: string | null;
  last_login: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lastVerified, setLastVerified] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      // If we have a stored user and token, just use that
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
      setIsLoading(false);
    } else {
      // Only verify if we don't have a stored user
      verifyToken();
    }
  }, []);

  const verifyToken = async () => {
    console.log('Verifying token:', { hasToken: !!localStorage.getItem('token') })
    
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/auth/verify-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Token verification failed');
      }

      if (data.success) {
        setUser(data.user);
        setIsAuthenticated(true);
        // Update stored user data
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        throw new Error(data.message || 'Token verification failed');
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    router.push('/auth/login');
  };

  const login = async (email: string, password: string) => {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    try {
      const response = await fetch(`/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      // Handle specific error cases
      if (!response.ok) {
        switch (response.status) {
          case 400:
            throw new Error('Email and password are required');
          case 401:
            throw new Error('Invalid email or password');
          case 500:
            throw new Error('Server error. Please try again later');
          default:
            throw new Error(data.message || 'Login failed');
        }
      }

      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }

      // Validate required fields in response
      if (!data.token || !data.user || !data.user.id || !data.user.username || !data.user.email) {
        throw new Error('Invalid server response');
      }

      // Store authentication data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Update application state
      setUser(data.user);
      setIsAuthenticated(true);
      
      // Redirect to dashboard
      router.push('/profile');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await fetch(`/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Registration failed');
      }

      // Validate response data
      if (!data.token || !data.user) {
        throw new Error('Invalid server response');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      setIsAuthenticated(true);
      router.push('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" className="text-green-600" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout: handleLogout, isLoading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 