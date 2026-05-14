// Use Stripe secret key from environment variable
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = require('stripe')(stripeSecretKey);
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { getIO } = require('./socket');

// Create a checkout session for tipping
const createCheckoutSession = async (userId, creatorId, amount, videoId, message = '') => {
  try {
    // Calculate fees (Stripe takes 2.9% + 30¢)
    const stripeFee = Math.round((amount * 0.029) + 30);
    const netAmount = amount - stripeFee;
    const unitAmount = Math.round(amount * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Tip for Creator',
            description: message || 'Support your favorite creator'
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/tip-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/tip-cancelled`,
      metadata: {
        fromUser: userId,
        toCreator: creatorId,
        videoId: videoId || '',
        message: message || '',
        stripeFee: stripeFee.toString(),
        netAmount: netAmount.toString()
      },
    });

    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error.message);
    throw error;
  }
};

// Handle webhook events from Stripe
const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_1234567890abcdef';

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      await handleCheckoutSessionCompleted(session);
      break;

    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent was successful!', paymentIntent.id);
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      await handlePaymentFailed(failedPayment);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
};

// Handle successful checkout session
const handleCheckoutSessionCompleted = async (session) => {
  try {
    console.log('Checkout session completed:', session.id);

    // Create transaction record
    const transaction = new Transaction({
      stripePaymentIntentId: session.payment_intent,
      stripeCheckoutSessionId: session.id,
      fromUser: session.metadata.fromUser,
      toCreator: session.metadata.toCreator,
      amount: session.amount_total / 100, // Convert from cents
      currency: session.currency,
      status: 'completed',
      fee: parseInt(session.metadata.stripeFee),
      netAmount: parseInt(session.metadata.netAmount),
      type: 'tip',
      metadata: {
        videoId: session.metadata.videoId || null,
        message: session.metadata.message || '',
        anonymous: false
      },
      processedAt: new Date()
    });

    await transaction.save();

    // Increment creator's wallet balance by the net amount
    await User.findByIdAndUpdate(session.metadata.toCreator, {
      $inc: { walletBalance: parseInt(session.metadata.netAmount) }
    });

    // Send real-time notification to creator
    const io = getIO();
    io.to(session.metadata.toCreator).emit('new-tip', {
      transactionId: transaction._id,
      amount: session.amount_total / 100,
      message: session.metadata.message || '',
      fromUser: session.metadata.fromUser,
      videoId: session.metadata.videoId,
      timestamp: new Date().toISOString()
    });

    console.log('Transaction created and notification sent:', transaction._id);
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
};

// Handle failed payment
const handlePaymentFailed = async (paymentIntent) => {
  try {
    console.log('Payment failed:', paymentIntent.id);
    
    // Update transaction status if it exists
    await Transaction.findOneAndUpdate(
      { stripePaymentIntentId: paymentIntent.id },
      { 
        status: 'failed',
        updatedAt: new Date()
      }
    );
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
};

// Get creator's balance and transaction history
const getCreatorEarnings = async (creatorId) => {
  try {
    const transactions = await Transaction.find({
      toCreator: creatorId,
      status: 'completed'
    }).populate('fromUser', 'username')
      .populate('metadata.videoId', 'title')
      .sort({ createdAt: -1 });

    const totalEarnings = transactions.reduce((sum, tx) => sum + tx.netAmount, 0);
    const totalTips = transactions.length;

    return {
      totalEarnings,
      totalTips,
      recentTransactions: transactions.slice(0, 10)
    };
  } catch (error) {
    console.error('Error getting creator earnings:', error);
    throw error;
  }
};

// Get user's tipping history
const getUserTipHistory = async (userId) => {
  try {
    const transactions = await Transaction.find({
      fromUser: userId,
      status: 'completed'
    }).populate('toCreator', 'username')
      .populate('metadata.videoId', 'title')
      .sort({ createdAt: -1 });

    const totalTipped = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const totalTips = transactions.length;

    return {
      totalTipped,
      totalTips,
      recentTransactions: transactions.slice(0, 10)
    };
  } catch (error) {
    console.error('Error getting user tip history:', error);
    throw error;
  }
};

module.exports = {
  stripe,
  createCheckoutSession,
  handleWebhook,
  getCreatorEarnings,
  getUserTipHistory
};
