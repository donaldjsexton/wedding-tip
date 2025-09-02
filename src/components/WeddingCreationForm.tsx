'use client';

import { useState } from 'react';
import { Plus, X, DollarSign, Calendar, MapPin, Users, Mail, Phone } from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  role: 'OFFICIANT' | 'COORDINATOR' | 'SETUP_ATTENDANT' | 'PHOTOGRAPHER';
  email?: string;
  phone?: string;
  preferredPayment: 'STRIPE' | 'VENMO' | 'CASHAPP';
  venmoHandle?: string;
  cashAppHandle?: string;
  serviceHours?: number;
  serviceRate?: number;
  customTipAmount?: number;
}

interface WeddingFormData {
  coupleName: string;
  weddingDate: string;
  venue: string;
  notes: string;
  vendors: Vendor[];
}

interface WeddingCreationFormProps {
  onSubmit: (weddingData: WeddingFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const VENDOR_ROLES = [
  { value: 'OFFICIANT', label: 'Officiant', emoji: '👨‍💼' },
  { value: 'COORDINATOR', label: 'Wedding Coordinator', emoji: '📋' },
  { value: 'SETUP_ATTENDANT', label: 'Setup Team', emoji: '🔧' },
  { value: 'PHOTOGRAPHER', label: 'Photographer', emoji: '📸' },
] as const;

const PAYMENT_METHODS = [
  { value: 'STRIPE', label: 'Credit/Debit Card', icon: '💳' },
  { value: 'VENMO', label: 'Venmo', icon: '💜' },
  { value: 'CASHAPP', label: 'Cash App', icon: '💚' },
] as const;

export default function WeddingCreationForm({ 
  onSubmit, 
  onCancel, 
  loading = false
}: WeddingCreationFormProps) {
  const [formData, setFormData] = useState<WeddingFormData>({
    coupleName: '',
    weddingDate: '',
    venue: '',
    notes: '',
    vendors: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const generateVendorId = () => Math.random().toString(36).substr(2, 9);

  const addVendor = () => {
    const newVendor: Vendor = {
      id: generateVendorId(),
      name: '',
      role: 'OFFICIANT',
      preferredPayment: 'STRIPE',
      serviceHours: 0,
      serviceRate: 0,
    };

    setFormData(prev => ({
      ...prev,
      vendors: [...prev.vendors, newVendor]
    }));
  };

  const updateVendor = (id: string, updates: Partial<Vendor>) => {
    setFormData(prev => ({
      ...prev,
      vendors: prev.vendors.map(vendor =>
        vendor.id === id ? { ...vendor, ...updates } : vendor
      )
    }));
  };

  const removeVendor = (id: string) => {
    setFormData(prev => ({
      ...prev,
      vendors: prev.vendors.filter(vendor => vendor.id !== id)
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.coupleName.trim()) {
      newErrors.coupleName = 'Couple name is required';
    }

    if (!formData.weddingDate) {
      newErrors.weddingDate = 'Wedding date is required';
    }

    if (formData.vendors.length === 0) {
      newErrors.vendors = 'At least one vendor is required';
    }

    formData.vendors.forEach((vendor, index) => {
      if (!vendor.name.trim()) {
        newErrors[`vendor_${index}_name`] = 'Vendor name is required';
      }

      if (vendor.preferredPayment === 'VENMO' && !vendor.venmoHandle) {
        newErrors[`vendor_${index}_venmo`] = 'Venmo handle is required';
      }

      if (vendor.preferredPayment === 'CASHAPP' && !vendor.cashAppHandle) {
        newErrors[`vendor_${index}_cashapp`] = 'Cash App handle is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Failed to create wedding:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Create New Wedding</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Wedding Details */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-purple-500" />
                Wedding Details
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Couple Names *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.coupleName}
                    onChange={(e) => setFormData(prev => ({ ...prev, coupleName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Sarah & Michael"
                  />
                  {errors.coupleName && (
                    <p className="text-red-500 text-xs mt-1">{errors.coupleName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wedding Date *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.weddingDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, weddingDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {errors.weddingDate && (
                    <p className="text-red-500 text-xs mt-1">{errors.weddingDate}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Venue
                  </label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Rosewood Manor"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Special requests, timing notes, etc."
                  />
                </div>
              </div>
            </div>

            {/* Vendors Section */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-500" />
                  Wedding Vendors
                </h3>
                <button
                  type="button"
                  onClick={addVendor}
                  className="inline-flex items-center bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Vendor
                </button>
              </div>

              {errors.vendors && (
                <p className="text-red-500 text-sm mb-4">{errors.vendors}</p>
              )}

              {formData.vendors.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No vendors added yet</p>
                  <p className="text-sm">Click &quot;Add Vendor&quot; to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.vendors.map((vendor, index) => (
                    <VendorCard
                      key={vendor.id}
                      vendor={vendor}
                      index={index}
                      onUpdate={(updates) => updateVendor(vendor.id, updates)}
                      onRemove={() => removeVendor(vendor.id)}
                      errors={errors}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Submit Actions */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  'Create Wedding'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Individual Vendor Card Component
function VendorCard({ 
  vendor, 
  index, 
  onUpdate, 
  onRemove, 
  errors 
}: {
  vendor: Vendor;
  index: number;
  onUpdate: (updates: Partial<Vendor>) => void;
  onRemove: () => void;
  errors: Record<string, string>;
}) {
  const roleInfo = VENDOR_ROLES.find(r => r.value === vendor.role);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <span className="text-2xl mr-2">{roleInfo?.emoji}</span>
          <div>
            <h4 className="font-medium text-gray-800">
              {vendor.name || `New ${roleInfo?.label}`}
            </h4>
            <p className="text-sm text-gray-500">{roleInfo?.label}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 p-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Basic Info */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vendor Name *
          </label>
          <input
            type="text"
            required
            value={vendor.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            placeholder="Enter vendor name"
          />
          {errors[`vendor_${index}_name`] && (
            <p className="text-red-500 text-xs mt-1">{errors[`vendor_${index}_name`]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            value={vendor.role}
            onChange={(e) => onUpdate({ role: e.target.value as Vendor['role'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          >
            {VENDOR_ROLES.map(role => (
              <option key={role.value} value={role.value}>
                {role.emoji} {role.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Mail className="h-3 w-3 inline mr-1" />
            Email
          </label>
          <input
            type="email"
            value={vendor.email || ''}
            onChange={(e) => onUpdate({ email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            placeholder="vendor@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Phone className="h-3 w-3 inline mr-1" />
            Phone
          </label>
          <input
            type="tel"
            value={vendor.phone || ''}
            onChange={(e) => onUpdate({ phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            placeholder="(555) 123-4567"
          />
        </div>

        {/* Payment Info */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preferred Payment
          </label>
          <select
            value={vendor.preferredPayment}
            onChange={(e) => onUpdate({ preferredPayment: e.target.value as Vendor['preferredPayment'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          >
            {PAYMENT_METHODS.map(method => (
              <option key={method.value} value={method.value}>
                {method.icon} {method.label}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Handle */}
        {vendor.preferredPayment === 'VENMO' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Venmo Handle *
            </label>
            <input
              type="text"
              value={vendor.venmoHandle || ''}
              onChange={(e) => onUpdate({ venmoHandle: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              placeholder="@username"
            />
            {errors[`vendor_${index}_venmo`] && (
              <p className="text-red-500 text-xs mt-1">{errors[`vendor_${index}_venmo`]}</p>
            )}
          </div>
        )}

        {vendor.preferredPayment === 'CASHAPP' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cash App Handle *
            </label>
            <input
              type="text"
              value={vendor.cashAppHandle || ''}
              onChange={(e) => onUpdate({ cashAppHandle: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              placeholder="$username"
            />
            {errors[`vendor_${index}_cashapp`] && (
              <p className="text-red-500 text-xs mt-1">{errors[`vendor_${index}_cashapp`]}</p>
            )}
          </div>
        )}

        {/* Service Details */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Service Hours
          </label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={vendor.serviceHours || ''}
            onChange={(e) => onUpdate({ serviceHours: parseFloat(e.target.value) || undefined })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            placeholder="8"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <DollarSign className="h-3 w-3 inline mr-1" />
            Rate ($/hour or total)
          </label>
          <input
            type="number"
            min="0"
            value={vendor.serviceRate || ''}
            onChange={(e) => onUpdate({ serviceRate: parseFloat(e.target.value) || undefined })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            placeholder="150"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <DollarSign className="h-3 w-3 inline mr-1" />
            Custom Tip Amount (optional)
          </label>
          <input
            type="number"
            min="0"
            value={vendor.customTipAmount || ''}
            onChange={(e) => onUpdate({ customTipAmount: parseFloat(e.target.value) || undefined })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            placeholder="Leave blank for automatic calculation"
          />
          <p className="text-xs text-gray-500 mt-1">
            If set, this overrides automatic tip calculations for this vendor
          </p>
        </div>
      </div>
    </div>
  );
}
