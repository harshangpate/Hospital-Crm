'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  Mail, 
  Send, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Users,
  Calendar,
  FileText,
  Key,
  UserCheck,
  Settings,
  Bell
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  requiresRecipient: boolean;
}

export default function EmailTestPage() {
  const [recipients, setRecipients] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const emailTemplates: EmailTemplate[] = [
    {
      id: 'appointment-confirmation',
      name: 'Appointment Confirmation',
      description: 'Send confirmation for new/upcoming appointments',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
      requiresRecipient: true,
    },
    {
      id: 'appointment-reminder',
      name: 'Appointment Reminder',
      description: 'Remind patients about upcoming appointments',
      icon: Bell,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 border-orange-200',
      requiresRecipient: true,
    },
    {
      id: 'appointment-cancellation',
      name: 'Appointment Cancellation',
      description: 'Notify patients about cancelled appointments',
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 border-red-200',
      requiresRecipient: true,
    },
    {
      id: 'appointment-rescheduled',
      name: 'Appointment Rescheduled',
      description: 'Notify patients about rescheduled appointments',
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-200',
      requiresRecipient: true,
    },
    {
      id: 'welcome',
      name: 'Welcome Email',
      description: 'Send welcome message to new users',
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200',
      requiresRecipient: true,
    },
    {
      id: 'password-reset',
      name: 'Password Reset',
      description: 'Send password reset instructions',
      icon: Key,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 border-yellow-200',
      requiresRecipient: true,
    },
    {
      id: 'account-status',
      name: 'Account Status Change',
      description: 'Notify users about account status changes',
      icon: Settings,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 border-indigo-200',
      requiresRecipient: true,
    },
    {
      id: 'custom',
      name: 'Custom Email',
      description: 'Send custom email with your own content',
      icon: Mail,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 border-gray-200',
      requiresRecipient: true,
    },
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/v1/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        const usersArray = data.data?.users || data.data || [];
        setUsers(usersArray);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const addRecipient = (email: string) => {
    if (email && !recipients.includes(email)) {
      setRecipients([...recipients, email]);
      setRecipientInput('');
    }
  };

  const removeRecipient = (email: string) => {
    setRecipients(recipients.filter((r) => r !== email));
  };

  const addMultipleRecipients = (emails: string[]) => {
    const newRecipients = [...recipients];
    emails.forEach((email) => {
      if (!newRecipients.includes(email)) {
        newRecipients.push(email);
      }
    });
    setRecipients(newRecipients);
  };

  const sendEmail = async () => {
    if (recipients.length === 0) {
      alert('Please add at least one recipient');
      return;
    }

    if (!selectedTemplate) {
      alert('Please select an email template');
      return;
    }

    if (selectedTemplate === 'custom' && (!subject || !message)) {
      alert('Please provide subject and message for custom email');
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/v1/email/send-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipients,
          template: selectedTemplate,
          subject: subject || undefined,
          message: message || undefined,
        }),
      });

      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        // Clear form on success
        setRecipients([]);
        setSubject('');
        setMessage('');
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to send email. Check server connection.',
      });
    }

    setSending(false);
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <DashboardLayout>
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-xl">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              Email System & Test
            </h1>
            <p className="text-gray-600">
              Test email templates and send notifications to users
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Email Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Select Template */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-blue-600" />
                  Select Email Template
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {emailTemplates.map((template) => {
                    const Icon = template.icon;
                    return (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          selectedTemplate === template.id
                            ? `${template.bgColor} border-current ring-2 ring-offset-2`
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className={`w-6 h-6 ${template.color} shrink-0`} />
                          <div>
                            <h3 className="font-semibold text-gray-900 text-sm">
                              {template.name}
                            </h3>
                            <p className="text-xs text-gray-600 mt-1">
                              {template.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recipients */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-600" />
                  Recipients
                </h2>

                {/* Quick Add Buttons */}
                <div className="mb-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => addMultipleRecipients(users.filter(u => u.role === 'PATIENT').map(u => u.email))}
                    className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200"
                  >
                    + All Patients ({users.filter(u => u.role === 'PATIENT').length})
                  </button>
                  <button
                    onClick={() => addMultipleRecipients(users.filter(u => u.role === 'DOCTOR').map(u => u.email))}
                    className="px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200"
                  >
                    + All Doctors ({users.filter(u => u.role === 'DOCTOR').length})
                  </button>
                  <button
                    onClick={() => addMultipleRecipients(users.filter(u => u.role !== 'PATIENT').map(u => u.email))}
                    className="px-3 py-1.5 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 border border-purple-200"
                  >
                    + All Staff ({users.filter(u => u.role !== 'PATIENT').length})
                  </button>
                </div>

                {/* Add Individual Email */}
                <div className="mb-4">
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={recipientInput}
                      onChange={(e) => setRecipientInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addRecipient(recipientInput)}
                      placeholder="Enter email address"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={() => addRecipient(recipientInput)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Recipients List */}
                {recipients.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {recipients.length} recipient{recipients.length > 1 ? 's' : ''}:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {recipients.map((email) => (
                        <span
                          key={email}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 rounded-full text-sm"
                        >
                          {email}
                          <button
                            onClick={() => removeRecipient(email)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Content (only for custom template) */}
              {selectedTemplate === 'custom' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Custom Email Content
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Email subject"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Email message content"
                        rows={6}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Send Button */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <button
                  onClick={sendEmail}
                  disabled={sending || recipients.length === 0 || !selectedTemplate}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-semibold"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Sending Emails...
                    </>
                  ) : (
                    <>
                      <Send className="w-6 h-6" />
                      Send {recipients.length > 0 ? `to ${recipients.length} recipient${recipients.length > 1 ? 's' : ''}` : 'Email'}
                    </>
                  )}
                </button>

                {result && (
                  <div
                    className={`mt-4 p-4 rounded-lg border ${
                      result.success
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <p
                        className={`font-medium ${
                          result.success ? 'text-green-900' : 'text-red-900'
                        }`}
                      >
                        {result.message}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Info & Stats */}
            <div className="space-y-6">
              {/* Email Configuration */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  Configuration
                </h2>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Email Service:</span>
                    <span className="font-medium text-gray-900">Nodemailer</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">SMTP Host:</span>
                    <span className="font-medium text-gray-900">Gmail</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Port:</span>
                    <span className="font-medium text-gray-900">587 (TLS)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Templates:</span>
                    <span className="font-medium text-gray-900">8 Available</span>
                  </div>
                </div>
              </div>

              {/* System Stats */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                <h3 className="text-lg font-semibold mb-4">System Users</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Total Users:</span>
                    <span className="text-2xl font-bold">{users.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Patients:</span>
                    <span className="text-xl font-bold">
                      {users.filter((u) => u.role === 'PATIENT').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Doctors:</span>
                    <span className="text-xl font-bold">
                      {users.filter((u) => u.role === 'DOCTOR').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Staff:</span>
                    <span className="text-xl font-bold">
                      {users.filter((u) => u.role !== 'PATIENT' && u.role !== 'DOCTOR').length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <h3 className="font-semibold text-yellow-900 mb-3">💡 Tips</h3>
                <ul className="space-y-2 text-sm text-yellow-800">
                  <li>• Test with your own email first</li>
                  <li>• Check spam folder if not received</li>
                  <li>• Configure Gmail App Password in .env</li>
                  <li>• Templates use real hospital data</li>
                  <li>• Emails are sent asynchronously</li>
                </ul>
              </div>

              {/* Integration Status */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Integration Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-700">Appointment emails</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-700">Bulk email sending</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-700">Custom templates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-yellow-600 text-xs">!</span>
                    </div>
                    <span className="text-sm text-gray-700">Invoice emails (Soon)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
