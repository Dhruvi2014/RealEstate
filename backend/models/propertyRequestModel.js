import mongoose from 'mongoose';

const propertyRequestSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // The agent handling this property
      required: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // The owner of the property
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'payment_pending', 'confirmed'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    bookingAmount: {
      type: Number,
      required: true,
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    paymentMethod: {
      type: String,
      enum: ['online', 'cash', 'none'],
      default: 'none'
    }
  },
  {
    timestamps: true,
  }
);

const PropertyRequest = mongoose.model('PropertyRequest', propertyRequestSchema);

export default PropertyRequest;
