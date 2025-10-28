import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/helpers';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Inventory', href: '/inventory', icon: '📦' },
  { name: 'Sales', href: '/sales', icon: '💰' },
  { name: 'Purchases', href: '/purchases', icon: '🛒' },
  { name: 'Expenses', href: '/expenses', icon: '💸' },
  { name: 'Reports', href: '/reports', icon: '📈' },
  { name: 'Settings', href: '/settings', icon: '⚙️' },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 bg-card border-r border-border h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-foreground">Inventory System</h1>
      </div>
      <nav className="px-4 pb-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={cn(
                    'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
