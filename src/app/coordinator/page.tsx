'use client';

import { useState, useEffect, useCallback } from 'react';
import { Heart, Plus, Calendar, Users, ChevronRight, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SimpleWeddingCreationForm from '@/components/SimpleWeddingCreationForm';

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

interface Coordinator {
  id: string;
  email: string;
  name: string;
  company?: string;
}

export default function CoordinatorDashboard() {
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [coordinator, setCoordinator] = useState<Coordinator | null>(null);
  const router = useRouter();

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
      fetchWeddings(coord.id);
    } catch (error) {
      console.error('Invalid coordinator data:', error);
      router.push('/coordinator/login');
    }
  }, [router]);

  const fetchWeddings = useCallback(async (coordinatorId: string) => {
    try {
      const response = await fetch(`/api/coordinator/weddings?coordinatorId=${coordinatorId}`);
      const data = await response.json();
      setWeddings(data);
    } catch (error) {
      console.error('Error fetching weddings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('coordinator');
    router.push('/coordinator/login');
  };

  const handleCreateWedding = async (weddingData: {
    coupleName: string;
    weddingDate: string;
    venue: string;
    notes: string;
  }) => {
    if (!coordinator) return;
    
    setCreateLoading(true);
    try {
      const response = await fetch('/api/coordinator/weddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...weddingData,
          coordinatorEmail: coordinator.email
        }),
      });

      if (response.ok) {
        const newWedding = await response.json();
        setWeddings(prev => [newWedding, ...prev]);
        setShowCreateForm(false);
        // Show success message or toast
      } else {
        const error = await response.json();
        console.error('Failed to create wedding:', error);
        // Show error message
      }
    } catch (error) {
      console.error('Error creating wedding:', error);
    } finally {
      setCreateLoading(false);
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

  if (loading || !coordinator) {
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
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Coordinator Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  Welcome back, {coordinator.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Wedding
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center text-gray-600 hover:text-gray-800 font-medium py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
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

      {/* Wedding Creation Form */}
      {showCreateForm && coordinator && (
        <SimpleWeddingCreationForm
          onSubmit={handleCreateWedding}
          onCancel={() => setShowCreateForm(false)}
          loading={createLoading}
        />
      )}
    </div>
  );
}
