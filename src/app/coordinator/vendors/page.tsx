'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Search, Users, Mail, Phone, Globe, Edit, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
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
  createdAt: string;
  totalWeddings: number;
  completedTips: number;
  weddingsWithCoordinator: number;
  recentWeddings: Array<{
    id: string;
    coupleName: string;
    weddingDate: string;
  }>;
}

interface Coordinator {
  id: string;
  name: string;
  email: string;
}

const VENDOR_ROLES = [
  { value: 'OFFICIANT', label: 'Officiant', emoji: '👨‍💼' },
  { value: 'COORDINATOR', label: 'Coordinator', emoji: '📋' },
  { value: 'SETUP_ATTENDANT', label: 'Setup Team', emoji: '🔧' },
  { value: 'PHOTOGRAPHER', label: 'Photographer', emoji: '📸' },
];

const PAYMENT_METHODS = [
  { key: 'acceptsStripe', label: 'Credit/Debit Card (Stripe)', icon: '💳', detailField: 'stripeAccountId', detailLabel: 'Stripe Account ID' },
  { key: 'acceptsVenmo', label: 'Venmo', icon: '💜', detailField: 'venmoHandle', detailLabel: 'Venmo Handle' },
  { key: 'acceptsCashApp', label: 'Cash App', icon: '💚', detailField: 'cashAppHandle', detailLabel: 'Cash App Handle' },
  { key: 'acceptsZelle', label: 'Zelle', icon: '⚡', detailField: 'zelleContact', detailLabel: 'Zelle Contact (Phone/Email)' },
];

export default function VendorManagementPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [coordinator, setCoordinator] = useState<Coordinator | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'OFFICIANT',
    bio: '',
    website: '',
    serviceArea: '',
    acceptsStripe: true,
    acceptsVenmo: false,
    acceptsCashApp: false,
    acceptsZelle: false,
    stripeAccountId: '',
    venmoHandle: '',
    cashAppHandle: '',
    zelleContact: ''
  });

  const fetchVendors = useCallback(async (coordinatorId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/coordinator/vendors?coordinatorId=${coordinatorId}`);
      if (response.ok) {
        const data = await response.json();
        setVendors(data.vendors || []);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check if coordinator is logged in
    const coordinatorData = localStorage.getItem('coordinator');
    if (!coordinatorData) {
      router.push('/coordinator/login');
      return;
    }

    try {
      const coord = JSON.parse(coordinatorData);
      setCoordinator(coord);
      fetchVendors(coord.id);
    } catch (error) {
      console.error('Invalid coordinator data:', error);
      router.push('/coordinator/login');
    }
  }, [router, fetchVendors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coordinator) return;

    setFormLoading(true);
    try {
      const url = editingVendor 
        ? `/api/coordinator/vendors/${editingVendor.id}`
        : '/api/coordinator/vendors';
      
      const method = editingVendor ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          coordinatorId: coordinator.id
        })
      });

      if (response.ok) {
        fetchVendors(coordinator.id);
        resetForm();
      } else {
        const error = await response.json();
        alert(`Failed to ${editingVendor ? 'update' : 'create'} vendor: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving vendor:', error);
      alert('An error occurred while saving the vendor');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      email: vendor.email || '',
      phone: vendor.phone || '',
      role: vendor.role,
      bio: vendor.bio || '',
      website: vendor.website || '',
      serviceArea: vendor.serviceArea || '',
      acceptsStripe: vendor.acceptsStripe ?? true,
      acceptsVenmo: vendor.acceptsVenmo ?? false,
      acceptsCashApp: vendor.acceptsCashApp ?? false,
      acceptsZelle: vendor.acceptsZelle ?? false,
      stripeAccountId: vendor.stripeAccountId || '',
      venmoHandle: vendor.venmoHandle || '',
      cashAppHandle: vendor.cashAppHandle || '',
      zelleContact: vendor.zelleContact || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (vendor: Vendor) => {
    if (!confirm(`Are you sure you want to delete ${vendor.name}?`)) return;

    try {
      const response = await fetch(`/api/coordinator/vendors/${vendor.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.action === 'suspended') {
          alert(`${vendor.name} has been suspended (has wedding history)`);
        } else {
          alert(`${vendor.name} has been deleted`);
        }
        fetchVendors(coordinator!.id);
      }
    } catch (error) {
      console.error('Error deleting vendor:', error);
      alert('An error occurred while deleting the vendor');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'OFFICIANT',
      bio: '',
      website: '',
      serviceArea: '',
      acceptsStripe: true,
      acceptsVenmo: false,
      acceptsCashApp: false,
      acceptsZelle: false,
      stripeAccountId: '',
      venmoHandle: '',
      cashAppHandle: '',
      zelleContact: ''
    });
    setEditingVendor(null);
    setShowAddForm(false);
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         vendor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         vendor.serviceArea?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || vendor.status === statusFilter;
    const matchesRole = roleFilter === 'ALL' || vendor.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const getRoleInfo = (role: string) => {
    return VENDOR_ROLES.find(r => r.value === role) || { value: role, label: role, emoji: '💼' };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-100';
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'SUSPENDED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="h-4 w-4" />;
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'SUSPENDED': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading || !coordinator) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-800">Loading vendor management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                href="/coordinator"
                className="flex items-center text-gray-800 hover:text-gray-800 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                Back to Dashboard
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                  <Users className="h-6 w-6 mr-2 text-purple-500" />
                  Vendor Management
                </h1>
                <p className="text-gray-800">Manage your vendor roster across all weddings</p>
              </div>
            </div>

            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Vendor
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vendors..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="SUSPENDED">Suspended</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="ALL">All Roles</option>
              {VENDOR_ROLES.map(role => (
                <option key={role.value} value={role.value}>
                  {role.emoji} {role.label}
                </option>
              ))}
            </select>

            <div className="text-sm text-gray-800 flex items-center">
              <strong>{filteredVendors.length}</strong>&nbsp;of&nbsp;<strong>{vendors.length}</strong>&nbsp;vendors
            </div>
          </div>
        </div>

        {/* Vendors Grid */}
        {filteredVendors.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-24 w-24 text-gray-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {searchQuery || statusFilter !== 'ALL' || roleFilter !== 'ALL' ? 
                'No vendors match your filters' : 'No Vendors Yet'}
            </h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              {searchQuery || statusFilter !== 'ALL' || roleFilter !== 'ALL' ? 
                'Try adjusting your filters or search terms.' :
                'Start building your vendor roster by adding vendors you work with regularly.'}
            </p>
            {(!searchQuery && statusFilter === 'ALL' && roleFilter === 'ALL') && (
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Your First Vendor
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map((vendor) => {
              const roleInfo = getRoleInfo(vendor.role);
              return (
                <div key={vendor.id} className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{roleInfo.emoji}</span>
                        <div>
                          <h3 className="font-semibold text-gray-800">{vendor.name}</h3>
                          <p className="text-sm text-purple-600">{roleInfo.label}</p>
                        </div>
                      </div>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vendor.status)}`}>
                        {getStatusIcon(vendor.status)}
                        <span className="ml-1">{vendor.status.toLowerCase()}</span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4 text-sm">
                      {vendor.email && (
                        <div className="flex items-center text-gray-800">
                          <Mail className="h-4 w-4 mr-2" />
                          <span className="truncate">{vendor.email}</span>
                        </div>
                      )}
                      {vendor.phone && (
                        <div className="flex items-center text-gray-800">
                          <Phone className="h-4 w-4 mr-2" />
                          <span>{vendor.phone}</span>
                        </div>
                      )}
                      {vendor.website && (
                        <div className="flex items-center text-gray-800">
                          <Globe className="h-4 w-4 mr-2" />
                          <a href={vendor.website} target="_blank" rel="noopener noreferrer" 
                             className="text-purple-600 hover:underline truncate">
                            {vendor.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      )}
                      {vendor.serviceArea && (
                        <div className="text-gray-800">
                          <span className="font-medium">Service Area:</span> {vendor.serviceArea}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-gray-800">{vendor.totalWeddings}</div>
                        <div className="text-xs text-gray-500">Total Weddings</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-800">{vendor.weddingsWithCoordinator}</div>
                        <div className="text-xs text-gray-500">With You</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-600">{vendor.completedTips}</div>
                        <div className="text-xs text-gray-500">Tips Received</div>
                      </div>
                    </div>

                    {vendor.recentWeddings.length > 0 && (
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-700 mb-2">Recent Weddings:</div>
                        <div className="space-y-1">
                          {vendor.recentWeddings.slice(0, 2).map((wedding) => (
                            <div key={wedding.id} className="text-sm text-gray-800">
                              • {wedding.coupleName} ({new Date(wedding.weddingDate).toLocaleDateString()})
                            </div>
                          ))}
                          {vendor.recentWeddings.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{vendor.recentWeddings.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(vendor)}
                        className="inline-flex items-center text-gray-800 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Edit vendor"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(vendor)}
                        className="inline-flex items-center text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete vendor"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Vendor Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-800 text-2xl leading-none"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Vendor name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {VENDOR_ROLES.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.emoji} {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="vendor@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Area
                  </label>
                  <input
                    type="text"
                    value={formData.serviceArea}
                    onChange={(e) => setFormData(prev => ({ ...prev, serviceArea: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="New York City, NY"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Brief description of services..."
                  />
                </div>
              </div>

              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Methods</h3>
                <p className="text-sm text-gray-800 mb-4">Select all payment methods this vendor accepts</p>
                
                <div className="space-y-4">
                  {PAYMENT_METHODS.map(method => (
                    <div key={method.key} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <input
                          type="checkbox"
                          id={method.key}
                          checked={formData[method.key as keyof typeof formData] as boolean}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            [method.key]: e.target.checked 
                          }))}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <label htmlFor={method.key} className="ml-3 text-sm font-medium text-gray-700">
                          {method.icon} {method.label}
                        </label>
                      </div>
                      
                      {formData[method.key as keyof typeof formData] && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {method.detailLabel}
                          </label>
                          <input
                            type="text"
                            value={formData[method.detailField as keyof typeof formData] as string}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              [method.detailField]: e.target.value 
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder={
                              method.key === 'acceptsStripe' ? 'Optional: Stripe Account ID' :
                              method.key === 'acceptsVenmo' ? '@username' :
                              method.key === 'acceptsCashApp' ? '$username' :
                              'Phone number or email'
                            }
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 text-gray-800 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="inline-flex items-center bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  {formLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingVendor ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    editingVendor ? 'Update Vendor' : 'Add Vendor'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
