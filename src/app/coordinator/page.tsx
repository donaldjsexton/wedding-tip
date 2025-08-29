'use client';

import { useState, useEffect } from 'react';
import { Heart, Plus, Calendar, Users, DollarSign, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Wedding {
  id: string;
  slug: string;
  coupleName: string;
  weddingDate: string;
  venue?: string;
  vendors: Array<{
    id: string;
    vendor: {
      name: string;
      role: string;
    };
  }>;
}

export default function CoordinatorDashboard() {
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeddings();
  }, []);

  const fetchWeddings = async () => {
    try {
      const response = await fetch('/api/coordinator/weddings');
      const data = await response.json();
      setWeddings(data);
    } catch (error) {
      console.error('Error fetching weddings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      OFFICIANT: 'Officiant',
      COORDINATOR: 'Coordinator', 
      SETUP_ATTENDANT: 'Setup Attendant',
      PHOTOGRAPHER: 'Photographer'
    };
    return roleMap[role] || role;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-purple-500 mr-3" />
              <h1 className="text-2xl font-bold text-gray-800">
                Coordinator Dashboard
              </h1>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Wedding
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {weddings.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-600 mb-4">
              No Weddings Yet
            </h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Get started by creating your first wedding profile. 
              Set up vendors and tip recommendations for your couples.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Wedding
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">
                Your Weddings ({weddings.length})
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {weddings.map((wedding) => (
                <div key={wedding.id} className="bg-white rounded-lg shadow-md border hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">
                          {wedding.coupleName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(wedding.weddingDate)}
                        </p>
                        {wedding.venue && (
                          <p className="text-sm text-gray-500 mt-1">
                            📍 {wedding.venue}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="border-t pt-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Users className="h-4 w-4 mr-2" />
                        {wedding.vendors.length} Vendors
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {wedding.vendors.slice(0, 3).map((wv) => (
                          <span
                            key={wv.id}
                            className="inline-block bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full"
                          >
                            {getRoleDisplayName(wv.vendor.role)}
                          </span>
                        ))}
                        {wedding.vendors.length > 3 && (
                          <span className="text-xs text-gray-500 px-2 py-1">
                            +{wedding.vendors.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Wedding Code:</span>{' '}
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                          {wedding.slug}
                        </code>
                      </div>
                      <Link
                        href={`/coordinator/wedding/${wedding.id}`}
                        className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium text-sm"
                      >
                        Manage
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Wedding Modal/Form - We'll implement this next */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Create New Wedding</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-600 text-center py-8">
                Wedding creation form coming soon...
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
