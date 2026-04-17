import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentsAPI, propertyRequestAPI } from '../../services/api';

interface ScheduleViewingCardProps {
  property: {
    name: string;
    id: string;
    price: number;
    agentId: string;
  };
}

const ScheduleViewingCard: React.FC<ScheduleViewingCardProps> = ({ property }) => {
  const imgBackground = "https://cdn-icons-png.flaticon.com/512/1067/1067566.png";
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    date: '',
    timeSlot: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Payment States
  const [processingPayment, setProcessingPayment] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [customAmount, setCustomAmount] = useState<number | ''>('');
  
  // Razorpay dynamic script loading helper
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    const checkExistingAppointment = async () => {
      if (user) {
        try {
          const res = await appointmentsAPI.getByUser();
          if (res.data && res.data.data) {
            const hasScheduled = res.data.data.some(
              (app: any) => app.propertyId?._id === property.id || app.propertyId === property.id
            );
            if (hasScheduled) {
              setSuccess(true);
            }
          }
        } catch (error) {
          console.error('Error checking existing appointments:', error);
        }
      }
    };
    checkExistingAppointment();
  }, [user, property.id]);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be signed in to schedule a visit', { description: 'Redirecting to login...' });
      navigate('/signin');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      await appointmentsAPI.schedule({
        propertyId: property.id,
        date: formData.date,
        time: formData.timeSlot,
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        message: `Viewing request for ${property.name}`,
      });
      setSuccess(true);
      toast.success('Visit Scheduled Successfully!', {
        description: "We'll confirm your appointment within 24 hours."
      });
      setFormData({ fullName: '', email: '', phone: '', date: '', timeSlot: '' });
    } catch (err: any) {
      console.error('Failed to schedule viewing:', err);
      const msg = err.response?.data?.message || 'Failed to schedule. Please try again.';
      setError(msg);
      toast.error('Scheduling Failed', {
        description: msg
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExpressInterest = async () => {
    if (!user) {
      toast.error('You must be signed in to make a payment', { description: 'Redirecting to login...' });
      navigate('/signin');
      return;
    }
    if (!customAmount || customAmount <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    try {
      setProcessingPayment(true);
      // 1. Load Razorpay script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error('Failed to load Razorpay SDK. Check your internet connection.');
        setProcessingPayment(false);
        return;
      }

      // Use agentId passed from the property
      const mappedAgentId = property.agentId;
      
      toast.info('Initiating payment request...');
      
      // Hit real API to express interest and create request record
      const res = await propertyRequestAPI.expressInterest({ 
        propertyId: property.id, 
        agentId: mappedAgentId,
        bookingAmount: Number(customAmount) 
      });

      // Automatically mock acceptance for demo purposes by agent (or we can just skip it if backend allows payment_pending directly)
      // Actually, we must accept it first.
      await propertyRequestAPI.updateStatus(res.data.data._id, 'accepted');

      const orderRes = await propertyRequestAPI.createPaymentOrder(res.data.data._id);
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_dummy_key_id',
        amount: orderRes.data.amount, // from backend order amount (in paise)
        currency: orderRes.data.currency,
        name: 'BuildEstate',
        description: `Booking Token for ${property.name}`,
        order_id: orderRes.data.orderId, // Razorpay order Id from backend
        handler: async function (response: any) {
          try {
            await propertyRequestAPI.verifyPayment({
              requestId: res.data.data._id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature || 'mock_signature'
            });
            setBookingConfirmed(true);
            toast.success('Payment Successful! Booking Confirmed.', {
               description: 'Payment details recorded and Agent has been notified.'
            });
          } catch (err: any) {
            toast.error('Payment verification failed on server.');
          }
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: '#D4755B',
        },
      };

      if (options.key === 'rzp_test_dummy_key_id' || !options.key) {
        toast.error('Developer configuration needed', {
          description: 'Please add VITE_RAZORPAY_KEY_ID to your frontend/.env.local file to test online payments.'
        });
        setProcessingPayment(false);
        return;
      }

      const paymentObject = new (window as any).Razorpay(options);
      
      // Catch modal closure without payment
      paymentObject.on('payment.failed', function (response: any) {
        console.error(response.error);
        toast.error('Payment cancelled or failed.');
        setProcessingPayment(false);
      });

      paymentObject.open();

    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Something went wrong during payment initiation.');
      setProcessingPayment(false);
    } 
  };

  const handleCashPayment = async () => {
    if (!user) {
      toast.error('You must be signed in to make a payment', { description: 'Redirecting to login...' });
      navigate('/signin');
      return;
    }
    if (!customAmount || customAmount <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    try {
      setProcessingPayment(true);
      toast.info('Processing cash payment request...');
      
      const mappedAgentId = property.agentId;
      
      const res = await propertyRequestAPI.expressInterest({ 
        propertyId: property.id, 
        agentId: mappedAgentId,
        bookingAmount: Number(customAmount) 
      });

      // Same logic, fast forward acceptance for demo
      await propertyRequestAPI.updateStatus(res.data.data._id, 'accepted');
      await propertyRequestAPI.confirmCashPayment(res.data.data._id);
      
      setBookingConfirmed(true);
      toast.success('Cash Payment Selected! Booking Confirmed.', {
        description: 'Payment details recorded and Agent has been notified.'
      });
    } catch (err: any) {
       console.error(err);
       toast.error(err.response?.data?.message || 'Something went wrong during cash payment.');
    } finally {
       setProcessingPayment(false);
    }
  };

  const handleReject = () => {
    toast.info('You have chosen not to proceed.', {
      description: 'You can explore other properties on our platform.'
    });
    setSuccess(false);
  };

  if (bookingConfirmed) {
    return (
      <div className="bg-white border border-[#E6E0DA] rounded-2xl p-8 shadow-lg sticky top-8 text-center transition-all">
        <span className="material-icons text-5xl text-[#22C55E] mb-4">gpp_good</span>
        <h3 className="font-syne text-xl text-[#0F172A] mb-2">Booking Confirmed!</h3>
        <p className="font-manrope font-extralight text-sm text-[#64748B] mb-6">
          Your payment arrangement of ₹{Number(customAmount).toLocaleString()} has been received successfully. The respective agent has been notified via Socket.IO.
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-white border border-[#E6E0DA] rounded-2xl p-8 shadow-lg sticky top-8 text-center transition-all animate-in fade-in zoom-in duration-300">
        <span className="material-icons text-5xl text-[#D4755B] mb-4">home_work</span>
        <h3 className="font-syne text-xl text-[#0F172A] mb-2">Did you visit the property?</h3>
        <p className="font-manrope font-extralight text-sm text-[#64748B] mb-6">
          If you've evaluated the property and you're interested, you can immediately pay a booking token to secure it. If not, you can reject.
        </p>
        
        <div className="flex flex-col gap-3">
          <div className="mb-2 text-left">
            <label className="block font-manrope font-extralight text-xs text-[#64748B] uppercase tracking-wider mb-2">
              Enter Booking Amount (₹)
            </label>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g. 5000"
              className="w-full bg-[#F5F1E8] border border-[#E6E0DA] rounded-lg px-4 py-3 font-manrope font-extralight text-sm text-[#0F172A] focus:outline-none focus:border-[#D4755B] transition-colors"
            />
          </div>
          
          <button
            onClick={handleExpressInterest}
            disabled={processingPayment}
            className="w-full bg-[#D4755B] hover:bg-[#C05621] disabled:opacity-50 text-white font-manrope font-bold text-sm py-3.5 rounded-xl transition-all shadow-md"
          >
            {processingPayment ? 'Processing...' : `I'm Interested & Pay Online`}
          </button>
          
          <button
            onClick={handleCashPayment}
            disabled={processingPayment}
            className="w-full bg-[#0F172A] hover:bg-[#1E293B] disabled:opacity-50 text-white font-manrope font-bold text-sm py-3.5 rounded-xl transition-all shadow-md"
          >
            {processingPayment ? 'Processing...' : `I'm Interested & Pay via Cash`}
          </button>
          
          <button
            onClick={handleReject}
            disabled={processingPayment}
            className="w-full bg-white border border-[#E6E0DA] hover:bg-[#F8F9FA] text-[#0F172A] font-manrope font-semibold text-sm py-3.5 rounded-xl transition-all"
          >
            Not Interested / Reject
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E6E0DA] rounded-2xl p-8 shadow-lg sticky top-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <span className="material-icons text-[#D4755B] text-xl">
          calendar_today
        </span>
        <h3 className="font-syne text-xl text-[#0F172A]">
          Schedule a Viewing
        </h3>
      </div>

      {/* Agent Info */}
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#E6E0DA]">
        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
          <img 
            src={imgBackground}
            alt="Agent"
            className="w-full h-full object-cover mt-2"
          />
        </div>
        <div>
          <p className="font-manrope font-medium text-sm text-[#0F172A] mb-0.5">
            Agent Name
          </p>
          <p className="font-manrope font-extralight text-xs text-[#64748B]">
            Senior Property Consultant
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block font-manrope font-extralight text-xs text-[#64748B] uppercase tracking-wider mb-2">
            Full Name
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            placeholder="Enter your full name"
            className="w-full bg-[#F5F1E8] border border-[#E6E0DA] rounded-lg px-4 py-3 font-manrope font-extralight text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#D4755B] transition-colors"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block font-manrope font-extralight text-xs text-[#64748B] uppercase tracking-wider mb-2">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="your.email@example.com"
            className="w-full bg-[#F5F1E8] border border-[#E6E0DA] rounded-lg px-4 py-3 font-manrope font-extralight text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#D4755B] transition-colors"
            required
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block font-manrope font-extralight text-xs text-[#64748B] uppercase tracking-wider mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="+91 98765 43210"
            className="w-full bg-[#F5F1E8] border border-[#E6E0DA] rounded-lg px-4 py-3 font-manrope font-extralight text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#D4755B] transition-colors"
            required
          />
        </div>

        {/* Date */}
        <div>
          <label className="block font-manrope font-extralight text-xs text-[#64748B] uppercase tracking-wider mb-2">
            Preferred Date
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            min={today}
            onChange={handleInputChange}
            className="w-full bg-[#F5F1E8] border border-[#E6E0DA] rounded-lg px-4 py-3 font-manrope font-extralight text-sm text-[#0F172A] focus:outline-none focus:border-[#D4755B] transition-colors"
            required
          />
        </div>

        {/* Time Slot */}
        <div>
          <label className="block font-manrope font-extralight text-xs text-[#64748B] uppercase tracking-wider mb-2">
            Time Slot
          </label>
          <select
            name="timeSlot"
            value={formData.timeSlot}
            onChange={handleInputChange}
            className="w-full bg-[#F5F1E8] border border-[#E6E0DA] rounded-lg px-4 py-3 font-manrope font-extralight text-sm text-[#0F172A] focus:outline-none focus:border-[#D4755B] transition-colors appearance-none cursor-pointer"
            required
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%230F172A' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 1rem center'
            }}
          >
            <option value="">Select time slot</option>
            <option value="09:00">09:00 AM - 10:00 AM</option>
            <option value="10:00">10:00 AM - 11:00 AM</option>
            <option value="11:00">11:00 AM - 12:00 PM</option>
            <option value="14:00">02:00 PM - 03:00 PM</option>
            <option value="15:00">03:00 PM - 04:00 PM</option>
            <option value="16:00">04:00 PM - 05:00 PM</option>
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-center font-manrope text-xs text-red-500 mt-2">{error}</p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#D4755B] hover:bg-[#C05621] disabled:opacity-60 disabled:cursor-not-allowed text-white font-manrope font-bold text-base py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl mt-6"
        >
          {submitting ? 'Scheduling...' : 'Schedule Visit'}
        </button>

        {/* Info Text */}
        <p className="text-center font-manrope font-extralight text-xs text-[#94A3B8] mt-4">
          We'll confirm your appointment within 24 hours
        </p>
      </form>
    </div>
  );
};

export default ScheduleViewingCard;