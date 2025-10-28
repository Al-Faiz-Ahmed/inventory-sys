import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const dashboardCards = [
  {
    title: 'Dashboard',
    description: 'Overview of your business metrics',
    href: '/dashboard',
    icon: '📊',
    color: 'bg-blue-500',
  },
  {
    title: 'Inventory',
    description: 'Manage your products and stock',
    href: '/inventory',
    icon: '📦',
    color: 'bg-green-500',
  },
  {
    title: 'Sales',
    description: 'Track sales and revenue',
    href: '/sales',
    icon: '💰',
    color: 'bg-yellow-500',
  },
  {
    title: 'Purchases',
    description: 'Manage supplier purchases',
    href: '/purchases',
    icon: '🛒',
    color: 'bg-purple-500',
  },
  {
    title: 'Expenses',
    description: 'Track business expenses',
    href: '/expenses',
    icon: '💸',
    color: 'bg-red-500',
  },
  {
    title: 'Reports',
    description: 'Generate business reports',
    href: '/reports',
    icon: '📈',
    color: 'bg-indigo-500',
  },
  {
    title: 'Settings',
    description: 'Configure system settings',
    href: '/settings',
    icon: '⚙️',
    color: 'bg-gray-500',
  },
];

export function Homepage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Inventory Management System</h1>
        <p className="text-muted-foreground mt-2">
          Manage your inventory, sales, purchases, and expenses all in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardCards.map((card) => (
          <Link key={card.title} to={card.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                    {card.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
