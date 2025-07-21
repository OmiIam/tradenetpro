"use client";

import React, { useState } from 'react';
import { User, Mail, Shield, Bell, CreditCard, Key, Save, Camera, CheckCircle, XCircle } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'payment'>('profile');
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    country: 'United States',
    timezone: 'UTC-5 (Eastern Time)',
  });

  // Security form state
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: true,
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    priceAlerts: true,
    tradeConfirmations: true,
    marketNews: false,
    maintenanceUpdates: true,
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaveStatus('idle');
    
    // Mock API call
    setTimeout(() => {
      setSaveStatus('success');
      setLoading(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }, 1000);
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: <User className="w-5 h-5" /> },
    { id: 'security', name: 'Security', icon: <Shield className="w-5 h-5" /> },
    { id: 'notifications', name: 'Notifications', icon: <Bell className="w-5 h-5" /> },
    { id: 'payment', name: 'Payment', icon: <CreditCard className="w-5 h-5" /> },
  ];

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-white mb-8">Account Settings</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            {activeTab === 'profile' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-white">Profile Information</h2>
                  <div className="flex items-center space-x-2">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                      <Camera className="w-5 h-5 text-gray-300" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 mb-2">First Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2">Last Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">Email Address</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 mb-2">Country</label>
                      <select
                        className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                        value={profileData.country}
                        onChange={(e) => setProfileData({...profileData, country: e.target.value})}
                      >
                        <option value="United States">United States</option>
                        <option value="Canada">Canada</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Germany">Germany</option>
                        <option value="France">France</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2">Timezone</label>
                      <select
                        className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                        value={profileData.timezone}
                        onChange={(e) => setProfileData({...profileData, timezone: e.target.value})}
                      >
                        <option value="UTC-5 (Eastern Time)">UTC-5 (Eastern Time)</option>
                        <option value="UTC-6 (Central Time)">UTC-6 (Central Time)</option>
                        <option value="UTC-7 (Mountain Time)">UTC-7 (Mountain Time)</option>
                        <option value="UTC-8 (Pacific Time)">UTC-8 (Pacific Time)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    ) : (
                      <Save className="w-5 h-5 mr-2" />
                    )}
                    Save Changes
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h2 className="text-2xl font-semibold text-white mb-6">Security Settings</h2>
                
                <div className="space-y-6">
                  {/* Password Change */}
                  <div className="border border-white/10 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
                    <form onSubmit={handleSave} className="space-y-4">
                      <div>
                        <label className="block text-gray-300 mb-2">Current Password</label>
                        <input
                          type="password"
                          className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                          value={securityData.currentPassword}
                          onChange={(e) => setSecurityData({...securityData, currentPassword: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">New Password</label>
                        <input
                          type="password"
                          className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                          value={securityData.newPassword}
                          onChange={(e) => setSecurityData({...securityData, newPassword: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">Confirm New Password</label>
                        <input
                          type="password"
                          className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                          value={securityData.confirmPassword}
                          onChange={(e) => setSecurityData({...securityData, confirmPassword: e.target.value})}
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center"
                      >
                        <Key className="w-4 h-4 mr-2" />
                        Update Password
                      </button>
                    </form>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="border border-white/10 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">Two-Factor Authentication</h3>
                        <p className="text-gray-400">Add an extra layer of security to your account</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={securityData.twoFactorEnabled}
                          onChange={(e) => setSecurityData({...securityData, twoFactorEnabled: e.target.checked})}
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-2xl font-semibold text-white mb-6">Notification Preferences</h2>
                
                <div className="space-y-4">
                  {Object.entries(notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
                      <div>
                        <h3 className="text-white font-medium capitalize">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {key === 'emailAlerts' && 'Receive email notifications for account activity'}
                          {key === 'priceAlerts' && 'Get notified when prices reach your targets'}
                          {key === 'tradeConfirmations' && 'Receive confirmations for all trades'}
                          {key === 'marketNews' && 'Stay updated with market news and insights'}
                          {key === 'maintenanceUpdates' && 'Important platform maintenance notifications'}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={value}
                          onChange={(e) => setNotifications({...notifications, [key]: e.target.checked})}
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleSave}
                  className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center"
                >
                  <Save className="w-5 h-5 mr-2" />
                  Save Preferences
                </button>
              </div>
            )}

            {activeTab === 'payment' && (
              <div>
                <h2 className="text-2xl font-semibold text-white mb-6">Payment Methods</h2>
                
                <div className="space-y-6">
                  <div className="border border-white/10 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Cryptocurrency Wallets</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                            <span className="text-black text-sm font-bold">₿</span>
                          </div>
                          <div>
                            <div className="text-white font-medium">Bitcoin</div>
                            <div className="text-gray-400 text-sm">bc1q...placeholder</div>
                          </div>
                        </div>
                        <div className="text-green-400 text-sm">Connected</div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">Ξ</span>
                          </div>
                          <div>
                            <div className="text-white font-medium">Ethereum</div>
                            <div className="text-gray-400 text-sm">0x...placeholder</div>
                          </div>
                        </div>
                        <div className="text-green-400 text-sm">Connected</div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">₮</span>
                          </div>
                          <div>
                            <div className="text-white font-medium">USDT (Tether)</div>
                            <div className="text-gray-400 text-sm">TR7N...placeholder</div>
                          </div>
                        </div>
                        <div className="text-green-400 text-sm">Connected</div>
                      </div>
                    </div>
                  </div>

                  <div className="border border-white/10 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Account Verification</h3>
                    <div className="flex items-center space-x-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                      <div>
                        <div className="text-green-400 font-medium">Account Verified</div>
                        <div className="text-gray-400 text-sm">Your account is fully verified for trading</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Status */}
            {saveStatus === 'success' && (
              <div className="mt-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center text-green-400">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Settings saved successfully!
                </div>
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                <div className="flex items-center text-red-400">
                  <XCircle className="w-5 h-5 mr-2" />
                  Failed to save settings. Please try again.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </ProtectedRoute>
  );
}