import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Loader, CheckCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';
import AuthHeader from '../components/auth/AuthHeader';
import { userAPI } from '../services/api';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and new password');
      return;
    }

    setLoading(true);
    try {
      const { data } = await userAPI.forgotPassword({ email, password });
      if (data.success) {
        setIsSuccess(true);
        toast.success('Password successfully reset');
        setTimeout(() => {
          navigate('/signin');
        }, 2000);
      } else {
        toast.error(data.message || 'Failed to reset password');
      }
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(error.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center py-12 px-4">
      <div className="max-w-[480px] w-full">
        {/* Logo */}
        <AuthHeader />

        {/* Card */}
        <div className="bg-white border border-[#E6E0DA] rounded-2xl p-8 shadow-xl">
          {isSuccess ? (
            /* Success State */
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="font-syne font-bold text-2xl text-[#221410] mb-3">
                Password Reset Successfully!
              </h1>
              <p className="font-manrope font-extralight text-sm text-[#4B5563] mb-6 leading-relaxed">
                Your password has been changed. You can now use your new password to log in to BuildEstate.
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  to="/signin"
                  className="w-full bg-[#D4755B] text-white font-manrope font-bold py-3 rounded-xl hover:bg-[#C05621] transition-all text-center"
                >
                  Proceed to Sign In
                </Link>
              </div>
            </div>
          ) : (
            /* Form State */
            <>
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-[#FFF7ED] rounded-full flex items-center justify-center mx-auto mb-5">
                  <Lock className="w-7 h-7 text-[#D4755B]" />
                </div>
                <h1 className="font-syne font-bold text-3xl text-[#221410] mb-2">
                  Reset Password
                </h1>
                <p className="font-manrope font-extralight text-sm text-[#4B5563]">
                  Enter your email and a new password below.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Input */}
                <div>
                  <label className="block font-manrope font-medium text-sm text-[#374151] mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-[#F5F1E8] border border-[#EBE5DE] rounded-xl pl-12 pr-4 py-3.5 font-manrope text-sm text-[#221410] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#D4755B] focus:ring-1 focus:ring-[#D4755B] transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block font-manrope font-medium text-sm text-[#374151] mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#F5F1E8] border border-[#EBE5DE] rounded-xl pl-12 pr-4 py-3.5 font-manrope text-sm text-[#221410] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#D4755B] focus:ring-1 focus:ring-[#D4755B] transition-all"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#D4755B] hover:bg-[#C05621] disabled:opacity-60 disabled:cursor-not-allowed text-white font-manrope font-bold text-base py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>

              {/* Back to Sign In */}
              <Link
                to="/signin"
                className="flex items-center justify-center gap-2 mt-6 font-manrope font-medium text-sm text-[#64748B] hover:text-[#D4755B] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
