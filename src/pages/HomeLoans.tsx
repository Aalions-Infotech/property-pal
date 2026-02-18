import { useState } from "react";
import { Calculator, DollarSign, TrendingDown, ChevronDown } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const HomeLoans = () => {
  const [loanAmount, setLoanAmount] = useState(5000000);
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);

  const monthlyRate = interestRate / 12 / 100;
  const months = tenure * 12;
  const emi = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
  const totalPayable = emi * months;
  const totalInterest = totalPayable - loanAmount;

  const banks = [
    { name: "SBI Home Loan", rate: "8.50%", maxLoan: "₹10 Cr", tenure: "30 yrs", processing: "0.35%" },
    { name: "HDFC Home Loan", rate: "8.65%", maxLoan: "₹10 Cr", tenure: "30 yrs", processing: "0.5%" },
    { name: "ICICI Bank", rate: "8.75%", maxLoan: "₹5 Cr", tenure: "30 yrs", processing: "0.5%" },
    { name: "Axis Bank", rate: "8.70%", maxLoan: "₹5 Cr", tenure: "30 yrs", processing: "1%" },
    { name: "LIC HFL", rate: "8.60%", maxLoan: "₹15 Cr", tenure: "30 yrs", processing: "0.25%" },
    { name: "Bajaj Finserv", rate: "8.55%", maxLoan: "₹5 Cr", tenure: "30 yrs", processing: "4%" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <div className="bg-gradient-navy py-10">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-gold text-xs font-bold tracking-widest mb-2">FINANCIAL TOOLS</p>
            <h1 className="text-4xl font-display font-bold text-white mb-2">Home Loans & EMI Calculator</h1>
            <p className="text-white/60 text-sm">Compare rates, calculate EMI, and apply for home loans</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            {/* Calculator */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <div className="flex items-center gap-2 mb-6">
                <Calculator className="w-5 h-5 text-accent" />
                <h2 className="font-display font-bold text-xl">EMI Calculator</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">Loan Amount</label>
                    <span className="text-sm font-bold text-accent">₹{(loanAmount/100000).toFixed(1)}L</span>
                  </div>
                  <input type="range" min={500000} max={50000000} step={100000} value={loanAmount} onChange={e => setLoanAmount(Number(e.target.value))} className="w-full accent-accent" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>₹5L</span><span>₹5 Cr</span></div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">Interest Rate</label>
                    <span className="text-sm font-bold text-accent">{interestRate}%</span>
                  </div>
                  <input type="range" min={6} max={15} step={0.05} value={interestRate} onChange={e => setInterestRate(Number(e.target.value))} className="w-full accent-accent" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>6%</span><span>15%</span></div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">Tenure</label>
                    <span className="text-sm font-bold text-accent">{tenure} years</span>
                  </div>
                  <input type="range" min={5} max={30} step={1} value={tenure} onChange={e => setTenure(Number(e.target.value))} className="w-full accent-accent" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>5 yrs</span><span>30 yrs</span></div>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
              <div className="bg-gradient-gold rounded-2xl p-6">
                <p className="text-sm font-semibold text-foreground/70 mb-1">Monthly EMI</p>
                <p className="text-5xl font-display font-bold text-foreground">₹{Math.round(emi).toLocaleString()}</p>
                <p className="text-sm text-foreground/60 mt-1">per month for {tenure} years</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card rounded-2xl border border-border p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Principal Amount</p>
                  <p className="font-display font-bold text-lg">₹{(loanAmount/100000).toFixed(1)}L</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Total Interest</p>
                  <p className="font-display font-bold text-lg text-destructive">₹{(totalInterest/100000).toFixed(1)}L</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-4 text-center col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Total Payable Amount</p>
                  <p className="font-display font-bold text-2xl text-accent">₹{(totalPayable/100000).toFixed(1)}L</p>
                </div>
              </div>
              <button className="w-full btn-navy py-3 rounded-xl text-sm font-medium">Apply for Home Loan</button>
            </div>
          </div>

          {/* Bank Comparison */}
          <h2 className="font-display font-bold text-2xl mb-5">Compare Home Loan Rates</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm bg-card rounded-2xl border border-border overflow-hidden">
              <thead className="bg-muted">
                <tr>
                  {["Bank / Lender", "Interest Rate", "Max Loan", "Max Tenure", "Processing Fee", "Action"].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {banks.map(bank => (
                  <tr key={bank.name} className="hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 font-semibold">{bank.name}</td>
                    <td className="py-3 px-4 font-bold text-accent">{bank.rate} p.a.</td>
                    <td className="py-3 px-4">{bank.maxLoan}</td>
                    <td className="py-3 px-4">{bank.tenure}</td>
                    <td className="py-3 px-4">{bank.processing}</td>
                    <td className="py-3 px-4"><button className="px-3 py-1.5 btn-gold rounded-lg text-xs">Apply</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HomeLoans;
