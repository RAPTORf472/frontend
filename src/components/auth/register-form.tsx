"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from '@/contexts/auth-context';
import { Spinner } from '@/components/ui/spinner';
import { Check, X, AlertCircle, User, Mail, Lock, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ValidationState {
  username: boolean;
  email: boolean;
  password: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export function RegisterForm() {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [validation, setValidation] = useState<ValidationState>({
    username: false,
    email: false,
    password: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false
    }
  });

  const validateUsername = (value: string) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(value);
  };

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const validatePassword = (value: string) => {
    return {
      length: value.length >= 8,
      uppercase: /[A-Z]/.test(value),
      lowercase: /[a-z]/.test(value),
      number: /[0-9]/.test(value),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(value)
    };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    if (name === 'username') {
      setValidation(prev => ({ ...prev, username: validateUsername(value) }));
    } else if (name === 'email') {
      setValidation(prev => ({ ...prev, email: validateEmail(value) }));
    } else if (name === 'password') {
      setValidation(prev => ({ ...prev, password: validatePassword(value) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: { [key: string]: string } = {};

    if (!validateUsername(formData.username)) {
      newErrors.username = 'Username must be 3-20 characters long and contain only letters, numbers, and underscores';
    }

    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    const passwordValidation = validatePassword(formData.password);
    if (!Object.values(passwordValidation).every(Boolean)) {
      newErrors.password = 'Password does not meet all requirements';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      await register(formData.username, formData.email, formData.password);
    } catch (error: any) {
      const errorMessage = error?.message || 'Registration failed';
      if (errorMessage.toLowerCase().includes('username')) {
        setErrors({ username: errorMessage });
      } else if (errorMessage.toLowerCase().includes('email')) {
        setErrors({ email: errorMessage });
      } else if (errorMessage.toLowerCase().includes('password')) {
        setErrors({ password: errorMessage });
      } else {
        setErrors({ general: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderPasswordRequirement = (label: string, met: boolean) => (
    <motion.div 
      className="flex items-center space-x-2 text-sm"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      {met ? (
        <Check className="h-4 w-4 text-[#3a6b3e]" />
      ) : (
        <X className="h-4 w-4 text-[#d1e0d3]" />
      )}
      <span className={met ? 'text-[#2c5530]' : 'text-[#5a7d61]'}>{label}</span>
    </motion.div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AnimatePresence>
        {errors.general && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 bg-red-50 text-red-500 p-4 rounded-lg shadow-sm"
          >
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">{errors.general}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        <div className="relative">
          <User className="h-5 w-5 text-[#5a7d61] absolute left-3 top-1/2 transform -translate-y-1/2" />
          <Input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            className={`w-full pl-10 h-12 transition-all duration-200 border-[#d1e0d3] ${
              errors.username 
                ? 'border-red-500 focus:ring-red-500' 
                : validation.username 
                  ? 'border-[#3a6b3e] focus:ring-[#2c5530]' 
                  : 'focus:ring-[#2c5530]'
            }`}
            aria-invalid={!!errors.username}
            aria-label="Username"
          />
        </div>
        <AnimatePresence>
          {errors.username && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-red-500 text-sm"
            >
              {errors.username}
            </motion.p>
          )}
          {formData.username && !errors.username && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`text-sm ${validation.username ? 'text-[#3a6b3e]' : 'text-[#5a7d61]'}`}
            >
              {validation.username ? '✓ Valid username' : 'Username must be 3-20 characters (letters, numbers, underscores)'}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Mail className="h-5 w-5 text-[#5a7d61] absolute left-3 top-1/2 transform -translate-y-1/2" />
          <Input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full pl-10 h-12 transition-all duration-200 border-[#d1e0d3] ${
              errors.email 
                ? 'border-red-500 focus:ring-red-500' 
                : validation.email 
                  ? 'border-[#3a6b3e] focus:ring-[#2c5530]' 
                  : 'focus:ring-[#2c5530]'
            }`}
            aria-invalid={!!errors.email}
            aria-label="Email address"
          />
        </div>
        <AnimatePresence>
          {errors.email && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-red-500 text-sm"
            >
              {errors.email}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Lock className="h-5 w-5 text-[#5a7d61] absolute left-3 top-1/2 transform -translate-y-1/2" />
          <Input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            onFocus={() => setShowPasswordRequirements(true)}
            className={`w-full pl-10 h-12 transition-all duration-200 border-[#d1e0d3] ${
              errors.password 
                ? 'border-red-500 focus:ring-red-500' 
                : Object.values(validation.password).every(Boolean)
                  ? 'border-[#3a6b3e] focus:ring-[#2c5530]' 
                  : 'focus:ring-[#2c5530]'
            }`}
            aria-invalid={!!errors.password}
            aria-label="Password"
          />
        </div>
        <AnimatePresence>
          {errors.password && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-red-500 text-sm"
            >
              {errors.password}
            </motion.p>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showPasswordRequirements && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[#f0f4e9] rounded-lg p-3 border border-[#d1e0d3] mt-2 space-y-1"
            >
              <p className="text-xs font-medium text-[#2c5530] mb-2">Password must have:</p>
              {renderPasswordRequirement('At least 8 characters', validation.password.length)}
              {renderPasswordRequirement('At least one uppercase letter', validation.password.uppercase)}
              {renderPasswordRequirement('At least one lowercase letter', validation.password.lowercase)}
              {renderPasswordRequirement('At least one number', validation.password.number)}
              {renderPasswordRequirement('At least one special character', validation.password.special)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-2">
        <div className="relative">
          <KeyRound className="h-5 w-5 text-[#5a7d61] absolute left-3 top-1/2 transform -translate-y-1/2" />
          <Input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`w-full pl-10 h-12 transition-all duration-200 border-[#d1e0d3] ${
              errors.confirmPassword 
                ? 'border-red-500 focus:ring-red-500' 
                : formData.confirmPassword && formData.password === formData.confirmPassword
                  ? 'border-[#3a6b3e] focus:ring-[#2c5530]' 
                  : 'focus:ring-[#2c5530]'
            }`}
            aria-invalid={!!errors.confirmPassword}
            aria-label="Confirm Password"
          />
        </div>
        <AnimatePresence>
          {errors.confirmPassword && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-red-500 text-sm"
            >
              {errors.confirmPassword}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <Button 
        type="submit" 
        className={`w-full h-12 text-base font-medium bg-[#e76f51] hover:bg-[#e25b3a] text-white transition-all duration-200 ${
          isLoading ? 'opacity-80' : 'hover:opacity-90'
        }`}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <Spinner size="sm" />
            <span>Creating Account...</span>
          </div>
        ) : (
          <span>Create Account</span>
        )}
      </Button>
    </form>
  );
}