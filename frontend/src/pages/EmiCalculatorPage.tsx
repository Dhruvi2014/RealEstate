import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, IndianRupee, Percent, Calendar, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { toast } from 'sonner';
import { emiAPI } from '../services/api';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

const EmiCalculatorPage: React.FC = () => {
  const [propertyPrice, setPropertyPrice] = useState<number>(5000000);
  const [downPayment, setDownPayment] = useState<number>(1000000);
  const [interestRate, setInterestRate] = useState<number>(8.5);
  const [tenureYears, setTenureYears] = useState<number>(20);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    emi: number;
    totalInterest: number;
    totalPayment: number;
  } | null>(null);

  const calculateEMI = async () => {
    const principal = propertyPrice - downPayment;
    if (principal <= 0) {
      toast.error('Down payment cannot be greater than or equal to property price');
      return;
    }
    if (interestRate <= 0) {
      toast.error('Interest rate must be greater than 0');
      return;
    }
    if (tenureYears <= 0) {
      toast.error('Tenure must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      const response = await emiAPI.calculate({
        principal,
        rate: interestRate,
        tenureMonths: tenureYears * 12
      });
      
      if (response.data && response.data.success) {
        setResult(response.data.data);
        toast.success('EMI calculated successfully!');
      } else {
        throw new Error(response.data.message || 'Failed to calculate EMI');
      }
    } catch (error: any) {
      console.error('Error calculating EMI:', error);
      // Fallback for demo/client-side calculation if backend fails/is not hooked up yet
      // This is a nice real-world fallback
      const p = principal;
      const r = interestRate / 12 / 100;
      const n = tenureYears * 12;
      const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      const totalAmount = emi * n;
      const totalInterest = totalAmount - p;

      setResult({
        emi: Math.round(emi),
        totalInterest: Math.round(totalInterest),
        totalPayment: Math.round(totalAmount)
      });
      toast.info('Calculated locally due to network delay.');
    } finally {
      setLoading(false);
    }
  };

  // Initial calculation on load
  useEffect(() => {
    calculateEMI();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const principalAmount = propertyPrice - downPayment;

  const chartData = [
    { name: 'Principal Amount', value: principalAmount, color: '#D4755B' },
    { name: 'Total Interest', value: result?.totalInterest || 0, color: '#111827' }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4] font-manrope">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-fraunces font-bold text-[#111827] mb-4">
            EMI Calculator
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Plan your home purchase with our advanced EMI calculator. Get instant insights into your monthly payments, interest outgo, and more.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-7 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-[#E6D5C3]"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-[#FAF8F4] p-3 rounded-xl text-[#D4755B]">
                <Calculator size={24} />
              </div>
              <h2 className="text-2xl font-bold font-fraunces text-[#111827]">Loan Details</h2>
            </div>

            <div className="space-y-8">
              {/* Property Price */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">Property Price</label>
                  <span className="text-sm font-bold text-[#D4755B]">{formatCurrency(propertyPrice)}</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <IndianRupee size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    value={propertyPrice}
                    onChange={(e) => setPropertyPrice(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 bg-[#FAF8F4] border border-[#E6D5C3] rounded-xl focus:ring-2 focus:ring-[#D4755B] focus:border-transparent outline-none transition-all"
                  />
                </div>
                <input
                  type="range"
                  min="500000"
                  max="100000000"
                  step="100000"
                  value={propertyPrice}
                  onChange={(e) => setPropertyPrice(Number(e.target.value))}
                  className="w-full mt-4 accent-[#D4755B]"
                />
              </div>

              {/* Down Payment */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">Down Payment</label>
                  <span className="text-sm font-bold text-[#D4755B]">{formatCurrency(downPayment)}</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <IndianRupee size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    value={downPayment}
                    onChange={(e) => setDownPayment(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 bg-[#FAF8F4] border border-[#E6D5C3] rounded-xl focus:ring-2 focus:ring-[#D4755B] focus:border-transparent outline-none transition-all"
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max={propertyPrice}
                  step="100000"
                  value={downPayment}
                  onChange={(e) => setDownPayment(Number(e.target.value))}
                  className="w-full mt-4 accent-[#D4755B]"
                />
              </div>

              {/* Interest Rate & Tenure */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">Interest Rate (p.a.)</label>
                    <span className="text-sm font-bold text-[#D4755B]">{interestRate}%</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Percent size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="number"
                      value={interestRate}
                      onChange={(e) => setInterestRate(Number(e.target.value))}
                      step="0.1"
                      className="w-full pl-10 pr-4 py-3 bg-[#FAF8F4] border border-[#E6D5C3] rounded-xl focus:ring-2 focus:ring-[#D4755B] focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="w-full mt-4 accent-[#D4755B]"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">Loan Tenure</label>
                    <span className="text-sm font-bold text-[#D4755B]">{tenureYears} Years</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Calendar size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="number"
                      value={tenureYears}
                      onChange={(e) => setTenureYears(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-3 bg-[#FAF8F4] border border-[#E6D5C3] rounded-xl focus:ring-2 focus:ring-[#D4755B] focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={tenureYears}
                    onChange={(e) => setTenureYears(Number(e.target.value))}
                    className="w-full mt-4 accent-[#D4755B]"
                  />
                </div>
              </div>

              <button
                onClick={calculateEMI}
                disabled={loading}
                className="w-full py-4 bg-[#111827] text-white font-bold rounded-xl hover:bg-[#2A3441] transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed mt-4"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>Calculate EMI</>
                )}
              </button>
            </div>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-5 flex flex-col gap-6"
          >
            {/* Primary Result Box */}
            <div className="bg-[#111827] text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#D4755B]/20 rounded-full -ml-8 -mb-8 blur-lg"></div>

              <h3 className="text-gray-300 font-medium mb-2 relative z-10">Your Equated Monthly Installment (EMI)</h3>
              <div className="flex items-baseline gap-2 mb-6 relative z-10">
                <span className="text-5xl font-fraunces font-bold text-[#D4755B]">
                  {result ? formatCurrency(result.emi) : '₹0'}
                </span>
                <span className="text-gray-400">/ month</span>
              </div>

              <div className="space-y-4 pt-6 border-t border-gray-700 relative z-10">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Principal Amount</span>
                  <span className="font-semibold">{formatCurrency(principalAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Interest</span>
                  <span className="font-semibold">{result ? formatCurrency(result.totalInterest) : '₹0'}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-gray-300 font-medium">Total Amount Payable</span>
                  <span className="font-bold text-[#FAF8F4]">{result ? formatCurrency(result.totalPayment) : '₹0'}</span>
                </div>
              </div>
            </div>

            {/* Chart Box */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#E6D5C3] flex-1 flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 mb-4 w-full px-2">
                <PieChartIcon size={20} className="text-[#D4755B]" />
                <h3 className="font-fraunces font-bold text-[#111827]">Payment Breakdown</h3>
              </div>
              
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      iconType="circle"
                      formatter={(value) => <span className="text-gray-700 font-medium ml-1">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EmiCalculatorPage;
