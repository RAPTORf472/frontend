import React from 'react';
import { RegisterForm } from '@/components/auth/register-form';
import { TreePine } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e9f0e6] to-[#f0f4e9]">
      <div className="w-full max-w-md p-8 space-y-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl transform transition-all hover:scale-[1.01] hover:shadow-2xl border border-[#d1e0d3]">
        <div className="flex flex-col items-center space-y-2">
          <div className="p-3 bg-[#f0f4e9] rounded-full border border-[#d1e0d3]">
            <TreePine className="h-8 w-8 text-[#2c5530]" />
          </div>
          <h2 className="text-3xl font-bold text-[#2c5530]">Create Account</h2>
          <p className="text-[#5a7d61]">Join Green Buddy today</p>
        </div>
        <RegisterForm />
        <div className="text-center text-sm text-[#5a7d61]">
          Already have an account?{' '}
          <a href="/auth/login" className="text-[#3a6b3e] hover:text-[#2c5530] font-medium transition-colors">
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
} 