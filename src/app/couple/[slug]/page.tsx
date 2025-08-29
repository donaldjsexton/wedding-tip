'use client';

import { useState, useEffect } from 'react';
import { Heart, Info, CheckCircle } from 'lucide-react';
import { calculateTipRecommendations, tippingEtiquette } from '@/lib/utils';

interface Vendor {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  preferredPayment: string;
  venmoHandle?: string;
  cashAppHandle?: string;
  serviceHours?: number;
  serviceRate?: number;
  customTipAmount?: number;
}

interface Wedding {
  id: string;
  slug: string;
  coupleName: string;
  weddingDate: string;
  venue?: string;
  vendors: Vendor[];
}

// Sample data for demo
const sampleWedding: Wedding = {
  id: 'sample-1',
  slug: 'sample-wedding-abc123',
  coupleName: 'Sarah & Michael',
  weddingDate: '2024-06-15T16:00:00.000Z',
  venue: 'Rosewood Manor',
  vendors: [
    {
      id: 'v1',
      name: 'Rev. Johnson',
      role: 'OFFICIANT',
      email: 'rev.johnson@email.com',
      preferredPayment: 'VENMO',
      venmoHandle: '@revjohnson',
      serviceHours: 2,
      serviceRate: 300
    },
    {
      id: 'v2', 
      name: 'Emma Williams',
      role: 'COORDINATOR',
      email: 'emma@weddingpros.com',
      phone: '(555) 123-4567',
      preferredPayment: 'STRIPE',
      serviceHours: 10,
      serviceRate: 150
    },
    {
      id: 'v3',
      name: 'Mike & Tony',
      role: 'SETUP_ATTENDANT',
      preferredPayment: 'CASHAPP',
      cashAppHandle: '$mikeandtony',
      serviceHours: 4,
      customTipAmount: 80
    },
    {
      id: 'v4',
      name: 'Jessica Photo Co.',
      role: 'PHOTOGRAPHER',
      email: 'hello@jessicaphoto.com',
      preferredPayment: 'STRIPE',
      serviceHours: 8,
      serviceRate: 200
    }
  ]
};

export default function CoupleTippingPage({ params }: { params: Promise<{ slug: string }> }) {
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [tipAmounts, setTipAmounts] = useState<{[key: string]: number}>({});
  const [showTipModal, setShowTipModal] = useState(false);
  const [completedTips, setCompletedTips] = useState<Set<string>>(new Set());
  const [slug, setSlug] = useState<string>('');

  useEffect(() => {
    // Handle async params in useEffect
    params.then(({ slug }) => {
      setSlug(slug);
      // For demo, use sample data. In real app, fetch from API
      if (slug === 'sample-wedding-abc123') {
        setWedding(sampleWedding);
      }
    });
  }, [params]);

  if (!wedding) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-16 w-16 text-pink-300 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-gray-600 mb-2">Wedding Not Found</h2>
          <p className="text-gray-500">
            Please check your wedding code and try again.
          </p>
        </div>
      </div>
    );
  }

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
      default: return '💳';
    }
  };

  const getTipRecommendations = (vendor: Vendor) => {
    if (vendor.customTipAmount) {
      return {
        low: vendor.customTipAmount,
        medium: vendor.customTipAmount,
        high: vendor.customTipAmount,
      };
    }
    
    return calculateTipRecommendations(
      vendor.role, 
      vendor.serviceHours, 
      vendor.serviceRate
    );
  };

  const getRandomTip = (role: string) => {
    const tips = tippingEtiquette[role as keyof typeof tippingEtiquette] || [];
    return tips[Math.floor(Math.random() * tips.length)];
  };

  const handleTipVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowTipModal(true);
  };

  const handleTipComplete = (vendorId: string, amount: number) => {
    setTipAmounts(prev => ({ ...prev, [vendorId]: amount }));
    setCompletedTips(prev => new Set([...prev, vendorId]));
    setShowTipModal(false);
    setSelectedVendor(null);
  };

  const totalTipped = Object.values(tipAmounts).reduce((sum, amount) => sum + amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-3">
              <Heart className="h-8 w-8 text-pink-500 mr-3" />
              <h1 className="text-3xl font-bold text-gray-800">
                {wedding.coupleName}
              </h1>
            </div>
            <p className="text-gray-600 text-lg">{formatDate(wedding.weddingDate)}</p>
            {wedding.venue && (
              <p className="text-gray-500">📍 {wedding.venue}</p>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Progress Overview */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Vendor Tipping Progress</h2>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">${totalTipped}</p>
              <p className="text-sm text-gray-500">Total tipped</p>
            </div>
          </div>
          <div className="bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className="bg-gradient-to-r from-pink-500 to-purple-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${(completedTips.size / wedding.vendors.length) * 100}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">
            {completedTips.size} of {wedding.vendors.length} vendors tipped
          </p>
        </div>

        {/* Educational Tip */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8 rounded-lg">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
            <div>
              <p className="text-sm text-blue-700">
                <strong>💡 Tipping Tip:</strong> {getRandomTip('COORDINATOR')}
              </p>
            </div>
          </div>
        </div>

        {/* Vendor Cards */}
        <div className="grid gap-6">
          {wedding.vendors.map((vendor) => {
            const recommendations = getTipRecommendations(vendor);
            const isCompleted = completedTips.has(vendor.id);
            const tippedAmount = tipAmounts[vendor.id];

            return (
              <div
                key={vendor.id}
                className={`bg-white rounded-xl shadow-lg border-2 transition-all ${
                  isCompleted 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-100 hover:border-pink-200 hover:shadow-xl'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="text-3xl">{getRoleEmoji(vendor.role)}</div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-1">
                          {vendor.name}
                        </h3>
                        <p className="text-purple-600 font-medium mb-2">
                          {getRoleDisplayName(vendor.role)}
                        </p>
                        {vendor.serviceHours && (
                          <p className="text-sm text-gray-600">
                            Service time: {vendor.serviceHours} hours
                          </p>
                        )}
                      </div>
                    </div>
                    {isCompleted && (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-6 w-6 mr-2" />
                        <span className="font-semibold">${tippedAmount}</span>
                      </div>
                    )}
                  </div>

                  {!isCompleted && (
                    <>
                      {/* Tip Recommendations */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-gray-800 mb-3">Suggested Tips:</h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="text-center">
                            <div className="bg-white rounded-lg p-3 border">
                              <p className="text-lg font-bold text-gray-700">${recommendations.low}</p>
                              <p className="text-xs text-gray-500">Good Service</p>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="bg-purple-100 rounded-lg p-3 border border-purple-200">
                              <p className="text-lg font-bold text-purple-700">${recommendations.medium}</p>
                              <p className="text-xs text-purple-600">Great Service</p>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="bg-white rounded-lg p-3 border">
                              <p className="text-lg font-bold text-gray-700">${recommendations.high}</p>
                              <p className="text-xs text-gray-500">Exceptional</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Payment Info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="mr-2">{getPaymentIcon(vendor.preferredPayment)}</span>
                          <span>
                            {vendor.preferredPayment === 'VENMO' && vendor.venmoHandle}
                            {vendor.preferredPayment === 'CASHAPP' && vendor.cashAppHandle}
                            {vendor.preferredPayment === 'STRIPE' && 'Credit/Debit Card'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleTipVendor(vendor)}
                          className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                        >
                          Tip Now
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        {completedTips.size === wedding.vendors.length && (
          <div className="mt-8 bg-green-50 rounded-xl p-8 text-center border border-green-200">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              All Set! Thank You!
            </h2>
            <p className="text-green-700 mb-4">
              You&apos;ve successfully tipped all your wedding vendors. 
              Your generosity is greatly appreciated!
            </p>
            <div className="bg-white rounded-lg p-4 inline-block">
              <p className="text-lg font-semibold text-gray-800">
                Total Tips Distributed: <span className="text-green-600">${totalTipped}</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tip Payment Modal */}
      {showTipModal && selectedVendor && (
        <TipModal
          vendor={selectedVendor}
          onComplete={handleTipComplete}
          onClose={() => {
            setShowTipModal(false);
            setSelectedVendor(null);
          }}
        />
      )}
    </div>
  );
}

// Tip Modal Component
function TipModal({ 
  vendor, 
  onComplete, 
  onClose 
}: { 
  vendor: Vendor; 
  onComplete: (vendorId: string, amount: number) => void;
  onClose: () => void;
}) {
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Define helper functions locally
  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      OFFICIANT: 'Officiant',
      COORDINATOR: 'Wedding Coordinator', 
      SETUP_ATTENDANT: 'Setup Team',
      PHOTOGRAPHER: 'Photographer'
    };
    return roleMap[role] || role;
  };

  const getTipRecommendations = (vendor: Vendor) => {
    if (vendor.customTipAmount) {
      return {
        low: vendor.customTipAmount,
        medium: vendor.customTipAmount,
        high: vendor.customTipAmount,
      };
    }
    
    return calculateTipRecommendations(
      vendor.role, 
      vendor.serviceHours, 
      vendor.serviceRate
    );
  };
  
  const recommendations = getTipRecommendations(vendor);

  const handlePayment = async () => {
    const amount = selectedAmount || parseFloat(customAmount);
    if (!amount) return;

    setProcessingPayment(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onComplete(vendor.id, amount);
    setProcessingPayment(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">
              {vendor.role === 'OFFICIANT' && '👨‍💼'}
              {vendor.role === 'COORDINATOR' && '📋'}
              {vendor.role === 'SETUP_ATTENDANT' && '🔧'}
              {vendor.role === 'PHOTOGRAPHER' && '📸'}
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">
              Tip {vendor.name}
            </h2>
            <p className="text-purple-600">{getRoleDisplayName(vendor.role)}</p>
          </div>

          {/* Amount Selection */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Select tip amount:</h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { amount: recommendations.low, label: 'Good' },
                { amount: recommendations.medium, label: 'Great' },
                { amount: recommendations.high, label: 'Exceptional' }
              ].map((option) => (
                <button
                  key={option.amount}
                  onClick={() => {
                    setSelectedAmount(option.amount);
                    setCustomAmount('');
                  }}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    selectedAmount === option.amount
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="font-bold">${option.amount}</div>
                  <div className="text-xs">{option.label}</div>
                </button>
              ))}
            </div>
            
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                placeholder="Custom amount"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(0);
                }}
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Payment Method:</span>
              <div className="flex items-center">
                <span className="mr-2">
                  {vendor.preferredPayment === 'VENMO' && '💜'}
                  {vendor.preferredPayment === 'CASHAPP' && '💚'}
                  {vendor.preferredPayment === 'STRIPE' && '💳'}
                </span>
                <span className="font-medium">
                  {vendor.preferredPayment === 'VENMO' && vendor.venmoHandle}
                  {vendor.preferredPayment === 'CASHAPP' && vendor.cashAppHandle}
                  {vendor.preferredPayment === 'STRIPE' && 'Credit Card'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-colors"
              disabled={processingPayment}
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={(!selectedAmount && !customAmount) || processingPayment}
              className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center"
            >
              {processingPayment ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                `Tip $${selectedAmount || customAmount || '0'}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
