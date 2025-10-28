import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function Settings() {
  const [settings, setSettings] = useState({
    companyName: 'Inventory System',
    companyEmail: 'admin@inventory.com',
    currency: 'USD',
    timezone: 'America/New_York',
    lowStockThreshold: 10,
    autoBackup: true,
    emailNotifications: true,
    smsNotifications: false,
  });

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    // Here you would typically save to backend
    console.log('Saving settings:', settings);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Configure your system preferences and account settings
        </p>
      </div>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>
            Basic information about your company
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={settings.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyEmail">Company Email</Label>
              <Input
                id="companyEmail"
                type="email"
                value={settings.companyEmail}
                onChange={(e) => handleInputChange('companyEmail', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>System Preferences</CardTitle>
          <CardDescription>
            Configure system-wide settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={settings.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="CAD">CAD - Canadian Dollar</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={settings.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
              >
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
            <Input
              id="lowStockThreshold"
              type="number"
              value={settings.lowStockThreshold}
              onChange={(e) => handleInputChange('lowStockThreshold', parseInt(e.target.value))}
            />
            <p className="text-sm text-muted-foreground">
              Products with quantity below this number will be marked as low stock
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>
            Configure how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <input
                id="emailNotifications"
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="smsNotifications">SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via SMS
                </p>
              </div>
              <input
                id="smsNotifications"
                type="checkbox"
                checked={settings.smsNotifications}
                onChange={(e) => handleInputChange('smsNotifications', e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoBackup">Auto Backup</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically backup data daily
                </p>
              </div>
              <input
                id="autoBackup"
                type="checkbox"
                checked={settings.autoBackup}
                onChange={(e) => handleInputChange('autoBackup', e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Manage your account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Account Status</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <Badge variant="default">Active</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Last Login</div>
              <div className="text-sm text-muted-foreground">Today at 10:30 AM</div>
            </div>
          </div>
          <div className="flex space-x-4">
            <Button variant="outline">Change Password</Button>
            <Button variant="outline">Update Profile</Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Settings</Button>
      </div>
    </div>
  );
}
