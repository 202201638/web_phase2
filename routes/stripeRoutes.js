const express = require('express');
const { protect } = require('../middleware/auth');
const { createCheckoutSession, getCreatorEarnings, getUserTipHistory } = require('../config/stripe');
const asyncHandler = require('../middleware/asyncHandler');
const mongoose = require('mongoose');
const { createTipSchema, validate } = require('../validators/validationSchemas');

const router = express.Router();

// Create checkout session for tipping
router.post('/create-checkout-session', protect, validate(createTipSchema), asyncHandler(async (req, res) => {
  const { creatorId, amount, videoId, message } = req.body;

  // Validate input
  if (!creatorId || !amount || amount < 1) {
    return res.status(400).json({
      success: false,
      message: 'Creator ID and valid amount (minimum $1) are required'
    });
  }

  if (amount > 10000) { // $10,000 max tip
    return res.status(400).json({
      success: false,
      message: 'Maximum tip amount is $10,000'
    });
  }

  try {
    const session = await createCheckoutSession(
      req.user._id,
      creatorId,
      amount,
      videoId,
      message
    );

    res.status(200).json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url
      }
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to create checkout session'
    });
  }
}));

// Stripe webhook endpoint
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const { handleWebhook } = require('../config/stripe');
    await handleWebhook(req, res);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ received: false });
  }
});

// Get creator earnings
router.get('/earnings', protect, asyncHandler(async (req, res) => {
  try {
    const earnings = await getCreatorEarnings(req.user._id);

    res.status(200).json({
      success: true,
      data: earnings
    });
  } catch (error) {
    console.error('Error getting creator earnings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get earnings'
    });
  }
}));

// Get user tip history
router.get('/tip-history', protect, asyncHandler(async (req, res) => {
  try {
    const tipHistory = await getUserTipHistory(req.user._id);

    res.status(200).json({
      success: true,
      data: tipHistory
    });
  } catch (error) {
    console.error('Error getting tip history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tip history'
    });
  }
}));

// Get public creator stats (for display on profile)
router.get('/creator-stats/:creatorId', asyncHandler(async (req, res) => {
  try {
    const { creatorId } = req.params;
    const Transaction = require('../models/Transaction');

    const stats = await Transaction.aggregate([
      {
        $match: {
          toCreator: mongoose.Types.ObjectId(creatorId),
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$netAmount' },
          totalTips: { $sum: 1 },
          averageTip: { $avg: '$amount' }
        }
      }
    ]);

    const result = stats[0] || {
      totalEarnings: 0,
      totalTips: 0,
      averageTip: 0
    };

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting creator stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get creator stats'
    });
  }
}));

module.exports = router;
