'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/lib/auth-store';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { TranslationKey } from '@/lib/translations';
import {
  User,
  Lock,
  Bell,
  Shield,
  Eye,
  EyeOff,
  Save,
  Building2,
  Mail,
  Phone,
  Globe,
  CheckCircle2,
  Moon,
  Sun,
  Languages,
  FileDown,
  Trash2,
  Key,
  Smartphone,
  History,
  DollarSign,
  FileText,
  Settings as SettingsIcon,
  AlertCircle,
} from 'lucide-react';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  specialization?: string;
  qualification?: string;
  licenseNumber?: string;
  department?: string;
}

export default function SettingsPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'ACCOUNTANT', 'PHARMACIST', 'LAB_TECHNICIAN', 'RADIOLOGIST', 'PATIENT']}>
      <Settings />
    </ProtectedRoute>
  );
}

function Settings() {
  const { user, token, updateUser } = useAuthStore();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile State
  const [profile, setProfile] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
  });

  // Password State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    prescriptionAlerts: true,
    labResultAlerts: true,
    billingAlerts: true,
    lowStockAlerts: true,
  });

  // System Settings (Admin only)
  const [systemSettings, setSystemSettings] = useState({
    hospitalName: 'Hospital CRM',
    hospitalEmail: 'info@hospitalcrm.com',
    hospitalPhone: '+91-1234567890',
    hospitalAddress: '123 Medical Center, Healthcare City',
    taxRate: 5,
    currency: 'INR',
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    loginAlertsEnabled: true,
    sessionTimeout: 30,
  });

  // 2FA State
  const [twoFactorSetup, setTwoFactorSetup] = useState<{
    qrCode: string | null;
    secret: string | null;
    verificationCode: string;
    showQR: boolean;
  }>({
    qrCode: null,
    secret: null,
    verificationCode: '',
    showQR: false,
  });
  const [disableTwoFactorPassword, setDisableTwoFactorPassword] = useState('');

  // Appearance Settings
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'light',
    fontSize: 'medium',
    language: 'en',
  });

  // Privacy Settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'staff',
    showEmail: true,
    showPhone: false,
    dataSharing: false,
  });

  // Billing Configuration
  const [billingConfig, setBillingConfig] = useState({
    invoicePrefix: 'INV',
    invoiceStartNumber: 1001,
    paymentTerms: 30,
    lateFeePercentage: 2,
    enableDiscounts: true,
    maxDiscountPercentage: 20,
  });

  // Prescription Settings
  const [prescriptionSettings, setPrescriptionSettings] = useState({
    defaultConsultationFee: 500,
    prescriptionTemplate: 'standard',
    includeHeader: true,
    includeFooter: true,
    defaultInstructions: 'Take as directed',
  });

  // Inventory Configuration
  const [inventoryConfig, setInventoryConfig] = useState({
    defaultReorderLevel: 50,
    lowStockThreshold: 20,
    expiryAlertDays: 90,
    autoReorder: false,
    defaultSupplier: '',
  });

  useEffect(() => {
    fetchUserProfile();
    fetchNotificationSettings();
    fetchTwoFactorStatus();
    if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') {
      fetchSystemSettings();
    }
    
    // Load and apply appearance settings on mount
    const savedAppearance = localStorage.getItem('appearanceSettings');
    if (savedAppearance) {
      const settings = JSON.parse(savedAppearance);
      setAppearanceSettings(settings);
      // Apply theme immediately
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      // Apply language immediately
      if (settings.language) {
        document.documentElement.lang = settings.language;
      }
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setProfile(data.data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchNotificationSettings = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/notifications/preferences', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    }
  };

  const fetchSystemSettings = () => {
    // Load from localStorage (in production, this would be from backend)
    const saved = localStorage.getItem('systemSettings');
    if (saved) {
      setSystemSettings(JSON.parse(saved));
    }
  };

  const fetchTwoFactorStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/security/2fa/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: data.data.enabled }));
      }
    } catch (error) {
      console.error('Error fetching 2FA status:', error);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:5000/api/v1/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        
        // Update the auth store with the new user data
        if (user) {
          const updatedUser = {
            ...user,
            firstName: profile.firstName,
            lastName: profile.lastName,
            phone: profile.phone,
          };
          updateUser(updatedUser);
        }
        
        // Fetch fresh user data from the server
        await fetchUserProfile();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating profile' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/v1/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to change password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error changing password' });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:5000/api/v1/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(notifications),
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Notification preferences saved successfully!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save preferences' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving notification preferences' });
    } finally {
      setLoading(false);
    }
  };

  const handleSystemSettingsUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('systemSettings', JSON.stringify(systemSettings));
    setMessage({ type: 'success', text: 'System settings saved!' });
  };

  const handleSecurityUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:5000/api/v1/security/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          loginAlertsEnabled: securitySettings.loginAlertsEnabled,
          sessionTimeout: securitySettings.sessionTimeout,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Security settings saved!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving security settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleEnableTwoFactor = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:5000/api/v1/security/2fa/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setTwoFactorSetup({
          qrCode: data.data.qrCode,
          secret: data.data.secret,
          verificationCode: '',
          showQR: true,
        });
        setMessage({ type: 'success', text: 'Scan the QR code with your authenticator app' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to enable 2FA' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error enabling 2FA' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTwoFactor = async () => {
    if (!twoFactorSetup.verificationCode || twoFactorSetup.verificationCode.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter a valid 6-digit code' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:5000/api/v1/security/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          token: twoFactorSetup.verificationCode,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: '2FA enabled successfully!' });
        setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: true }));
        setTwoFactorSetup({
          qrCode: null,
          secret: null,
          verificationCode: '',
          showQR: false,
        });
      } else {
        setMessage({ type: 'error', text: data.message || 'Invalid verification code' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error verifying 2FA' });
    } finally {
      setLoading(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    if (!disableTwoFactorPassword) {
      setMessage({ type: 'error', text: 'Password is required to disable 2FA' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:5000/api/v1/security/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          password: disableTwoFactorPassword,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: '2FA disabled successfully' });
        setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: false }));
        setDisableTwoFactorPassword('');
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to disable 2FA' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error disabling 2FA' });
    } finally {
      setLoading(false);
    }
  };

  const handleAppearanceUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('appearanceSettings', JSON.stringify(appearanceSettings));
    // Apply theme
    if (appearanceSettings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Apply language
    document.documentElement.lang = appearanceSettings.language;
    setMessage({ type: 'success', text: 'Appearance settings saved!' });
  };

  const handlePrivacyUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('privacySettings', JSON.stringify(privacySettings));
    setMessage({ type: 'success', text: 'Privacy settings saved!' });
  };

  const handleBillingConfigUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('billingConfig', JSON.stringify(billingConfig));
    setMessage({ type: 'success', text: 'Billing configuration saved!' });
  };

  const handlePrescriptionSettingsUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('prescriptionSettings', JSON.stringify(prescriptionSettings));
    setMessage({ type: 'success', text: 'Prescription settings saved!' });
  };

  const handleInventoryConfigUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('inventoryConfig', JSON.stringify(inventoryConfig));
    setMessage({ type: 'success', text: 'Inventory configuration saved!' });
  };

  const tabs = [
    { id: 'profile', icon: User },
    { id: 'password', icon: Lock },
    { id: 'security', icon: Shield },
    { id: 'notifications', icon: Bell },
    { id: 'appearance', icon: Sun },
    { id: 'privacy', icon: Key },
    ...(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'
      ? [
          { id: 'system', icon: Building2 },
          { id: 'billing', icon: DollarSign },
        ]
      : []),
    ...(user?.role === 'DOCTOR'
      ? [{ id: 'prescription', icon: FileText }]
      : []),
    ...(user?.role === 'PHARMACIST' || user?.role === 'ADMIN'
      ? [{ id: 'inventory', icon: SettingsIcon }]
      : []),
  ];

  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">{t('settings')}</h1>
          <p className="text-gray-600 mt-1">Manage your account and application preferences</p>
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {message.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4 space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMessage(null);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{t(tab.id as TranslationKey)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('profileSettings')}</h2>
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('firstName')}
                        </label>
                        <input
                          type="text"
                          value={profile.firstName}
                          onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('lastName')}
                        </label>
                        <input
                          type="text"
                          value={profile.lastName}
                          onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Mail className="w-4 h-4 inline mr-1" />
                          {t('email')}
                        </label>
                        <input
                          type="email"
                          value={profile.email}
                          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Phone className="w-4 h-4 inline mr-1" />
                          {t('phone')}
                        </label>
                        <input
                          type="tel"
                          value={profile.phone}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Shield className="w-4 h-4 inline mr-1" />
                        Role
                      </label>
                      <input
                        type="text"
                        value={profile.role}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                        disabled
                      />
                    </div>

                    {user?.role === 'DOCTOR' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Specialization
                          </label>
                          <input
                            type="text"
                            value={profile.specialization || ''}
                            onChange={(e) =>
                              setProfile({ ...profile, specialization: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Qualification
                          </label>
                          <input
                            type="text"
                            value={profile.qualification || ''}
                            onChange={(e) =>
                              setProfile({ ...profile, qualification: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      {loading ? 'Saving...' : t('updateProfile')}
                    </button>
                  </form>
                </div>
              )}

              {/* Password Tab */}
              {activeTab === 'password' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('passwordSettings')}</h2>
                  <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('currentPassword')}
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, currentPassword: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords({ ...showPasswords, current: !showPasswords.current })
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                          {showPasswords.current ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('newPassword')}
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, newPassword: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords({ ...showPasswords, new: !showPasswords.new })
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                          {showPasswords.new ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('confirmPassword')}
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                          {showPasswords.confirm ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
                    >
                      <Lock className="w-5 h-5" />
                      {loading ? 'Changing...' : t('changePassword')}
                    </button>
                  </form>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    <Shield className="w-6 h-6 inline mr-2" />
                    {t('securitySettings')}
                  </h2>
                  
                  {/* Two-Factor Authentication Section */}
                  <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800 flex items-center gap-2 text-lg">
                          <Smartphone className="w-5 h-5" />
                          {t('twoFactorAuthentication')}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Add an extra layer of security to your account using TOTP authenticator apps
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        securitySettings.twoFactorEnabled 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {securitySettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>

                    {!securitySettings.twoFactorEnabled && !twoFactorSetup.showQR && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-4">
                          Use an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator to generate verification codes.
                        </p>
                        <button
                          type="button"
                          onClick={handleEnableTwoFactor}
                          disabled={loading}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {loading ? 'Setting up...' : 'Enable 2FA'}
                        </button>
                      </div>
                    )}

                    {twoFactorSetup.showQR && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-800 mb-3">Setup Instructions:</h4>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 mb-4">
                          <li>Install an authenticator app on your phone</li>
                          <li>Scan the QR code below with your authenticator app</li>
                          <li>Enter the 6-digit code from the app to verify</li>
                        </ol>

                        {twoFactorSetup.qrCode && (
                          <div className="flex flex-col items-center mb-4">
                            <img src={twoFactorSetup.qrCode} alt="2FA QR Code" className="w-64 h-64 border-2 border-gray-300 rounded-lg" />
                            <p className="text-xs text-gray-500 mt-2">Or enter this code manually:</p>
                            <code className="text-xs bg-gray-100 px-3 py-1 rounded mt-1">{twoFactorSetup.secret}</code>
                          </div>
                        )}

                        <div className="flex gap-3">
                          <input
                            type="text"
                            placeholder="Enter 6-digit code"
                            maxLength={6}
                            value={twoFactorSetup.verificationCode}
                            onChange={(e) => setTwoFactorSetup(prev => ({ ...prev, verificationCode: e.target.value.replace(/\D/g, '') }))}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={handleVerifyTwoFactor}
                            disabled={loading || twoFactorSetup.verificationCode.length !== 6}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            {loading ? 'Verifying...' : 'Verify & Enable'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setTwoFactorSetup({ qrCode: null, secret: null, verificationCode: '', showQR: false })}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {securitySettings.twoFactorEnabled && (
                      <div className="mt-4 p-4 bg-red-50 rounded-lg">
                        <h4 className="font-medium text-gray-800 mb-3">Disable Two-Factor Authentication</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          Enter your password to disable 2FA. This will remove the extra security layer from your account.
                        </p>
                        <div className="flex gap-3">
                          <input
                            type="password"
                            placeholder="Enter your password"
                            value={disableTwoFactorPassword}
                            onChange={(e) => setDisableTwoFactorPassword(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={handleDisableTwoFactor}
                            disabled={loading || !disableTwoFactorPassword}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                          >
                            {loading ? 'Disabling...' : 'Disable 2FA'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Other Security Settings */}
                  <form onSubmit={handleSecurityUpdate} className="space-y-6">
                    <div className="space-y-4">
                      {/* Login Alerts */}
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            Login Alerts
                          </h3>
                          <p className="text-sm text-gray-500">
                            Get notified via email when someone logs into your account
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={securitySettings.loginAlertsEnabled}
                            onChange={(e) =>
                              setSecuritySettings({
                                ...securitySettings,
                                loginAlertsEnabled: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      {/* Session Timeout */}
                      <div className="p-4 border border-gray-200 rounded-lg bg-white">
                        <div className="flex items-center gap-2 mb-3">
                          <History className="w-5 h-5 text-gray-700" />
                          <h3 className="font-medium text-gray-800">Session Timeout</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                          Automatically log out after period of inactivity
                        </p>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="15"
                            max="120"
                            step="15"
                            value={securitySettings.sessionTimeout}
                            onChange={(e) =>
                              setSecuritySettings({
                                ...securitySettings,
                                sessionTimeout: parseInt(e.target.value),
                              })
                            }
                            className="flex-1"
                          />
                          <span className="text-sm font-medium text-gray-700 min-w-[80px]">
                            {securitySettings.sessionTimeout} minutes
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      {loading ? 'Saving...' : 'Save Security Settings'}
                    </button>
                  </form>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    {t('notificationPreferences')}
                  </h2>
                  <form onSubmit={handleNotificationUpdate} className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-800">{t('emailNotifications')}</h3>
                          <p className="text-sm text-gray-500">Receive notifications via email</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications.emailNotifications}
                            onChange={(e) =>
                              setNotifications({
                                ...notifications,
                                emailNotifications: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-800">{t('smsNotifications')}</h3>
                          <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications.smsNotifications}
                            onChange={(e) =>
                              setNotifications({
                                ...notifications,
                                smsNotifications: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-800">{t('appointmentReminders')}</h3>
                          <p className="text-sm text-gray-500">
                            Get reminded about upcoming appointments
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications.appointmentReminders}
                            onChange={(e) =>
                              setNotifications({
                                ...notifications,
                                appointmentReminders: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-800">{t('prescriptionAlerts')}</h3>
                          <p className="text-sm text-gray-500">
                            Notifications about new prescriptions
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications.prescriptionAlerts}
                            onChange={(e) =>
                              setNotifications({
                                ...notifications,
                                prescriptionAlerts: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-800">{t('labResultAlerts')}</h3>
                          <p className="text-sm text-gray-500">
                            Get notified when lab results are ready
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications.labResultAlerts}
                            onChange={(e) =>
                              setNotifications({
                                ...notifications,
                                labResultAlerts: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-800">{t('billingAlerts')}</h3>
                          <p className="text-sm text-gray-500">
                            Notifications about pending payments
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications.billingAlerts}
                            onChange={(e) =>
                              setNotifications({
                                ...notifications,
                                billingAlerts: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      {(user?.role === 'PHARMACIST' || user?.role === 'ADMIN') && (
                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div>
                            <h3 className="font-medium text-gray-800">{t('lowStockAlerts')}</h3>
                            <p className="text-sm text-gray-500">
                              Get notified when medication stock is low
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notifications.lowStockAlerts}
                              onChange={(e) =>
                                setNotifications({
                                  ...notifications,
                                  lowStockAlerts: e.target.checked,
                                })
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-5 h-5" />
                      {loading ? 'Saving...' : t('savePreferences')}
                    </button>
                  </form>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    <Sun className="w-6 h-6 inline mr-2" />
                    {t('appearance')}
                  </h2>
                  <form onSubmit={handleAppearanceUpdate} className="space-y-6">
                    {/* Theme */}
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                        {appearanceSettings.theme === 'dark' ? (
                          <Moon className="w-5 h-5" />
                        ) : (
                          <Sun className="w-5 h-5" />
                        )}
                        {t('theme')}
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setAppearanceSettings({ ...appearanceSettings, theme: 'light' });
                            document.documentElement.classList.remove('dark');
                            localStorage.setItem('theme', 'light');
                            localStorage.setItem('appearanceSettings', JSON.stringify({ ...appearanceSettings, theme: 'light' }));
                          }}
                          className={`p-4 border-2 rounded-lg flex items-center justify-center gap-2 transition ${
                            appearanceSettings.theme === 'light'
                              ? 'border-blue-600 bg-blue-600 text-white font-semibold'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <Sun className="w-5 h-5" />
                          {t('light')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAppearanceSettings({ ...appearanceSettings, theme: 'dark' });
                            document.documentElement.classList.add('dark');
                            localStorage.setItem('theme', 'dark');
                            localStorage.setItem('appearanceSettings', JSON.stringify({ ...appearanceSettings, theme: 'dark' }));
                          }}
                          className={`p-4 border-2 rounded-lg flex items-center justify-center gap-2 transition ${
                            appearanceSettings.theme === 'dark'
                              ? 'border-blue-600 bg-blue-600 text-white font-semibold'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <Moon className="w-5 h-5" />
                          {t('dark')}
                        </button>
                      </div>
                    </div>

                    {/* Font Size */}
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h3 className="font-medium text-gray-800 mb-3">{t('fontSize')}</h3>
                      <div className="grid grid-cols-3 gap-3">
                        {['small', 'medium', 'large'].map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() =>
                              setAppearanceSettings({ ...appearanceSettings, fontSize: size })
                            }
                            className={`p-3 border-2 rounded-lg transition capitalize ${
                              appearanceSettings.fontSize === size
                                ? 'border-blue-600 bg-blue-600 text-white font-semibold'
                                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                            }`}
                          >
                            {t(size as any)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Language */}
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                        <Languages className="w-5 h-5" />
                        {t('language')}
                      </h3>
                      <select
                        value={appearanceSettings.language}
                        onChange={(e) => {
                          const newLanguage = e.target.value;
                          setAppearanceSettings({ ...appearanceSettings, language: newLanguage });
                          // Apply language immediately
                          document.documentElement.lang = newLanguage;
                          localStorage.setItem('appearanceSettings', JSON.stringify({ ...appearanceSettings, language: newLanguage }));
                          // Trigger custom event for same-tab updates
                          window.dispatchEvent(new Event('languageChange'));
                          setMessage({ type: 'success', text: `${t('languageChanged')} ${e.target.options[e.target.selectedIndex].text}` });
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish (Español)</option>
                        <option value="fr">French (Français)</option>
                        <option value="de">German (Deutsch)</option>
                        <option value="hi">Hindi (हिन्दी)</option>
                      </select>
                      <p className="text-sm text-gray-500 mt-3">
                        <span className="font-medium">Note:</span> Language preference applied to interface elements.
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      {t('saveAppearanceSettings')}
                    </button>
                  </form>
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    <Key className="w-6 h-6 inline mr-2" />
                    Privacy Settings
                  </h2>
                  <form onSubmit={handlePrivacyUpdate} className="space-y-6">
                    {/* Profile Visibility */}
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h3 className="font-medium text-gray-800 mb-3">Profile Visibility</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Control who can see your profile information
                      </p>
                      <div className="space-y-2">
                        {[
                          { value: 'public', label: 'Public', desc: 'Anyone can view' },
                          { value: 'staff', label: 'Staff Only', desc: 'Only hospital staff' },
                          { value: 'private', label: 'Private', desc: 'Only you' },
                        ].map((option) => (
                          <label
                            key={option.value}
                            className="flex items-start p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                          >
                            <input
                              type="radio"
                              name="profileVisibility"
                              value={option.value}
                              checked={privacySettings.profileVisibility === option.value}
                              onChange={(e) =>
                                setPrivacySettings({
                                  ...privacySettings,
                                  profileVisibility: e.target.value,
                                })
                              }
                              className="mt-1 mr-3"
                            />
                            <div>
                              <div className="font-medium text-gray-800">{option.label}</div>
                              <div className="text-sm text-gray-500">{option.desc}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Contact Information Visibility */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-800 flex items-center gap-2">
                            <Mail className="w-5 h-5" />
                            Show Email Address
                          </h3>
                          <p className="text-sm text-gray-500">
                            Display your email in your public profile
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={privacySettings.showEmail}
                            onChange={(e) =>
                              setPrivacySettings({
                                ...privacySettings,
                                showEmail: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-800 flex items-center gap-2">
                            <Phone className="w-5 h-5" />
                            Show Phone Number
                          </h3>
                          <p className="text-sm text-gray-500">
                            Display your phone number in your public profile
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={privacySettings.showPhone}
                            onChange={(e) =>
                              setPrivacySettings({
                                ...privacySettings,
                                showPhone: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>

                    {/* Data Sharing */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-800">Data Sharing</h3>
                        <p className="text-sm text-gray-500">
                          Allow anonymous usage data for service improvement
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.dataSharing}
                          onChange={(e) =>
                            setPrivacySettings({
                              ...privacySettings,
                              dataSharing: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      Save Privacy Settings
                    </button>
                  </form>
                </div>
              )}

              {/* System Settings Tab (Admin only) */}
              {activeTab === 'system' &&
                (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">System Settings</h2>
                    <form onSubmit={handleSystemSettingsUpdate} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Building2 className="w-4 h-4 inline mr-1" />
                            Hospital Name
                          </label>
                          <input
                            type="text"
                            value={systemSettings.hospitalName}
                            onChange={(e) =>
                              setSystemSettings({ ...systemSettings, hospitalName: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Mail className="w-4 h-4 inline mr-1" />
                            Hospital Email
                          </label>
                          <input
                            type="email"
                            value={systemSettings.hospitalEmail}
                            onChange={(e) =>
                              setSystemSettings({
                                ...systemSettings,
                                hospitalEmail: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Phone className="w-4 h-4 inline mr-1" />
                            Hospital Phone
                          </label>
                          <input
                            type="tel"
                            value={systemSettings.hospitalPhone}
                            onChange={(e) =>
                              setSystemSettings({
                                ...systemSettings,
                                hospitalPhone: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Globe className="w-4 h-4 inline mr-1" />
                            Currency
                          </label>
                          <select
                            value={systemSettings.currency}
                            onChange={(e) =>
                              setSystemSettings({ ...systemSettings, currency: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="INR">INR (₹)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hospital Address
                        </label>
                        <textarea
                          value={systemSettings.hospitalAddress}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              hospitalAddress: e.target.value,
                            })
                          }
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tax Rate (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={systemSettings.taxRate}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              taxRate: parseFloat(e.target.value),
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Default tax rate applied to all invoices
                        </p>
                      </div>

                      <button
                        type="submit"
                        className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                      >
                        <Save className="w-5 h-5" />
                        Save System Settings
                      </button>
                    </form>
                  </div>
                )}

              {/* Billing Configuration Tab (Admin/Accountant only) */}
              {activeTab === 'billing-config' &&
                (user?.role === 'SUPER_ADMIN' ||
                  user?.role === 'ADMIN' ||
                  user?.role === 'ACCOUNTANT') && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                      <DollarSign className="w-6 h-6 inline mr-2" />
                      Billing Configuration
                    </h2>
                    <form onSubmit={handleBillingConfigUpdate} className="space-y-6">
                      {/* Invoice Settings */}
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <h3 className="font-medium text-gray-800 mb-4">Invoice Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Invoice Prefix
                            </label>
                            <input
                              type="text"
                              value={billingConfig.invoicePrefix}
                              onChange={(e) =>
                                setBillingConfig({
                                  ...billingConfig,
                                  invoicePrefix: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="INV"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Example: INV-1001, INV-1002
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Starting Invoice Number
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={billingConfig.invoiceStartNumber}
                              onChange={(e) =>
                                setBillingConfig({
                                  ...billingConfig,
                                  invoiceStartNumber: parseInt(e.target.value),
                                })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Payment Terms */}
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <h3 className="font-medium text-gray-800 mb-4">Payment Terms</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Default Payment Terms (Days)
                            </label>
                            <select
                              value={billingConfig.paymentTerms}
                              onChange={(e) =>
                                setBillingConfig({
                                  ...billingConfig,
                                  paymentTerms: parseInt(e.target.value),
                                })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="0">Due Immediately</option>
                              <option value="7">Net 7 Days</option>
                              <option value="15">Net 15 Days</option>
                              <option value="30">Net 30 Days</option>
                              <option value="60">Net 60 Days</option>
                              <option value="90">Net 90 Days</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Late Fee Percentage
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.5"
                              value={billingConfig.lateFeePercentage}
                              onChange={(e) =>
                                setBillingConfig({
                                  ...billingConfig,
                                  lateFeePercentage: parseFloat(e.target.value),
                                })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Applied to overdue invoices per month
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Discount Settings */}
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <h3 className="font-medium text-gray-800 mb-4">Discount Settings</h3>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="font-medium text-gray-800">Enable Discounts</p>
                            <p className="text-sm text-gray-500">
                              Allow staff to apply discounts to invoices
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={billingConfig.enableDiscounts}
                              onChange={(e) =>
                                setBillingConfig({
                                  ...billingConfig,
                                  enableDiscounts: e.target.checked,
                                })
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        {billingConfig.enableDiscounts && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Maximum Discount Percentage
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="5"
                              value={billingConfig.maxDiscountPercentage}
                              onChange={(e) =>
                                setBillingConfig({
                                  ...billingConfig,
                                  maxDiscountPercentage: parseInt(e.target.value),
                                })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                      >
                        <Save className="w-5 h-5" />
                        Save Billing Configuration
                      </button>
                    </form>
                  </div>
                )}

              {/* Prescription Settings Tab (Doctor only) */}
              {activeTab === 'prescription-settings' && user?.role === 'DOCTOR' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    <FileText className="w-6 h-6 inline mr-2" />
                    Prescription Settings
                  </h2>
                  <form onSubmit={handlePrescriptionSettingsUpdate} className="space-y-6">
                    {/* Consultation Fee */}
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h3 className="font-medium text-gray-800 mb-4">
                        Consultation Fee Settings
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Default Consultation Fee
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={prescriptionSettings.defaultConsultationFee}
                            onChange={(e) =>
                              setPrescriptionSettings({
                                ...prescriptionSettings,
                                defaultConsultationFee: parseInt(e.target.value),
                              })
                            }
                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          This amount will be pre-filled when creating prescriptions
                        </p>
                      </div>
                    </div>

                    {/* Prescription Template */}
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h3 className="font-medium text-gray-800 mb-4">
                        Prescription Template
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Template Style
                        </label>
                        <select
                          value={prescriptionSettings.prescriptionTemplate}
                          onChange={(e) =>
                            setPrescriptionSettings({
                              ...prescriptionSettings,
                              prescriptionTemplate: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="standard">Standard</option>
                          <option value="detailed">Detailed with Instructions</option>
                          <option value="minimal">Minimal</option>
                          <option value="custom">Custom Template</option>
                        </select>
                      </div>
                    </div>

                    {/* Header and Footer */}
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h3 className="font-medium text-gray-800 mb-4">
                        Prescription Format
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-800">Include Header</p>
                            <p className="text-sm text-gray-500">
                              Show hospital name and logo at the top
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={prescriptionSettings.includeHeader}
                              onChange={(e) =>
                                setPrescriptionSettings({
                                  ...prescriptionSettings,
                                  includeHeader: e.target.checked,
                                })
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-800">Include Footer</p>
                            <p className="text-sm text-gray-500">
                              Show contact info and legal text at the bottom
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={prescriptionSettings.includeFooter}
                              onChange={(e) =>
                                setPrescriptionSettings({
                                  ...prescriptionSettings,
                                  includeFooter: e.target.checked,
                                })
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Default Instructions */}
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h3 className="font-medium text-gray-800 mb-4">
                        Default Instructions
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Default Medication Instructions
                        </label>
                        <textarea
                          value={prescriptionSettings.defaultInstructions}
                          onChange={(e) =>
                            setPrescriptionSettings({
                              ...prescriptionSettings,
                              defaultInstructions: e.target.value,
                            })
                          }
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter default instructions for medications..."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          This text will be pre-filled when adding medications
                        </p>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      Save Prescription Settings
                    </button>
                  </form>
                </div>
              )}

              {/* Inventory Configuration Tab (Pharmacist/Admin only) */}
              {activeTab === 'inventory-config' &&
                (user?.role === 'PHARMACIST' ||
                  user?.role === 'ADMIN' ||
                  user?.role === 'SUPER_ADMIN') && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                      <SettingsIcon className="w-6 h-6 inline mr-2" />
                      Inventory Configuration
                    </h2>
                    <form onSubmit={handleInventoryConfigUpdate} className="space-y-6">
                      {/* Stock Levels */}
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <h3 className="font-medium text-gray-800 mb-4">Stock Level Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Default Reorder Level
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={inventoryConfig.defaultReorderLevel}
                              onChange={(e) =>
                                setInventoryConfig({
                                  ...inventoryConfig,
                                  defaultReorderLevel: parseInt(e.target.value),
                                })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Trigger reorder when stock reaches this level
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Low Stock Alert Threshold
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={inventoryConfig.lowStockThreshold}
                              onChange={(e) =>
                                setInventoryConfig({
                                  ...inventoryConfig,
                                  lowStockThreshold: parseInt(e.target.value),
                                })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Show warning when stock falls below this
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Expiry Alerts */}
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <h3 className="font-medium text-gray-800 mb-4">Expiry Management</h3>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Expiry Alert (Days Before)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="365"
                            step="15"
                            value={inventoryConfig.expiryAlertDays}
                            onChange={(e) =>
                              setInventoryConfig({
                                ...inventoryConfig,
                                expiryAlertDays: parseInt(e.target.value),
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Alert when medications are within this many days of expiring
                          </p>
                        </div>
                      </div>

                      {/* Auto Reorder */}
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <h3 className="font-medium text-gray-800 mb-4">
                          Automatic Reorder Settings
                        </h3>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="font-medium text-gray-800">Enable Auto Reorder</p>
                            <p className="text-sm text-gray-500">
                              Automatically create purchase orders when stock is low
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={inventoryConfig.autoReorder}
                              onChange={(e) =>
                                setInventoryConfig({
                                  ...inventoryConfig,
                                  autoReorder: e.target.checked,
                                })
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        {inventoryConfig.autoReorder && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Default Supplier
                            </label>
                            <input
                              type="text"
                              value={inventoryConfig.defaultSupplier}
                              onChange={(e) =>
                                setInventoryConfig({
                                  ...inventoryConfig,
                                  defaultSupplier: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter default supplier name"
                            />
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                      >
                        <Save className="w-5 h-5" />
                        Save Inventory Configuration
                      </button>
                    </form>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
