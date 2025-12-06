'use client';

import React, { useState } from 'react';
import { Save, User, Lock, Bell, Globe, Settings2, Shield, Smartphone, Mail, Clock, Languages } from 'lucide-react';
import { Card } from '@/components/admin/Card';
import { Input, Select } from '@/components/admin/Input';
import { Button } from '@/components/admin/Button';

const timezoneOptions = [
  { value: 'UTC-8', label: 'Pacific Time (UTC-8)' },
  { value: 'UTC-5', label: 'Eastern Time (UTC-5)' },
  { value: 'UTC+0', label: 'Greenwich Mean Time (UTC+0)' },
  { value: 'UTC+5:30', label: 'India Standard Time (UTC+5:30)' },
];

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({
    name: 'Admin User',
    email: 'admin@hospital.com',
    phone: '+1 (555) 123-4567',
    timezone: 'UTC-5',
    language: 'en',
  });

  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
  });

  const [notificationForm, setNotificationForm] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    weeklyReports: true,
    monthlyReports: true,
  });

  const handleSaveProfile = () => {
    console.log('Saving profile:', profileForm);
    // Add save logic here
  };

  const handleSavePassword = () => {
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    console.log('Changing password');
    // Add password change logic here
  };

  const handleSaveNotifications = () => {
    console.log('Saving notifications:', notificationForm);
    // Add notification save logic here
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'general', label: 'General', icon: Globe },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <Card className="lg:col-span-1 h-fit">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card title="Profile Information" subtitle="Update your account profile information">
              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  />
                </div>
                
                <Input
                  label="Phone Number"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Timezone"
                    options={timezoneOptions}
                    value={profileForm.timezone}
                    onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                  />
                  <Select
                    label="Language"
                    options={languageOptions}
                    value={profileForm.language}
                    onChange={(e) => setProfileForm({ ...profileForm, language: e.target.value })}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <Card title="Change Password" subtitle="Ensure your account is protected">
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSavePassword(); }}>
                  <Input
                    label="Current Password"
                    type="password"
                    value={securityForm.currentPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                  />
                  
                  <Input
                    label="New Password"
                    type="password"
                    value={securityForm.newPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                  />
                  
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={securityForm.confirmPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                  />

                  <div className="flex justify-end">
                    <Button type="submit" className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Update Password
                    </Button>
                  </div>
                </form>
              </Card>

              <Card title="Two-Factor Authentication" subtitle="Add an extra layer of security">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Enable Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-500">Secure your account with 2FA via SMS or authenticator app</p>
                    </div>
                    <Button variant="outline">
                      {securityForm.twoFactorEnabled ? 'Disable' : 'Enable'} 2FA
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card title="Notification Preferences" subtitle="Choose how you want to receive notifications">
              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSaveNotifications(); }}>
                <div className="space-y-4">
                  {[
                    { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
                    { key: 'smsNotifications', label: 'SMS Notifications', description: 'Receive notifications via SMS' },
                    { key: 'pushNotifications', label: 'Push Notifications', description: 'Receive browser push notifications' },
                    { key: 'weeklyReports', label: 'Weekly Reports', description: 'Receive weekly summary reports' },
                    { key: 'monthlyReports', label: 'Monthly Reports', description: 'Receive monthly detailed reports' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{item.label}</h3>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={notificationForm[item.key as keyof typeof notificationForm] as boolean}
                          onChange={(e) => setNotificationForm({ 
                            ...notificationForm, 
                            [item.key]: e.target.checked 
                          })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <Button type="submit" className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save Preferences
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* General Tab */}
          {activeTab === 'general' && (
            <Card title="General Settings" subtitle="Configure general application settings">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Application Preferences</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Date Format"
                      options={[
                        { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                        { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                        { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
                      ]}
                      value="MM/DD/YYYY"
                      onChange={() => {}}
                    />
                    
                    <Select
                      label="Currency"
                      options={[
                        { value: 'USD', label: 'US Dollar (USD)' },
                        { value: 'EUR', label: 'Euro (EUR)' },
                        { value: 'GBP', label: 'British Pound (GBP)' },
                        { value: 'INR', label: 'Indian Rupee (INR)' },
                      ]}
                      value="USD"
                      onChange={() => {}}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Data & Storage</h3>
                  
                  <div className="space-y-3">
                    <Button variant="outline">
                      Export Account Data
                    </Button>
                    <Button variant="danger">
                      Clear Application Cache
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save Settings
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}