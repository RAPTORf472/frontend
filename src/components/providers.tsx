'use client';

import { AuthProvider } from "@/contexts/auth-context"
import { SocketProvider } from "@/contexts/socket-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SocketProvider>
        {children}
      </SocketProvider>
    </AuthProvider>
  );
} 