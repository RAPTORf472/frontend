import React from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { TreePine } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e9f0e6] to-[#f0f4e9]">
      <div className="w-full max-w-md p-8 space-y-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl transform transition-all hover:scale-[1.01] hover:shadow-2xl border border-[#d1e0d3]">
        <div className="flex flex-col items-center space-y-2">
          <div className="p-3 bg-[#f0f4e9] rounded-full border border-[#d1e0d3]">
            <TreePine className="h-8 w-8 text-[#2c5530]" />
          </div>
          <h2 className="text-3xl font-bold text-[#2c5530]">Welcome Back</h2>
          <p className="text-[#5a7d61]">Sign in to your account</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
} 