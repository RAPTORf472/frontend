"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from '@/contexts/auth-context';
import { Spinner } from '@/components/ui/spinner';
import { AlertCircle, Mail, Lock, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoginError {
  message: string;
  field?: string;
  remainingAttempts?: number;
}

export function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState<LoginError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (error?.field === name) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateEmail(formData.email)) {
      setError({
        message: 'Please enter a valid email address',
        field: 'email'
      });
      return;
    }

    if (!formData.password.trim()) {
      setError({
        message: 'Password is required',
        field: 'password'
      });
      return;
    }

    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
    } catch (error: any) {
      const errorMessage = error?.message || 'Login failed';
      const newError: LoginError = { message: errorMessage };
      
      const attemptsMatch = errorMessage.match(/(\d+) attempts? remaining/);
      if (attemptsMatch) {
        newError.remainingAttempts = parseInt(attemptsMatch[1]);
      }

      if (errorMessage.toLowerCase().includes('email')) {
        newError.field = 'email';
      } else if (errorMessage.toLowerCase().includes('password')) {
        newError.field = 'password';
      }

      setError(newError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AnimatePresence>
        {error && !error.field && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 bg-red-50 text-red-500 p-4 rounded-lg shadow-sm"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">{error.message}</p>
              {error.remainingAttempts !== undefined && (
                <p className="mt-1 text-sm font-medium">
                  {error.remainingAttempts} attempts remaining
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        <div className="relative group">
          <Mail className="h-5 w-5 text-[#5a7d61] absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors group-focus-within:text-[#2c5530]" />
          <Input
            type="email"
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
            className={`w-full pl-10 h-12 transition-all duration-200 border-[#d1e0d3] ${
              error?.field === 'email' 
                ? 'border-red-500 focus:ring-red-500' 
                : formData.email && validateEmail(formData.email)
                  ? 'border-[#3a6b3e] focus:ring-[#2c5530]'
                  : 'focus:ring-[#2c5530]'
            }`}
            aria-invalid={error?.field === 'email'}
            aria-label="Email address"
          />
        </div>
        <AnimatePresence>
          {error?.field === 'email' && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-red-500 text-sm"
            >
              {error.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-2">
        <div className="relative group">
          <Lock className="h-5 w-5 text-[#5a7d61] absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors group-focus-within:text-[#2c5530]" />
          <Input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full pl-10 h-12 transition-all duration-200 border-[#d1e0d3] ${
              error?.field === 'password' 
                ? 'border-red-500 focus:ring-red-500' 
                : formData.password
                  ? 'focus:ring-[#2c5530]'
                  : ''
            }`}
            aria-invalid={error?.field === 'password'}
            aria-label="Password"
          />
        </div>
        <AnimatePresence>
          {error?.field === 'password' && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-red-500 text-sm"
            >
              {error.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-4">
        <Button 
          type="submit" 
          className={`w-full h-12 text-base font-medium transition-all duration-200 bg-[#e76f51] hover:bg-[#e25b3a] text-white ${
            isLoading ? 'opacity-80' : 'hover:opacity-90'
          }`}
          disabled={isLoading || !formData.email || !formData.password}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <Spinner size="sm" />
              <span>Signing in...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>Sign in</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          )}
        </Button>

        <div className="flex items-center justify-between text-sm">
          <a 
            href="/auth/forgot-password" 
            className="text-[#3a6b3e] hover:text-[#2c5530] transition-colors font-medium"
          >
            Forgot password?
          </a>
          <a 
            href="/auth/register" 
            className="text-[#5a7d61] hover:text-[#2c5530] transition-colors font-medium"
          >
            Create an account
          </a>
        </div>
      </div>
    </form>
  );
} 