'use client';

import { useState } from 'react';
import { X, Calendar, MapPin, Heart } from 'lucide-react';

interface WeddingFormData {
  coupleName: string;
  weddingDate: string;
  venue: string;
  notes: string;
}

interface SimpleWeddingCreationFormProps {
  onSubmit: (weddingData: WeddingFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function SimpleWeddingCreationForm({ 
  onSubmit, 
  onCancel, 
  loading = false
}: SimpleWeddingCreationFormProps) {
  const [formData, setFormData] = useState<WeddingFormData>({
    coupleName: '',
    weddingDate: '',
    venue: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.coupleName.trim()) {
      newErrors.coupleName = 'Couple name is required';
    }

    if (!formData.weddingDate) {
      newErrors.weddingDate = 'Wedding date is required';
    }

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
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Heart className="h-6 w-6 text-pink-500 mr-2" />
              <h2 className="text-xl font-bold text-gray-800">Create New Wedding</h2>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Wedding Details */}
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
                <Calendar className="h-3 w-3 inline mr-1" />
                Wedding Date & Time *
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="h-3 w-3 inline mr-1" />
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

            <div>
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

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                <strong>Next step:</strong> After creating the wedding, you&apos;ll be able to search for vendors or invite new ones to join this wedding.
              </p>
            </div>

            {/* Submit Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
