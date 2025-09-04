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

// This will be fetched from the API

export default function CoupleTippingPage({ params }: { params: Promise<{ slug: string }> }) {
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [tipAmounts, setTipAmounts] = useState<{[key: string]: number}>({});
  const [showTipModal, setShowTipModal] = useState(false);
  const [completedTips, setCompletedTips] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [tipSliderValue, setTipSliderValue] = useState<number>(0);

  useEffect(() => {
    // Handle async params and fetch wedding data
    params.then(async ({ slug }) => {
      try {
        setLoading(true);
        const response = await fetch(`/api/wedding/${slug}`);
        if (response.ok) {
          const weddingData = await response.json();
          setWedding(weddingData);
        } else {
          console.error('Failed to fetch wedding data');
          setWedding(null);
        }
      } catch (error) {
        console.error('Error fetching wedding:', error);
        setWedding(null);
      } finally {
        setLoading(false);
      }
    });
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-16 w-16 text-pink-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading Wedding Details</h2>
          <p className="text-gray-500">
            Please wait while we fetch your wedding information...
          </p>
        </div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-16 w-16 text-pink-300 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Wedding Not Found</h2>
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
    // Don't clear selectedVendor so user can see the completion status
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
            <p className="text-gray-800 text-lg">{formatDate(wedding.weddingDate)}</p>
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
          <p className="text-sm text-gray-800">
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

        {/* Vendor Selection and Tipping Interface */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Vendor Selection Panel */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Choose Service to Tip</h3>
            <div className="space-y-3">
              {wedding.vendors.map((vendor) => {
                const isCompleted = completedTips.has(vendor.id);
                const tippedAmount = tipAmounts[vendor.id];
                const isSelected = selectedVendor?.id === vendor.id;

                return (
                  <div
                    key={vendor.id}
                    onClick={() => {
                      setSelectedVendor(vendor);
                      const recommendations = getTipRecommendations(vendor);
                      setTipSliderValue(recommendations.medium);
                    }}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-pink-400 bg-pink-50' 
                        : isCompleted
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 hover:border-pink-200 hover:bg-pink-25'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{getRoleEmoji(vendor.role)}</div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{vendor.name}</h4>
                          <p className="text-sm text-purple-600">{getRoleDisplayName(vendor.role)}</p>
                          {vendor.serviceHours && (
                            <p className="text-xs text-gray-600">{vendor.serviceHours} hours</p>
                          )}
                        </div>
                      </div>
                      {isCompleted && (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="h-5 w-5 mr-1" />
                          <span className="font-semibold text-sm">${tippedAmount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tip Amount Slider Panel */}
          <div className="lg:col-span-2">
            {selectedVendor ? (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="text-3xl">{getRoleEmoji(selectedVendor.role)}</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{selectedVendor.name}</h3>
                      <p className="text-purple-600 font-medium">{getRoleDisplayName(selectedVendor.role)}</p>
                    </div>
                  </div>
                </div>

                {!completedTips.has(selectedVendor.id) ? (
                  <>
                    {/* Interactive Tip Slider */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-800">Choose Your Tip Amount</h4>
                        <div className="text-2xl font-bold text-pink-600">${tipSliderValue}</div>
                      </div>
                      
                      {(() => {
                        const recommendations = getTipRecommendations(selectedVendor);
                        const minTip = Math.max(5, Math.floor(recommendations.low * 0.5));
                        const maxTip = recommendations.high * 2;
                        
                        return (
                          <>
                            <input
                              type="range"
                              min={minTip}
                              max={maxTip}
                              value={tipSliderValue}
                              onChange={(e) => setTipSliderValue(parseInt(e.target.value))}
                              className="w-full h-3 bg-gradient-to-r from-pink-200 via-pink-400 to-pink-600 rounded-lg appearance-none cursor-pointer slider"
                              style={{
                                background: `linear-gradient(to right, #fce7f3 0%, #f9a8d4 ${((tipSliderValue - minTip) / (maxTip - minTip)) * 50}%, #ec4899 ${((tipSliderValue - minTip) / (maxTip - minTip)) * 100}%, #e5e7eb ${((tipSliderValue - minTip) / (maxTip - minTip)) * 100}%, #e5e7eb 100%)`
                              }}
                            />
                            <div className="flex justify-between text-sm text-gray-600 mt-2">
                              <span>${minTip}</span>
                              <span className="text-center">
                                {tipSliderValue < recommendations.low && "🙂 Good"}
                                {tipSliderValue >= recommendations.low && tipSliderValue < recommendations.high && "😊 Great"}
                                {tipSliderValue >= recommendations.high && "🤩 Amazing"}
                              </span>
                              <span>${maxTip}+</span>
                            </div>
                            
                            {/* Reference Points */}
                            <div className="flex justify-between mt-4 text-xs">
                              <div className={`text-center ${tipSliderValue === recommendations.low ? 'text-pink-600 font-semibold' : 'text-gray-500'}`}>
                                <div className="w-2 h-2 mx-auto rounded-full bg-gray-300 mb-1"></div>
                                <p>Good Service</p>
                                <p>${recommendations.low}</p>
                              </div>
                              <div className={`text-center ${tipSliderValue === recommendations.medium ? 'text-pink-600 font-semibold' : 'text-gray-500'}`}>
                                <div className="w-2 h-2 mx-auto rounded-full bg-pink-400 mb-1"></div>
                                <p>Great Service</p>
                                <p>${recommendations.medium}</p>
                              </div>
                              <div className={`text-center ${tipSliderValue === recommendations.high ? 'text-pink-600 font-semibold' : 'text-gray-500'}`}>
                                <div className="w-2 h-2 mx-auto rounded-full bg-pink-600 mb-1"></div>
                                <p>Exceptional</p>
                                <p>${recommendations.high}</p>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Payment Info and Action */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">Payment Method:</span>
                        <div className="flex items-center">
                          <span className="mr-2">{getPaymentIcon(selectedVendor.preferredPayment)}</span>
                          <span className="text-sm font-medium">
                            {selectedVendor.preferredPayment === 'VENMO' && selectedVendor.venmoHandle}
                            {selectedVendor.preferredPayment === 'CASHAPP' && selectedVendor.cashAppHandle}
                            {selectedVendor.preferredPayment === 'STRIPE' && 'Credit/Debit Card'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedVendor(selectedVendor);
                        setShowTipModal(true);
                      }}
                      className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                      Tip ${tipSliderValue} Now
                    </button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h4 className="text-xl font-bold text-green-800 mb-2">Tip Completed!</h4>
                    <p className="text-green-700">You tipped ${tipAmounts[selectedVendor.id]} to {selectedVendor.name}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <Heart className="h-16 w-16 text-pink-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">Select a Vendor to Tip</h3>
                <p className="text-gray-500">Choose a service provider from the list on the left to get started with tipping.</p>
              </div>
            )}
          </div>
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
          initialAmount={tipSliderValue}
          onComplete={handleTipComplete}
          onClose={() => {
            setShowTipModal(false);
          }}
        />
      )}
    </div>
  );
}

// Tip Modal Component
function TipModal({ 
  vendor, 
  initialAmount,
  onComplete, 
  onClose 
}: { 
  vendor: Vendor; 
  initialAmount: number;
  onComplete: (vendorId: string, amount: number) => void;
  onClose: () => void;
}) {
  const [selectedAmount, setSelectedAmount] = useState<number>(initialAmount);
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

                      {/* Amount Confirmation */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Confirm tip amount:</h3>
              <div className="bg-pink-50 border-2 border-pink-200 rounded-lg p-4 mb-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-pink-600 mb-1">${selectedAmount}</div>
                  <div className="text-sm text-pink-700">
                    {selectedAmount < recommendations.low && "Good Service"}
                    {selectedAmount >= recommendations.low && selectedAmount < recommendations.high && "Great Service"}
                    {selectedAmount >= recommendations.high && "Exceptional Service"}
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or enter a different amount:
                </label>
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  placeholder="Custom amount"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    if (e.target.value) {
                      setSelectedAmount(parseFloat(e.target.value) || 0);
                    }
                  }}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

          {/* Payment Method */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-800">Payment Method:</span>
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
