'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, MapPin, Users, ExternalLink, CheckCircle, Clock, Edit, Share } from 'lucide-react';
import Link from 'next/link';
import VendorManagement from '@/components/VendorManagement';

interface Vendor {
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

interface Wedding {
  id: string;
  slug: string;
  coupleName: string;
  weddingDate: string;
  venue?: string;
  notes?: string;
  coordinator: {
    id: string;
    name: string;
    email: string;
  };
  vendors: Vendor[];
  tips: Array<{
    id: string;
    amount: number;
    paymentMethod: string;
    paymentStatus: string;
    vendor: {
      name: string;
      role: string;
    };
    createdAt: string;
  }>;
}

export default function WeddingManagementPage({ params }: { params: Promise<{ id: string }> }) {
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showVendorManagement, setShowVendorManagement] = useState(false);
  const router = useRouter();

  const fetchWedding = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/coordinator/wedding/${id}`);
      if (response.ok) {
        const data = await response.json();
        setWedding(data);
      } else {
        console.error('Failed to fetch wedding');
        router.push('/coordinator');
      }
    } catch (error) {
      console.error('Error fetching wedding:', error);
      router.push('/coordinator');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    params.then(({ id }) => {
      fetchWedding(id);
    });
  }, [params, fetchWedding]);

  const handleVendorAdded = () => {
    // Refresh wedding data to show newly added vendor
    if (wedding) {
      fetchWedding(wedding.id);
    }
  };

  const copyWeddingUrl = async () => {
    if (!wedding) return;
    
    const coupleUrl = `${window.location.origin}/couple/${wedding.slug}`;
    try {
      await navigator.clipboard.writeText(coupleUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      OFFICIANT: 'Officiant',
      COORDINATOR: 'Wedding Coordinator', 
      SETUP_ATTENDANT: 'Setup Team',
      PHOTOGRAPHER: 'Photographer'
    };
    return roleMap[role] || role;
  };

  const getRoleEmoji = (role: string) => {
    const emojiMap: { [key: string]: string } = {
      OFFICIANT: '👨‍💼',
      COORDINATOR: '📋',
      SETUP_ATTENDANT: '🔧',
      PHOTOGRAPHER: '📸'
    };
    return emojiMap[role] || '💼';
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

  const getVendorPaymentMethods = (vendor: any) => {
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

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'COMPLETED': return 'text-green-600 bg-green-100';
      case 'PROCESSING': return 'text-blue-600 bg-blue-100';
      case 'FAILED': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wedding details...</p>
        </div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-600 mb-4">Wedding Not Found</h2>
          <Link 
            href="/coordinator"
            className="text-purple-600 hover:underline"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const totalTipped = wedding.tips
    .filter(tip => tip.paymentStatus === 'COMPLETED')
    .reduce((sum, tip) => sum + tip.amount, 0);

  const completedTips = wedding.tips.filter(tip => tip.paymentStatus === 'COMPLETED').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/coordinator')}
                className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                Back to Dashboard
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {wedding.coupleName}
                </h1>
                <p className="text-gray-600 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(wedding.weddingDate)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={copyWeddingUrl}
                className={`inline-flex items-center font-medium py-2 px-4 rounded-lg transition-colors ${
                  copied 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Share className="h-4 w-4 mr-2" />
                    Share with Couple
                  </>
                )}
              </button>
              
              <Link
                href={`/couple/${wedding.slug}`}
                target="_blank"
                className="inline-flex items-center bg-pink-500 hover:bg-pink-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Preview Couple View
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Wedding Info & Vendors */}
          <div className="lg:col-span-2 space-y-6">
            {/* Wedding Details Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Wedding Details</h2>
                <button className="text-gray-400 hover:text-gray-600">
                  <Edit className="h-4 w-4" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Couple
                  </label>
                  <p className="text-gray-800">{wedding.coupleName}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Date & Time
                  </label>
                  <p className="text-gray-800">{formatDate(wedding.weddingDate)}</p>
                </div>

                {wedding.venue && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      <MapPin className="h-3 w-3 inline mr-1" />
                      Venue
                    </label>
                    <p className="text-gray-800">{wedding.venue}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Wedding Code
                  </label>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                    {wedding.slug}
                  </code>
                </div>

                {wedding.notes && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Notes
                    </label>
                    <p className="text-gray-800">{wedding.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Vendors Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-500" />
                  Vendors ({wedding.vendors.length})
                </h2>
                <button 
                  onClick={() => setShowVendorManagement(true)}
                  className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                >
                  + Manage Vendors
                </button>
              </div>

              <div className="space-y-4">
                {wedding.vendors.map((wv) => (
                  <div key={wv.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">
                          {getRoleEmoji(wv.vendor.role)}
                        </span>
                        <div>
                          <h3 className="font-medium text-gray-800">
                            {wv.vendor.name}
                          </h3>
                          <p className="text-sm text-purple-600">
                            {getRoleDisplayName(wv.vendor.role)}
                          </p>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      {wv.vendor.email && (
                        <div>
                          <span className="text-gray-500">Email:</span>
                          <p className="text-gray-800">{wv.vendor.email}</p>
                        </div>
                      )}
                      
                      {wv.vendor.phone && (
                        <div>
                          <span className="text-gray-500">Phone:</span>
                          <p className="text-gray-800">{wv.vendor.phone}</p>
                        </div>
                      )}

                      <div>
                        <span className="text-gray-500">Payment Methods:</span>
                        <div className="text-gray-800">
                          {getVendorPaymentMethods(wv.vendor).map((method, index) => (
                            <span key={index} className="inline-flex items-center mr-4 mb-1">
                              <span className="mr-1">{method.icon}</span>
                              <span>{method.name}</span>
                            </span>
                          ))}
                          {getVendorPaymentMethods(wv.vendor).length === 0 && (
                            <span className="text-gray-500">No payment methods configured</span>
                          )}
                        </div>
                      </div>

                      {wv.serviceHours && (
                        <div>
                          <span className="text-gray-500">Hours:</span>
                          <p className="text-gray-800">{wv.serviceHours}h</p>
                        </div>
                      )}

                      {wv.serviceRate && (
                        <div>
                          <span className="text-gray-500">Rate:</span>
                          <p className="text-gray-800">${wv.serviceRate}</p>
                        </div>
                      )}

                      {wv.customTipAmount && (
                        <div>
                          <span className="text-gray-500">Custom Tip:</span>
                          <p className="text-gray-800 font-medium">${wv.customTipAmount}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Stats & Activity */}
          <div className="space-y-6">
            {/* Tipping Progress Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Tipping Progress
              </h3>

              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    ${totalTipped}
                  </div>
                  <p className="text-sm text-gray-500">Total tips distributed</p>
                </div>

                <div className="bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-pink-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(completedTips / wedding.vendors.length) * 100}%` }}
                  />
                </div>

                <div className="flex justify-between text-sm text-gray-600">
                  <span>{completedTips} of {wedding.vendors.length} vendors tipped</span>
                  <span>{Math.round((completedTips / wedding.vendors.length) * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Recent Tips
              </h3>

              {wedding.tips.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No tips yet</p>
                  <p className="text-xs">Tips will appear here once couples start tipping</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {wedding.tips
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 5)
                    .map((tip) => (
                      <div key={tip.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">
                            {getRoleEmoji(tip.vendor.role)}
                          </span>
                          <div>
                            <p className="font-medium text-sm text-gray-800">
                              {tip.vendor.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(tip.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-800">
                            ${tip.amount}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(tip.paymentStatus)}`}>
                            {tip.paymentStatus.toLowerCase()}
                          </span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Vendor Management Modal */}
      {showVendorManagement && wedding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <Users className="h-6 w-6 text-purple-500 mr-2" />
                  Manage Vendors - {wedding.coupleName}
                </h2>
                <button
                  onClick={() => setShowVendorManagement(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <VendorManagement
                weddingId={wedding.id}
                coordinatorId={wedding.coordinator.id}
                currentVendors={wedding.vendors}
                onVendorAdded={handleVendorAdded}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
