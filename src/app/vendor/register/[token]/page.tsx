'use client';

import { useState, useEffect, useCallback } from 'react';
import { Heart, CheckCircle, Clock, MapPin, Phone, Globe, DollarSign, User } from 'lucide-react';
import Link from 'next/link';

interface Invitation {
  id: string;
  token: string;
  email: string;
  vendorName: string;
  role: string;
  message?: string;
  status: string;
  expiresAt: string;
  wedding: {
    coupleName: string;
    weddingDate: string;
    venue?: string;
  };
  coordinator: {
    name: string;
    company?: string;
    email: string;
  };
}

interface VendorFormData {
  name: string;
  email: string;
  phone: string;
  role: string;
  bio: string;
  website: string;
  serviceArea: string;
  acceptsStripe: boolean;
  acceptsVenmo: boolean;
  acceptsCashApp: boolean;
  acceptsZelle: boolean;
  stripeAccountId: string;
  venmoHandle: string;
  cashAppHandle: string;
  zelleContact: string;
}

const PAYMENT_METHODS = [
  { key: 'acceptsStripe', label: 'Credit/Debit Card', icon: '💳', description: 'Secure card payments', detailField: 'stripeAccountId', detailLabel: 'Stripe Account ID (optional)', placeholder: 'acct_123456789' },
  { key: 'acceptsVenmo', label: 'Venmo', icon: '💜', description: 'Quick mobile payments', detailField: 'venmoHandle', detailLabel: 'Venmo Handle', placeholder: '@username' },
  { key: 'acceptsCashApp', label: 'Cash App', icon: '💚', description: 'Instant money transfer', detailField: 'cashAppHandle', detailLabel: 'Cash App Handle', placeholder: '$username' },
  { key: 'acceptsZelle', label: 'Zelle', icon: '⚡', description: 'Bank-to-bank transfer', detailField: 'zelleContact', detailLabel: 'Zelle Contact', placeholder: 'Phone number or email' },
] as const;

export default function VendorRegistration({ params }: { params: Promise<{ token: string }> }) {
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'invitation' | 'registration' | 'success'>('invitation');
  const [token, setToken] = useState('');


  const [formData, setFormData] = useState<VendorFormData>({
    name: '',
    email: '',
    phone: '',
    role: '',
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

  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchInvitation = useCallback(async (invitationToken: string) => {
    try {
      const response = await fetch(`/api/vendor/invitation/${invitationToken}`);
      if (response.ok) {
        const data = await response.json();
        setInvitation(data);
        
        // Pre-fill form with invitation data
        setFormData(prev => ({
          ...prev,
          name: data.vendorName,
          email: data.email,
          role: data.role
        }));

        // Check if invitation is expired
        if (new Date(data.expiresAt) < new Date()) {
          setStep('invitation'); // Show expired message
        } else if (data.status === 'ACCEPTED') {
          setStep('success'); // Already registered
        } else {
          setStep('registration');
        }
      } else {
        console.error('Failed to fetch invitation');
        // Invalid token - redirect or show error
      }
    } catch (error) {
      console.error('Error fetching invitation:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    params.then(({ token }) => {
      setToken(token);
      fetchInvitation(token);
    });
  }, [params, fetchInvitation]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    // Validate that at least one payment method is enabled
    const hasPaymentMethod = formData.acceptsStripe || formData.acceptsVenmo || formData.acceptsCashApp || formData.acceptsZelle;
    if (!hasPaymentMethod) {
      newErrors.payment = 'At least one payment method must be enabled';
    }

    // Validate payment method specific fields
    if (formData.acceptsVenmo && !formData.venmoHandle.trim()) {
      newErrors.venmoHandle = 'Venmo handle is required when Venmo is enabled';
    }

    if (formData.acceptsCashApp && !formData.cashAppHandle.trim()) {
      newErrors.cashAppHandle = 'Cash App handle is required when Cash App is enabled';
    }

    if (formData.acceptsZelle && !formData.zelleContact.trim()) {
      newErrors.zelleContact = 'Zelle contact information is required when Zelle is enabled';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/vendor/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invitationToken: token,
          ...formData
        }),
      });

      if (response.ok) {
        setStep('success');
      } else {
        const error = await response.json();
        console.error('Registration failed:', error);
        setErrors({ submit: error.error || 'Registration failed' });
      }
    } catch (error) {
      console.error('Error during registration:', error);
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
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
      COORDINATOR: 'Wedding Coordinator', 
      SETUP_ATTENDANT: 'Setup Team',
      PHOTOGRAPHER: 'Photographer'
    };
    return roleMap[role] || role;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-800">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Invalid Invitation</h1>
          <p className="text-gray-800 mb-6">
            This invitation link is invalid or has been cancelled.
          </p>
          <Link 
            href="/"
            className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Expired invitation
  if (new Date(invitation.expiresAt) < new Date()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⏰</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Invitation Expired</h1>
          <p className="text-gray-800 mb-6">
            This invitation expired on {formatDate(invitation.expiresAt)}. 
            Please contact {invitation.coordinator.name} for a new invitation.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-800">
              <strong>Coordinator:</strong> {invitation.coordinator.name}
            </p>
            <p className="text-sm text-gray-800">
              <strong>Email:</strong> {invitation.coordinator.email}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success page
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-green-800 mb-4">Registration Complete!</h1>
          <p className="text-gray-800 mb-6">
            Welcome to the TipWedding vendor network! You&apos;ve been successfully registered and added to {invitation.wedding.coupleName}&apos;s wedding.
          </p>
          <div className="bg-green-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-green-800 mb-2">What&apos;s Next?</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• The couple can now tip you through the wedding app</li>
              <li>• You&apos;ll receive notifications about tip payments</li>
              <li>• You can update your profile anytime</li>
            </ul>
          </div>
          <Link 
            href="/vendor/profile"
            className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Manage Profile
          </Link>
        </div>
      </div>
    );
  }

  // Registration form
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Heart className="h-8 w-8 text-purple-500 mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">TipWedding</h1>
          </div>
          <p className="text-gray-800">Vendor Registration</p>
        </div>

        {/* Invitation Details Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center mb-4">
            <Clock className="h-5 w-5 text-blue-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-800">You&apos;ve Been Invited!</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <User className="h-4 w-4 text-gray-400 mr-3" />
              <div>
                <span className="text-gray-800">Invited by:</span>
                <span className="ml-2 font-medium">{invitation.coordinator.name}</span>
                {invitation.coordinator.company && (
                  <span className="text-gray-500"> • {invitation.coordinator.company}</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center">
              <Heart className="h-4 w-4 text-pink-400 mr-3" />
              <div>
                <span className="text-gray-800">Wedding:</span>
                <span className="ml-2 font-medium">{invitation.wedding.coupleName}</span>
              </div>
            </div>
            
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-purple-400 mr-3" />
              <div>
                <span className="text-gray-800">Date:</span>
                <span className="ml-2">{formatDate(invitation.wedding.weddingDate)}</span>
              </div>
            </div>
            
            {invitation.wedding.venue && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 text-green-400 mr-3" />
                <div>
                  <span className="text-gray-800">Venue:</span>
                  <span className="ml-2">{invitation.wedding.venue}</span>
                </div>
              </div>
            )}
            
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-blue-400 mr-3" />
              <div>
                <span className="text-gray-800">Role:</span>
                <span className="ml-2 font-medium">{getRoleDisplayName(invitation.role)}</span>
              </div>
            </div>
          </div>

          {invitation.message && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Message from coordinator:</strong> {invitation.message}
              </p>
            </div>
          )}
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Complete Your Profile</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 border-b pb-2">Basic Information</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Your full name"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="your@email.com"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="h-3 w-3 inline mr-1" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="(555) 123-4567"
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="h-3 w-3 inline mr-1" />
                    Service Area
                  </label>
                  <input
                    type="text"
                    value={formData.serviceArea}
                    onChange={(e) => setFormData(prev => ({ ...prev, serviceArea: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Los Angeles, CA"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Globe className="h-3 w-3 inline mr-1" />
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    About You
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Tell us about your services, experience, and what makes you special..."
                  />
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 border-b pb-2 flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Payment Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Payment Methods * (Select all that you accept)
                  </label>
                  {errors.payment && <p className="text-red-500 text-xs mb-2">{errors.payment}</p>}
                  
                  <div className="space-y-4">
                    {PAYMENT_METHODS.map(method => (
                      <div key={method.key} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <input
                            type="checkbox"
                            id={method.key}
                            checked={formData[method.key as keyof VendorFormData] as boolean}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              [method.key]: e.target.checked 
                            }))}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <label htmlFor={method.key} className="ml-3 flex items-center cursor-pointer">
                            <span className="text-2xl mr-3">{method.icon}</span>
                            <div>
                              <div className="font-medium text-gray-800">{method.label}</div>
                              <div className="text-xs text-gray-500">{method.description}</div>
                            </div>
                          </label>
                        </div>
                        
                        {formData[method.key as keyof VendorFormData] && (
                          <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {method.detailLabel} {method.key !== 'acceptsStripe' ? '*' : ''}
                            </label>
                            <input
                              type="text"
                              required={method.key !== 'acceptsStripe'}
                              value={formData[method.detailField as keyof VendorFormData] as string}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                [method.detailField]: e.target.value 
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              placeholder={method.placeholder}
                            />
                            {errors[method.detailField] && (
                              <p className="text-red-500 text-xs mt-1">{errors[method.detailField]}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>


              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Completing Registration...
                </>
              ) : (
                'Complete Registration'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
