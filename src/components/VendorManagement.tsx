'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, User, Mail, ExternalLink, Check, Send, Users } from 'lucide-react';
import Link from 'next/link';

interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  status: string;
  bio?: string;
  website?: string;
  serviceArea?: string;
  acceptsStripe?: boolean;
  acceptsVenmo?: boolean;
  acceptsCashApp?: boolean;
  acceptsZelle?: boolean;
  stripeAccountId?: string;
  venmoHandle?: string;
  cashAppHandle?: string;
  zelleContact?: string;
  weddingsWorked: number;
  weddingsWithCoordinator: number;
  totalWeddings: number;
  completedTips: number;
}

interface WeddingVendor {
  id: string;
  vendor: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    role: string;
    acceptsStripe?: boolean;
    acceptsVenmo?: boolean;
    acceptsCashApp?: boolean;
    acceptsZelle?: boolean;
    stripeAccountId?: string;
    venmoHandle?: string;
    cashAppHandle?: string;
    zelleContact?: string;
  };
  serviceHours?: number;
  serviceRate?: number;
  customTipAmount?: number;
  notes?: string;
}

interface VendorManagementProps {
  weddingId: string;
  coordinatorId: string;
  currentVendors: WeddingVendor[];
  onVendorAdded: () => void;
}

const VENDOR_ROLES = [
  { value: 'ALL', label: 'All Roles' },
  { value: 'OFFICIANT', label: 'Officiant', emoji: '👨‍💼' },
  { value: 'COORDINATOR', label: 'Coordinator', emoji: '📋' },
  { value: 'SETUP_ATTENDANT', label: 'Setup Team', emoji: '🔧' },
  { value: 'PHOTOGRAPHER', label: 'Photographer', emoji: '📸' },
];

export default function VendorManagement({ 
  weddingId, 
  coordinatorId, 
  currentVendors, 
  onVendorAdded 
}: VendorManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [searchResults, setSearchResults] = useState<Vendor[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'search' | 'roster' | 'invite'>('roster');
  const [rosterVendors, setRosterVendors] = useState<Vendor[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    vendorName: '',
    role: 'OFFICIANT',
    message: ''
  });

  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteResult, setInviteResult] = useState<{
    type: string;
    message: string;
    registrationUrl?: string;
    actionRequired?: string;
  } | null>(null);

  // Search for vendors
  const searchVendors = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        role: selectedRole,
        coordinatorId
      });

      const response = await fetch(`/api/coordinator/vendors/search?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.vendors || []);
      }
    } catch (error) {
      console.error('Error searching vendors:', error);
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery, selectedRole, coordinatorId]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchVendors();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedRole, coordinatorId, searchVendors]);

  // Load vendor roster
  const loadRosterVendors = useCallback(async () => {
    setRosterLoading(true);
    try {
      const response = await fetch(`/api/coordinator/vendors?coordinatorId=${coordinatorId}`);
      if (response.ok) {
        const data = await response.json();
        // Filter out vendors that are already added to this wedding
        const availableVendors = (data.vendors || []).filter((vendor: Vendor) => 
          !currentVendors.some(cv => cv.vendor.id === vendor.id) && 
          vendor.status === 'ACTIVE'
        );
        setRosterVendors(availableVendors);
      }
    } catch (error) {
      console.error('Error loading roster vendors:', error);
    } finally {
      setRosterLoading(false);
    }
  }, [coordinatorId, currentVendors]);

  // Load roster when component mounts or when switching to roster tab
  useEffect(() => {
    if (activeTab === 'roster') {
      loadRosterVendors();
    }
  }, [activeTab, loadRosterVendors]);

  const addExistingVendor = async (vendorId: string) => {
    try {
      const response = await fetch('/api/coordinator/vendors/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weddingId, vendorId })
      });

      if (response.ok) {
        onVendorAdded();
        // Refresh roster to remove newly added vendor
        loadRosterVendors();
      }
    } catch (error) {
      console.error('Error adding vendor:', error);
    }
  };

  const sendInvitation = async () => {
    if (!inviteForm.email || !inviteForm.vendorName) return;
    
    setInviteLoading(true);
    try {
      const response = await fetch('/api/coordinator/vendors/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...inviteForm,
          weddingId,
          coordinatorId
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.type === 'existing_vendor_added') {
          onVendorAdded();
          setInviteForm({ email: '', vendorName: '', role: 'OFFICIANT', message: '' });
        } else if (data.type === 'invitation_created_email_skipped') {
          setInviteResult({
            type: data.type,
            message: data.message,
            registrationUrl: data.registrationUrl,
            actionRequired: data.actionRequired
          });
          setInviteForm({ email: '', vendorName: '', role: 'OFFICIANT', message: '' });
        } else {
          setInviteResult({
            type: data.type,
            message: data.message
          });
          setInviteForm({ email: '', vendorName: '', role: 'OFFICIANT', message: '' });
        }
      } else {
        const errorData = await response.json();
        console.error('Invitation failed:', errorData);
        alert(`Failed to send invitation: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('An error occurred while sending the invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const isVendorAdded = (vendorId: string) => {
    return currentVendors.some(wv => wv.vendor.id === vendorId);
  };

  const getRoleEmoji = (role: string) => {
    const roleInfo = VENDOR_ROLES.find(r => r.value === role);
    return (roleInfo && 'emoji' in roleInfo) ? roleInfo.emoji : '💼';
  };

  const copyRegistrationUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const getPaymentIcon = (method: string) => {
    switch(method) {
      case 'VENMO': return '💜';
      case 'CASHAPP': return '💚';
      case 'STRIPE': return '💳';
      case 'ZELLE': return '⚡';
      default: return '💳';
    }
  };

  const getVendorPaymentMethods = (vendor: Vendor) => {
    const methods = [];
    if (vendor.acceptsStripe) {
      methods.push({ icon: '💳', name: 'Credit Card' });
    }
    if (vendor.acceptsVenmo && vendor.venmoHandle) {
      methods.push({ icon: '💜', name: vendor.venmoHandle });
    }
    if (vendor.acceptsCashApp && vendor.cashAppHandle) {
      methods.push({ icon: '💚', name: vendor.cashAppHandle });
    }
    if (vendor.acceptsZelle && vendor.zelleContact) {
      methods.push({ icon: '⚡', name: vendor.zelleContact });
    }
    return methods;
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('roster')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'roster' 
                ? 'text-purple-600 bg-purple-50 border-b-2 border-purple-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            My Vendor Roster
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'search' 
                ? 'text-purple-600 bg-purple-50 border-b-2 border-purple-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Search className="h-4 w-4 inline mr-2" />
            Search Platform
          </button>
          <button
            onClick={() => setActiveTab('invite')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'invite' 
                ? 'text-purple-600 bg-purple-50 border-b-2 border-purple-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Plus className="h-4 w-4 inline mr-2" />
            Invite New Vendor
          </button>
        </div>

        {/* Roster Tab */}
        {activeTab === 'roster' && (
          <div className="p-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Your Vendor Roster</h3>
              <p className="text-sm text-gray-600">
                Add vendors from your roster that you&apos;ve worked with before. 
                <Link href="/coordinator/vendors" className="text-purple-600 hover:underline ml-1">
                  Manage full roster →
                </Link>
              </p>
            </div>

            {rosterLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : rosterVendors.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No available vendors in your roster.</p>
                <p className="text-sm text-gray-400">
                  <Link href="/coordinator/vendors" className="text-purple-600 hover:underline">
                    Add vendors to your roster
                  </Link> to quickly add them to weddings.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {rosterVendors.map((vendor) => (
                  <div key={vendor.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">
                        {getRoleEmoji(vendor.role)}
                      </span>
                      <div>
                        <h4 className="font-medium text-gray-800">{vendor.name}</h4>
                        <div className="text-sm text-gray-500">
                          <p className="text-purple-600">{VENDOR_ROLES.find(r => r.value === vendor.role)?.label}</p>
                          {vendor.email && <p>📧 {vendor.email}</p>}
                          {vendor.serviceArea && <p>📍 {vendor.serviceArea}</p>}
                          {vendor.totalWeddings > 0 && (
                            <p className="text-xs">✨ {vendor.totalWeddings} weddings, {vendor.weddingsWithCoordinator} with you</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => addExistingVendor(vendor.id)}
                      className="inline-flex items-center bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="p-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Search Platform Vendors</h3>
              <p className="text-sm text-gray-600">
                Search for vendors across the platform who have worked with other coordinators.
              </p>
            </div>
        
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Search by name, email, or location..."
                />
              </div>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {VENDOR_ROLES.map(role => (
                  <option key={role.value} value={role.value}>
                    {'emoji' in role && role.emoji ? `${role.emoji} ` : ''}{role.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Results */}
            {searchLoading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto"></div>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-3">
                {searchResults.map(vendor => (
                  <div key={vendor.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getRoleEmoji(vendor.role)}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-800">{vendor.name}</h4>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                            {vendor.role.replace('_', ' ').toLowerCase()}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          {vendor.email && (
                            <span className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {vendor.email}
                            </span>
                          )}
                          {vendor.serviceArea && (
                            <span>📍 {vendor.serviceArea}</span>
                          )}
                          <div className="flex items-center flex-wrap gap-2">
                            {getVendorPaymentMethods(vendor).map((method, index) => (
                              <span key={index} className="flex items-center">
                                <span className="mr-1">{method.icon}</span>
                                <span className="text-xs">{method.name}</span>
                              </span>
                            ))}
                            {getVendorPaymentMethods(vendor).length === 0 && (
                              <span className="text-xs text-gray-400">No payment methods</span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {vendor.weddingsWorked} weddings • {vendor.weddingsWithCoordinator} with you
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {vendor.website && (
                        <a 
                          href={vendor.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      
                      {isVendorAdded(vendor.id) ? (
                        <div className="flex items-center text-green-600 text-sm">
                          <Check className="h-4 w-4 mr-1" />
                          Added
                        </div>
                      ) : (
                        <button
                          onClick={() => addExistingVendor(vendor.id)}
                          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Add to Wedding
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchQuery && !searchLoading && searchResults.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No vendors found matching &quot;{searchQuery}&quot;</p>
                <p className="text-sm">Try a different search term or invite a new vendor.</p>
              </div>
            )}
          </div>
        )}

        {/* Invite New Vendor Tab */}
        {activeTab === 'invite' && (
          <div className="p-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Invite New Vendor</h3>
              <p className="text-sm text-gray-600">
                Send an invitation to a vendor not yet on the platform.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteForm.vendorName}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, vendorName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="John Smith Photography"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="vendor@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role *
                  </label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {VENDOR_ROLES.filter(role => role.value !== 'ALL').map(role => (
                      <option key={role.value} value={role.value}>
                        {role.emoji} {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Personal Message (Optional)
                  </label>
                  <textarea
                    value={inviteForm.message}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Hi! I&apos;d love to work with you on an upcoming wedding..."
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  <strong>📧 What happens next:</strong> The vendor will receive an email invitation with a link to register their profile and payment information. Once they complete registration, they&apos;ll automatically be added to this wedding.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={sendInvitation}
                  disabled={!inviteForm.email || !inviteForm.vendorName || inviteLoading}
                  className="inline-flex items-center bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  {inviteLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invitation Result Modal */}
      {inviteResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {inviteResult.type === 'invitation_created_email_skipped' ? '📧 Email Configuration Required' : '✅ Invitation Sent'}
              </h3>
              <p className="text-gray-600 mb-4">{inviteResult.message}</p>
              
              {inviteResult.registrationUrl && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800 font-medium mb-2">
                    ⚠️ {inviteResult.actionRequired}
                  </p>
                  <p className="text-sm text-gray-700 mb-3">
                    Registration Link:
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inviteResult.registrationUrl}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm font-mono"
                    />
                    <button
                      onClick={() => inviteResult.registrationUrl && copyRegistrationUrl(inviteResult.registrationUrl)}
                      className="px-3 py-2 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
                      title="Copy to clipboard"
                    >
                      📋
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Copy this link and send it to the vendor via email, text, or your preferred communication method.
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setInviteResult(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}