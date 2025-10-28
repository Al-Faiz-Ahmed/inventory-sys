import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from './ui/button';

export function Navbar() {
  const { user, logout } = useAuthStore();

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Welcome back, {user?.name || 'User'}!
          </h2>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            {user?.email}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
