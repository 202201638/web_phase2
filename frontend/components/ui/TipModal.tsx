'use client';

import React, { useState } from 'react';
import { XMarkIcon, CurrencyDollarIcon, HeartIcon } from '@heroicons/react/24/outline';
import { loadStripe } from '@stripe/stripe-js';
import type { Stripe } from '@stripe/stripe-js';
import axios from 'axios';
import Cookies from 'js-cookie';

const stripePromise: Promise<Stripe | null> = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51TWuE55283q7IHtDuczebHVB5d9l6TbBjMBDYJPelCdOmQnOpNxWxDM3CCfPHcGG2HlapWXZLWDVddDyUKPD4o8n00Em1cY2s1');

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorId: string;
  creatorName: string;
  videoId?: string;
  videoTitle?: string;
}

export default function TipModal({ isOpen, onClose, creatorId, creatorName, videoId, videoTitle }: TipModalProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const predefinedAmounts = [5, 10, 25, 50, 100];

  const handleAmountSelect = (selectedAmount: number) => {
    setAmount(selectedAmount.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) < 1) {
      setError('Minimum tip amount is $1');
      return;
    }

    if (parseFloat(amount) > 10000) {
      setError('Maximum tip amount is $10,000');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get token from cookies (same as auth system)
      const token = Cookies.get('token');
      if (!token) {
        setError('You must be logged in to send a tip');
        setLoading(false);
        return;
      }

      const payload: any = {
        creatorId,
        amount: parseFloat(amount),
        message: message.trim()
      };

      if (videoId) {
        payload.videoId = videoId;
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/stripe/create-checkout-session`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const { url } = response.data.data;
      if (!url) {
        throw new Error('Stripe checkout session URL was not returned');
      }

      if (url.includes('checkout.stripe.com')) {
        window.location.href = url;
      } else if (url.startsWith('https://checkout.stripe.com/pay/')) {
        alert('Development Mode: Mock checkout session created.\n\nIn production, you would be redirected to Stripe Checkout.\n\nSession ID: ' + url.split('/').pop());
        onClose();
      } else {
        window.location.href = url;
      }
    } catch (err: any) {
      console.error('Tip error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to process tip');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        {/* Backdrop with glassmorphism */}
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white/95 backdrop-blur-md text-left shadow-xl transition-all">
          {/* Glass effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 to-pink-50/30 backdrop-blur-sm"></div>
          
          <div className="relative p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <CurrencyDollarIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Send a Tip
                  </h3>
                  <p className="text-sm text-gray-600">
                    to {creatorName}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {videoTitle && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Video:</span> {videoTitle}
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Amount selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tip Amount (USD)
                </label>
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {predefinedAmounts.map((presetAmount) => (
                    <button
                      key={presetAmount}
                      type="button"
                      onClick={() => handleAmountSelect(presetAmount)}
                      className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                        amount === presetAmount.toString()
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      ${presetAmount}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Custom amount"
                  min="1"
                  max="10000"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Say something nice..."
                  rows={3}
                  maxLength={200}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {message.length}/200 characters
                </p>
              </div>

              {/* Error message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading || !amount || parseFloat(amount) < 1}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <HeartIcon className="w-5 h-5" />
                    <span>Send ${amount || '0'} Tip</span>
                  </>
                )}
              </button>
            </form>

            {/* Security note */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                <span className="inline-flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Secured by Stripe
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
