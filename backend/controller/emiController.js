export const calculateEmi = async (req, res) => {
  try {
    const { principal, rate, tenureMonths } = req.body;

    if (!principal || !rate || !tenureMonths) {
      return res.status(400).json({
        success: false,
        message: 'Please provide principal, rate, and tenureMonths'
      });
    }

    const p = Number(principal);
    const r = Number(rate) / 12 / 100;
    const n = Number(tenureMonths);

    let emi = 0;
    let totalPayment = 0;
    let totalInterest = 0;

    if (r === 0) {
      emi = p / n;
      totalPayment = p;
      totalInterest = 0;
    } else {
      emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      totalPayment = emi * n;
      totalInterest = totalPayment - p;
    }

    res.status(200).json({
      success: true,
      data: {
        emi: Math.round(emi),
        totalInterest: Math.round(totalInterest),
        totalPayment: Math.round(totalPayment)
      }
    });

  } catch (error) {
    console.error('Error calculating EMI:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate EMI',
      error: error.message
    });
  }
};
