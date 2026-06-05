import { useState } from "react";
import { Calculator, DollarSign, TrendingDown, Building2, Percent, PieChart } from "lucide-react";
import { PieChart as RPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LeadForm from "@/components/LeadForm";

const HomeLoans = () => {
  const [activeTab, setActiveTab] = useState<"emi" | "stamp" | "afford">("emi");
  // EMI Calculator
  const [loanAmount, setLoanAmount] = useState(5000000);
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);

  // Stamp Duty Calculator
  const [propertyValue, setPropertyValue] = useState(5000000);
  const [stampState, setStampState] = useState("up");

  // Affordability
  const [monthlyIncome, setMonthlyIncome] = useState(150000);
  const [existingEmi, setExistingEmi] = useState(0);
  const [downPayment, setDownPayment] = useState(1000000);

  const monthlyRate = interestRate / 12 / 100;
  const months = tenure * 12;
  const emi = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
  const totalPayable = emi * months;
  const totalInterest = totalPayable - loanAmount;

  // Stamp duty rates by state
  // Lucknow-only project: stamp duty rates for Uttar Pradesh (effective 2024-25).
  // Female buyers get a 1% concession up to ₹1 Cr consideration (cap ₹10,000 rebate baked into 6% rate).
  // Joint (male + female) ownership is charged at 6.5%. Registration fee is 1% of consideration.
  const stampRates: Record<string, { duty: number; reg: number; label: string }> = {
    up:        { duty: 7,   reg: 1, label: "Lucknow (UP) – Male Buyer" },
    up_female: { duty: 6,   reg: 1, label: "Lucknow (UP) – Female Buyer" },
    up_joint:  { duty: 6.5, reg: 1, label: "Lucknow (UP) – Joint (Male + Female)" },
  };

  const selectedStamp = stampRates[stampState];
  const stampDuty = (propertyValue * selectedStamp.duty) / 100;
  const regCharges = (propertyValue * selectedStamp.reg) / 100;
  const gst = propertyValue > 4500000 ? propertyValue * 0.05 : propertyValue * 0.01;
  const totalExtraCost = stampDuty + regCharges;

  // Affordability calculation
  const maxEmiCapacity = (monthlyIncome * 0.5) - existingEmi;
  const affordableRate = interestRate / 12 / 100;
  const affordableMonths = tenure * 12;
  const maxLoan = maxEmiCapacity > 0 ? maxEmiCapacity * (Math.pow(1 + affordableRate, affordableMonths) - 1) / (affordableRate * Math.pow(1 + affordableRate, affordableMonths)) : 0;
  const maxProperty = maxLoan + downPayment;

  const emiPieData = [
    { name: "Principal", value: Math.round(loanAmount), color: "hsl(var(--accent))" },
    { name: "Interest", value: Math.round(totalInterest), color: "#ef4444" },
  ];

  const banks = [
    { name: "SBI Home Loan", rate: "8.50%", maxLoan: "₹10 Cr", tenure: "30 yrs", processing: "0.35%" },
    { name: "HDFC Home Loan", rate: "8.65%", maxLoan: "₹10 Cr", tenure: "30 yrs", processing: "0.5%" },
    { name: "ICICI Bank", rate: "8.75%", maxLoan: "₹5 Cr", tenure: "30 yrs", processing: "0.5%" },
    { name: "Axis Bank", rate: "8.70%", maxLoan: "₹5 Cr", tenure: "30 yrs", processing: "1%" },
    { name: "LIC HFL", rate: "8.60%", maxLoan: "₹15 Cr", tenure: "30 yrs", processing: "0.25%" },
    { name: "Bajaj Finserv", rate: "8.55%", maxLoan: "₹5 Cr", tenure: "30 yrs", processing: "4%" },
    { name: "Bank of Baroda", rate: "8.40%", maxLoan: "₹10 Cr", tenure: "30 yrs", processing: "0.5%" },
    { name: "Kotak Mahindra", rate: "8.80%", maxLoan: "₹5 Cr", tenure: "30 yrs", processing: "0.5%" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <div className="bg-gradient-navy py-10">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-gold text-xs font-bold tracking-widest mb-2">FINANCIAL TOOLS</p>
            <h1 className="text-4xl font-display font-bold text-white mb-2">Home Loans & Financial Tools</h1>
            <p className="text-white/60 text-sm">EMI Calculator, Stamp Duty Estimator, Affordability Checker & More</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Tool Tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide">
            {[
              { id: "emi" as const, label: "EMI Calculator", icon: Calculator },
              { id: "stamp" as const, label: "Stamp Duty Calculator", icon: Building2 },
              { id: "afford" as const, label: "Affordability Checker", icon: PieChart },
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === t.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
                <t.icon className="w-4 h-4" /> {t.label}
              </button>
            ))}
          </div>

          {/* EMI CALCULATOR */}
          {activeTab === "emi" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <div className="flex items-center gap-2 mb-6">
                  <Calculator className="w-5 h-5 text-accent" />
                  <h2 className="font-display font-bold text-xl">EMI Calculator</h2>
                </div>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium">Loan Amount</label>
                      <span className="text-sm font-bold text-accent">₹{(loanAmount / 100000).toFixed(1)}L</span>
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

              <div className="space-y-4">
                <div className="bg-gradient-gold rounded-2xl p-6">
                  <p className="text-sm font-semibold text-foreground/70 mb-1">Monthly EMI</p>
                  <p className="text-5xl font-display font-bold text-foreground">₹{Math.round(emi).toLocaleString()}</p>
                  <p className="text-sm text-foreground/60 mt-1">per month for {tenure} years</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card rounded-2xl border border-border p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Principal Amount</p>
                    <p className="font-display font-bold text-lg">₹{(loanAmount / 100000).toFixed(1)}L</p>
                  </div>
                  <div className="bg-card rounded-2xl border border-border p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Total Interest</p>
                    <p className="font-display font-bold text-lg text-destructive">₹{(totalInterest / 100000).toFixed(1)}L</p>
                  </div>
                </div>
                <div className="bg-card rounded-2xl border border-border p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Total Payable Amount</p>
                  <p className="font-display font-bold text-2xl text-accent">₹{(totalPayable / 100000).toFixed(1)}L</p>
                </div>
                {/* Pie Chart */}
                <div className="bg-card rounded-2xl border border-border p-4">
                  <ResponsiveContainer width="100%" height={180}>
                    <RPieChart>
                      <Pie data={emiPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                        {emiPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => `₹${(v / 100000).toFixed(1)}L`} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </RPieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* STAMP DUTY CALCULATOR */}
          {activeTab === "stamp" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <div className="flex items-center gap-2 mb-6">
                  <Building2 className="w-5 h-5 text-accent" />
                  <h2 className="font-display font-bold text-xl">Stamp Duty Calculator</h2>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Select State</label>
                    <select value={stampState} onChange={e => setStampState(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent">
                      {Object.entries(stampRates).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium">Property Value</label>
                      <span className="text-sm font-bold text-accent">₹{(propertyValue / 100000).toFixed(1)}L</span>
                    </div>
                    <input type="range" min={1000000} max={100000000} step={500000} value={propertyValue} onChange={e => setPropertyValue(Number(e.target.value))} className="w-full accent-accent" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>₹10L</span><span>₹10 Cr</span></div>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-4 space-y-2 text-sm">
                    <p className="font-medium">Rates for {selectedStamp.label}:</p>
                    <p className="text-muted-foreground">Stamp Duty: <span className="font-bold text-foreground">{selectedStamp.duty}%</span></p>
                    <p className="text-muted-foreground">Registration: <span className="font-bold text-foreground">{selectedStamp.reg}%</span></p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-gold rounded-2xl p-6">
                  <p className="text-sm font-semibold text-foreground/70 mb-1">Total Extra Cost</p>
                  <p className="text-4xl font-display font-bold text-foreground">₹{Math.round(totalExtraCost).toLocaleString("en-IN")}</p>
                  <p className="text-sm text-foreground/60 mt-1">on property value of ₹{(propertyValue / 100000).toFixed(1)}L</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card rounded-2xl border border-border p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Stamp Duty ({selectedStamp.duty}%)</p>
                    <p className="font-display font-bold text-lg">₹{Math.round(stampDuty).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="bg-card rounded-2xl border border-border p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Registration ({selectedStamp.reg}%)</p>
                    <p className="font-display font-bold text-lg">₹{Math.round(regCharges).toLocaleString("en-IN")}</p>
                  </div>
                </div>
                <div className="bg-card rounded-2xl border border-border p-5">
                  <h4 className="font-display font-semibold text-sm mb-3">Total Cost Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Property Value</span><span className="font-medium">₹{propertyValue.toLocaleString("en-IN")}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Stamp Duty</span><span className="font-medium">₹{Math.round(stampDuty).toLocaleString("en-IN")}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Registration</span><span className="font-medium">₹{Math.round(regCharges).toLocaleString("en-IN")}</span></div>
                    <div className="flex justify-between border-t border-border pt-2 font-bold">
                      <span>Total Investment</span>
                      <span className="text-accent">₹{Math.round(propertyValue + totalExtraCost).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AFFORDABILITY CHECKER */}
          {activeTab === "afford" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <div className="flex items-center gap-2 mb-6">
                  <PieChart className="w-5 h-5 text-accent" />
                  <h2 className="font-display font-bold text-xl">Affordability Checker</h2>
                </div>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium">Monthly Income</label>
                      <span className="text-sm font-bold text-accent">₹{monthlyIncome.toLocaleString("en-IN")}</span>
                    </div>
                    <input type="range" min={25000} max={1000000} step={5000} value={monthlyIncome} onChange={e => setMonthlyIncome(Number(e.target.value))} className="w-full accent-accent" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium">Existing EMIs</label>
                      <span className="text-sm font-bold text-accent">₹{existingEmi.toLocaleString("en-IN")}</span>
                    </div>
                    <input type="range" min={0} max={200000} step={1000} value={existingEmi} onChange={e => setExistingEmi(Number(e.target.value))} className="w-full accent-accent" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium">Down Payment Available</label>
                      <span className="text-sm font-bold text-accent">₹{(downPayment / 100000).toFixed(1)}L</span>
                    </div>
                    <input type="range" min={0} max={20000000} step={100000} value={downPayment} onChange={e => setDownPayment(Number(e.target.value))} className="w-full accent-accent" />
                  </div>
                  <div className="bg-muted/30 rounded-xl p-4 text-sm space-y-1 text-muted-foreground">
                    <p>• Banks typically allow EMI up to <strong className="text-foreground">50%</strong> of monthly income</p>
                    <p>• Interest rate: <strong className="text-foreground">{interestRate}%</strong> (adjust in EMI tab)</p>
                    <p>• Tenure: <strong className="text-foreground">{tenure} years</strong></p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-gold rounded-2xl p-6">
                  <p className="text-sm font-semibold text-foreground/70 mb-1">You Can Afford Up To</p>
                  <p className="text-4xl font-display font-bold text-foreground">₹{(maxProperty / 100000).toFixed(1)}L</p>
                  <p className="text-sm text-foreground/60 mt-1">based on your financial profile</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card rounded-2xl border border-border p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Max EMI Capacity</p>
                    <p className="font-display font-bold text-lg">₹{Math.max(0, Math.round(maxEmiCapacity)).toLocaleString("en-IN")}</p>
                    <p className="text-[10px] text-muted-foreground">per month</p>
                  </div>
                  <div className="bg-card rounded-2xl border border-border p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Max Loan Amount</p>
                    <p className="font-display font-bold text-lg">₹{(maxLoan / 100000).toFixed(1)}L</p>
                  </div>
                </div>
                <div className="bg-card rounded-2xl border border-border p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Down Payment</p>
                  <p className="font-display font-bold text-xl">₹{(downPayment / 100000).toFixed(1)}L</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">💡 Tip</p>
                  <p className="text-xs text-emerald-600/70 mt-1">Keep your total EMI obligations below 40% of income for comfortable finances. Consider a longer tenure for lower EMIs.</p>
                </div>
              </div>
            </div>
          )}

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

          {/* Lead form */}
          <div className="mt-10 max-w-lg mx-auto">
            <LeadForm title="Get Home Loan Assistance" />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HomeLoans;
