import PropertyRequest from '../models/propertyRequestModel.js';
import Property from '../models/propertymodel.js';
import User from '../models/Usermodel.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay
// Note: You need to create a Razorpay account and get Key ID and Key Secret
// Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

// User expresses interest
export const expressInterest = async (req, res) => {
  try {
    const { propertyId, agentId, bookingAmount } = req.body;
    const userId = req.user.id;

    // Check if request already exists
    let request = await PropertyRequest.findOne({ propertyId, userId });
    
    const dynamicTokenAmount = bookingAmount ? Number(bookingAmount) : 0;

    if (request) {
      // Update amount and return the existing request instead of erroring out
      request.bookingAmount = dynamicTokenAmount;
      if (request.status === 'rejected') {
         request.status = 'pending'; // Re-open request if it was previously rejected
      }
      await request.save();
    } else {
      // Lookup property to ensure it exists
      const property = await Property.findById(propertyId);
      if (!property) {
         return res.status(404).json({ success: false, message: 'Property not found' });
      }
      
      request = await PropertyRequest.create({
        propertyId,
        userId,
        agentId,
        status: 'pending',
        bookingAmount: dynamicTokenAmount,
      });

      // Notify agent via socket if connected
      const io = req.app.get('socketio');
      if (io) {
        io.to(agentId).emit('new_property_request', {
          message: 'New interest request for property',
          requestId: request._id,
          propertyId
        });
      }
    }

    // Notify agent via socket if connected
    const io = req.app.get('socketio');
    if (io) {
      io.to(agentId).emit('new_property_request', {
        message: 'New interest request for property',
        requestId: request._id,
        propertyId
      });
    }

    res.status(201).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Agent accepts or rejects request
export const updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, rejectionReason } = req.body;
    // status should be 'accepted' or 'rejected'

    const request = await PropertyRequest.findById(requestId);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    request.status = status;
    if (status === 'rejected') {
      request.rejectionReason = rejectionReason;
    } else if (status === 'accepted') {
      request.status = 'payment_pending';
    }

    await request.save();

    // Notify user via socket
    const io = req.app.get('socketio');
    if (io) {
      io.to(request.userId.toString()).emit('request_updated', {
        message: `Your request has been ${status}`,
        requestId: request._id,
        status: request.status
      });
    }

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Initiate payment for booking token
export const createPaymentOrder = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await PropertyRequest.findById(requestId);

    if (!request || request.status !== 'payment_pending') {
      return res.status(400).json({ success: false, message: 'Invalid request' });
    }

    const options = {
      amount: request.bookingAmount * 100, // in paise
      currency: 'INR',
      receipt: `receipt_${requestId}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);
    request.razorpayOrderId = order.id;
    await request.save();

    res.status(200).json({ success: true, orderId: order.id, amount: options.amount, currency: options.currency });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify payment and split commission
export const verifyPayment = async (req, res) => {
  try {
    const { requestId, razorpayPaymentId, razorpaySignature } = req.body;
    const request = await PropertyRequest.findById(requestId);

    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_secret';
    
    // Verification logic
    const generatedSignature = crypto.createHmac('sha256', key_secret)
                                      .update(request.razorpayOrderId + '|' + razorpayPaymentId)
                                      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    request.status = 'confirmed';
    request.razorpayPaymentId = razorpayPaymentId;
    await request.save();

    // Commission Split Logic (Razorpay Route / Transfers)
    // To do this, you need Razorpay Route enabled and linked accounts for agent and owner
    // This is a simulation of the payload you would send to slice the payment
    /*
    await razorpay.payments.transfer(razorpayPaymentId, {
      transfers: [
        {
          account: process.env.AGENT_RAZORPAY_ACCOUNT_ID, // Link agent account
          amount: request.bookingAmount * 0.10 * 100, // 10% commission
          currency: 'INR',
        },
        {
          account: process.env.OWNER_RAZORPAY_ACCOUNT_ID, // Link owner account
          amount: request.bookingAmount * 0.90 * 100, // 90%
          currency: 'INR',
        }
      ]
    });
    */

    // Notify agent instantly of successful booking via socket
    const io = req.app.get('socketio');
    if (io) {
      io.to(request.agentId.toString()).emit('booking_confirmed', {
        message: 'A booking has been confirmed!',
        requestId: request._id,
      });
    }

    res.status(200).json({ success: true, message: 'Payment successful and booking confirmed!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Confirm payment via Cash
export const confirmCashPayment = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await PropertyRequest.findById(requestId);

    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    request.status = 'confirmed';
    request.paymentMethod = 'cash';
    await request.save();

    // Notify agent instantly of cash booking via socket
    const io = req.app.get('socketio');
    if (io) {
      io.to(request.agentId.toString()).emit('booking_confirmed', {
        message: 'A cash booking has been confirmed by user!',
        requestId: request._id,
      });
    }

    res.status(200).json({ success: true, message: 'Cash payment confirmed!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get requests for the logged in agent
export const getAgentRequests = async (req, res) => {
  try {
    const requests = await PropertyRequest.find({ agentId: req.user.id })
      .populate('propertyId', 'title price')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all requests for admin
export const getAllRequests = async (req, res) => {
  try {
    let filter = {};
    if (req.user && req.user.role !== 'admin') {
      filter.agentId = req.user._id;
    }

    const requests = await PropertyRequest.find(filter)
      .populate('propertyId', 'title price')
      .populate('userId', 'name email')
      .populate('agentId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
