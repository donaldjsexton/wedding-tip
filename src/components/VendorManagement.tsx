'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, User, Mail, ExternalLink, Check, Send } from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  bio?: string;
  website?: string;
  serviceArea?: string;
  preferredPayment: string;
  venmoHandle?: string;
  cashAppHandle?: string;
  zelleContact?: string;
  weddingsWorked: number;
  weddingsWithCoordinator: number;
}

interface VendorManagementProps {
  weddingId: string;
  coordinatorId: string;
  currentVendors: Array<{
    id: string;
    vendor: {
      id: string;
      name: string;
      role: string;
      email?: string;
      preferredPayment: string;
    };
  }>;
  onVendorAdded: () => void;
}

const VENDOR_ROLES = [
  { value: 'ALL', label: 'All Roles' },
  { value: 'OFFICIANT', label: 'Officiant', emoji: '👨‍💼' },
  { value: 'COORDINATOR', label: 'Coordinator', emoji: '📋' },
  { value: 'SETUP_ATTENDANT', label: 'Setup Team', emoji: '🔧' },
  { value: 'PHOTOGRAPHER', label: 'Photographer', emoji: '📸' },
] as const;

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
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    vendorName: '',
    role: 'OFFICIANT',
    message: ''
  });
  const [inviteLoading, setInviteLoading] = useState(false);

  // Search for vendors
  const searchVendors = async () => {
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
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchVendors();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedRole, coordinatorId, searchVendors]);

  const addExistingVendor = async (vendorId: string) => {
    try {
      const response = await fetch('/api/coordinator/vendors/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weddingId, vendorId })
      });

      if (response.ok) {
        onVendorAdded();
        setSearchQuery('');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error adding vendor:', error);
    }
  };

  const sendInvitation = async () => {
    if (!inviteForm.email || !inviteForm.vendorName) return;
    
    console.log('Sending invitation with data:', {
      ...inviteForm,
      weddingId,
      coordinatorId
    });

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
        console.log('Invitation response:', data);
        if (data.type === 'existing_vendor_added') {
          // Existing vendor was added
          onVendorAdded();
        }
        // Reset form and close
        setInviteForm({ email: '', vendorName: '', role: 'OFFICIANT', message: '' });
        setShowInviteForm(false);
      } else {
        const errorData = await response.json();
        console.error('Invitation failed:', errorData);
        alert(`Failed to send invitation: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
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

  const getPaymentIcon = (method: string) => {
    switch(method) {
      case 'VENMO': return '💜';
      case 'CASHAPP': return '💚';
      case 'STRIPE': return '💳';
      case 'ZELLE': return '⚡';
      default: return '💳';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Search Existing Vendors</h3>
        
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
                      <span className="flex items-center">
                        {getPaymentIcon(vendor.preferredPayment)}
                        <span className="ml-1">{vendor.preferredPayment}</span>
                      </span>
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
                    <div className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm">
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
            <p className="text-sm">Try a different search term or invite a new vendor below.</p>
          </div>
        )}
      </div>

      {/* Invite New Vendor Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Invite New Vendor</h3>
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="inline-flex items-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            {showInviteForm ? 'Cancel' : 'Invite New Vendor'}
          </button>
        </div>

        {showInviteForm && (
          <div className="border-t pt-4 space-y-4">
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

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personal Message (optional)
                </label>
                <textarea
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Hi! I'd love to have you as part of this special wedding..."
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
        )}
      </div>
    </div>
  );
}
