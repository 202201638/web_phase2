const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  stripePaymentIntentId: {
    type: String,
    required: true,
    unique: true
  },
  stripeCheckoutSessionId: {
    type: String,
    required: true,
    unique: true
  },
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toCreator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1 // Minimum $1 tip
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  fee: {
    type: Number,
    required: true
  },
  netAmount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['tip', 'purchase'],
    default: 'tip'
  },
  metadata: {
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video'
    },
    message: String,
    anonymous: {
      type: Boolean,
      default: false
    }
  },
  processedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
transactionSchema.index({ fromUser: 1, createdAt: -1 });
transactionSchema.index({ toCreator: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });

// Update the updatedAt field before saving
transactionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
