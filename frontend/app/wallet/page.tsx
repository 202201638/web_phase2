'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import axios from 'axios';
import Cookies from 'js-cookie';
import {
  CurrencyDollarIcon,
  BanknotesIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import { LoadingSpinner } from '@/components/ui/SkeletonLoader';

interface Transaction {
  _id: string;
  fromUser: {
    _id: string;
    username: string;
  };
  toCreator: {
    _id: string;
    username: string;
  };
  amount: number;
  netAmount: number;
  fee: number;
  status: string;
  type: string;
  metadata: {
    videoId?: {
      _id: string;
      title: string;
    };
    message?: string;
  };
  createdAt: string;
}

/**
 * Wallet page showing creator's pending balance and full transaction history
 * (both sent and received tips).
 */
export default function WalletPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [sentTips, setSentTips] = useState<Transaction[]>([]);
  const [receivedTips, setReceivedTips] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

  useEffect(() => {
    // Dispatch event to clear notification badge when visiting this page
    window.dispatchEvent(new CustomEvent('clear-notifications'));
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        setError('You must be logged in to view your wallet');
        setLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch earnings (received) and tip history (sent) in parallel
      const [earningsRes, tipHistoryRes] = await Promise.all([
        axios.get(`${API_URL}/stripe/earnings`, { headers }),
        axios.get(`${API_URL}/stripe/tip-history`, { headers }),
      ]);

      const earningsData = earningsRes.data.data;
      const tipHistoryData = tipHistoryRes.data.data;

      setBalance(earningsData.totalEarnings || 0);
      setReceivedTips(earningsData.recentTransactions || []);
      setSentTips(tipHistoryData.recentTransactions || []);
    } catch (err: any) {
      console.error('Failed to fetch wallet data:', err);
      setError(err.response?.data?.message || 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => (window.location.href = '/')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const currentTransactions = activeTab === 'received' ? receivedTips : sentTips;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-white mb-2">Wallet</h1>
          <p className="text-purple-100">
            Manage your tips and view transaction history
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Balance Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">
                Pending Balance
              </p>
              <p className="text-4xl font-bold text-gray-900">
                ${balance.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Net earnings after Stripe fees
              </p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
              <BanknotesIcon className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <ArrowDownIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Tips Received</p>
                <p className="text-xl font-bold text-gray-900">
                  {receivedTips.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <ArrowUpIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Tips Sent</p>
                <p className="text-xl font-bold text-gray-900">
                  {sentTips.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <CurrencyDollarIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Avg Tip Received</p>
                <p className="text-xl font-bold text-gray-900">
                  $
                  {receivedTips.length > 0
                    ? (balance / receivedTips.length).toFixed(2)
                    : '0.00'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('received')}
                className={`flex-1 py-3 px-6 text-sm font-medium text-center transition-colors ${
                  activeTab === 'received'
                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Received ({receivedTips.length})
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`flex-1 py-3 px-6 text-sm font-medium text-center transition-colors ${
                  activeTab === 'sent'
                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Sent ({sentTips.length})
              </button>
            </div>
          </div>

          {/* Transaction List */}
          <div className="divide-y divide-gray-100">
            {currentTransactions.length > 0 ? (
              currentTransactions.map((tx) => (
                <div key={tx._id} className="p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          activeTab === 'received'
                            ? 'bg-green-100'
                            : 'bg-purple-100'
                        }`}
                      >
                        {activeTab === 'received' ? (
                          <ArrowDownIcon className="w-5 h-5 text-green-600" />
                        ) : (
                          <ArrowUpIcon className="w-5 h-5 text-purple-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {activeTab === 'received'
                            ? `Tip from ${tx.fromUser?.username || 'Unknown'}`
                            : `Tip to ${tx.toCreator?.username || 'Unknown'}`}
                        </p>
                        {tx.metadata?.videoId && (
                          <p className="text-xs text-gray-500">
                            For: {tx.metadata.videoId.title}
                          </p>
                        )}
                        {tx.metadata?.message && (
                          <p className="text-xs text-gray-400 italic mt-0.5">
                            &ldquo;{tx.metadata.message}&rdquo;
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(tx.createdAt).toLocaleDateString()}{' '}
                          {new Date(tx.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-semibold ${
                          activeTab === 'received'
                            ? 'text-green-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {activeTab === 'received' ? '+' : '-'}$
                        {(activeTab === 'received'
                          ? tx.netAmount
                          : tx.amount
                        ).toFixed(2)}
                      </p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${
                          tx.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : tx.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-gray-500">
                <CurrencyDollarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-1">
                  {activeTab === 'received'
                    ? 'No tips received yet'
                    : 'No tips sent yet'}
                </p>
                <p className="text-sm">
                  {activeTab === 'received'
                    ? "When people tip your videos, they'll appear here."
                    : 'Tips you send to other creators will appear here.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
