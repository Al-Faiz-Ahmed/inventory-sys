import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function Reports() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reports</h1>
        <p className="text-muted-foreground">Choose a report to get started</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Purchase</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">Purchase related reports</div>
            <div className="flex flex-col gap-2">
              <button className="w-full text-left underline text-primary" onClick={() => navigate('/reports/purchase')}>
                Open Purchase Reports
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/reports/sales')}>
          <CardHeader>
            <CardTitle>Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">View detailed sales reports and analytics</div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/reports/main-account')}>
          <CardHeader>
            <CardTitle>Main Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">View detailed main account transactions</div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/reports/main-inventory')}>
          <CardHeader>
            <CardTitle>Main Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">View all product inventory transactions</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales & Purchase Both</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Coming soon</div>
          </CardContent>
        </Card>
      </div>

      {/* Nested pages will handle detailed reports */}
    </div>
  );
}
