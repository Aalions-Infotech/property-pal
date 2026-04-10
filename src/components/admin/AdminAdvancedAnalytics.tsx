import { useMemo } from "react";
import { TrendingUp, Users, Home, DollarSign, ArrowUpRight, ArrowDownRight, Target, Percent } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend, AreaChart, Area } from "recharts";

interface Props {
  listings: any[];
  users: any[];
  userRoles: any[];
  sponsorships: any[];
  leads?: any[];
}

const AdminAdvancedAnalytics = ({ listings, users, userRoles, sponsorships, leads = [] }: Props) => {
  const totalRevenue = sponsorships.filter(s => s.payment_status === "completed").reduce((a, s) => a + Number(s.amount), 0);
  const activeSponsors = sponsorships.filter(s => s.status === "active").length;
  const pendingCount = listings.filter(l => l.status === "pending").length;
  const approvedCount = listings.filter(l => l.status === "approved").length;

  // User growth over time
  const userGrowth = useMemo(() => {
    const map: Record<string, number> = {};
    users.forEach(u => {
      const month = new Date(u.created_at).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      map[month] = (map[month] || 0) + 1;
    });
    let cumulative = 0;
    return Object.entries(map).map(([name, count]) => {
      cumulative += count;
      return { name, newUsers: count, total: cumulative };
    });
  }, [users]);

  // Lead conversion funnel
  const leadFunnel = useMemo(() => {
    const total = leads.length;
    const contacted = leads.filter(l => l.status === "contacted").length;
    const converted = leads.filter(l => l.status === "converted").length;
    const closed = leads.filter(l => l.status === "closed").length;
    return [
      { name: "Total Leads", value: total, fill: "#3b82f6" },
      { name: "Contacted", value: contacted, fill: "#f59e0b" },
      { name: "Converted", value: converted, fill: "#10b981" },
      { name: "Closed", value: closed, fill: "#6b7280" },
    ];
  }, [leads]);

  // Revenue by month
  const revenueByMonth = useMemo(() => {
    const map: Record<string, number> = {};
    sponsorships.filter(s => s.payment_status === "completed").forEach(s => {
      const month = new Date(s.created_at).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      map[month] = (map[month] || 0) + Number(s.amount);
    });
    return Object.entries(map).slice(-12).map(([name, revenue]) => ({ name, revenue }));
  }, [sponsorships]);

  // City distribution
  const cityData = useMemo(() => {
    const map: Record<string, number> = {};
    listings.forEach(l => { map[l.city] = (map[l.city] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value }));
  }, [listings]);

  // Property type distribution
  const typeData = useMemo(() => {
    const map: Record<string, number> = {};
    listings.forEach(l => { map[l.property_type] = (map[l.property_type] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [listings]);

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

  // KPI calculations
  const avgPrice = listings.length ? listings.reduce((a, l) => a + Number(l.price), 0) / listings.length : 0;
  const conversionRate = leads.length ? ((leads.filter(l => l.status === "converted").length / leads.length) * 100).toFixed(1) : "0";
  const avgRevenuePerUser = users.length ? (totalRevenue / users.length).toFixed(0) : "0";

  // Listings trend by week
  const listingsTrend = useMemo(() => {
    const map: Record<string, number> = {};
    listings.forEach(l => {
      const week = new Date(l.created_at);
      const weekStart = new Date(week.setDate(week.getDate() - week.getDay()));
      const key = weekStart.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).slice(-12).map(([name, count]) => ({ name, count }));
  }, [listings]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, sub: `${activeSponsors} active sponsors`, icon: DollarSign, trend: "+12%", up: true },
          { label: "Total Users", value: users.length, sub: `${userRoles.filter(r => r.role === "agent").length} agents`, icon: Users, trend: "+8%", up: true },
          { label: "Conversion Rate", value: `${conversionRate}%`, sub: `${leads.length} total leads`, icon: Target, trend: "+3.2%", up: true },
          { label: "Avg Property Price", value: `₹${(avgPrice / 100000).toFixed(1)}L`, sub: `${listings.length} listings`, icon: Home, trend: "-2%", up: false },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <s.icon className="w-5 h-5 text-accent" />
              <span className={`text-xs font-medium flex items-center gap-0.5 ${s.up ? "text-emerald-600" : "text-red-500"}`}>
                {s.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {s.trend}
              </span>
            </div>
            <p className="text-2xl font-display font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-display font-semibold mb-4">Revenue Trend</h3>
          {revenueByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="text-muted-foreground text-center py-16">No revenue data yet</p>}
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-display font-semibold mb-4">User Growth</h3>
          {userGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="total" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} name="Total Users" />
                <Area type="monotone" dataKey="newUsers" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} name="New Users" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="text-muted-foreground text-center py-16">No data</p>}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-display font-semibold mb-4">Lead Funnel</h3>
          <div className="space-y-3">
            {leadFunnel.map((item, i) => (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">{item.name}</span>
                  <span className="text-sm font-bold">{item.value}</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${leadFunnel[0].value ? (item.value / leadFunnel[0].value) * 100 : 0}%`, backgroundColor: item.fill }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-display font-semibold mb-4">Property Types</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RPieChart>
              <Pie data={typeData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" paddingAngle={3}>
                {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </RPieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-display font-semibold mb-4">Weekly Listings</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={listingsTrend}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Cities & Role Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-display font-semibold mb-4">Top Cities by Listings</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cityData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-display font-semibold mb-4">Platform Summary</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Approved Listings", value: approvedCount, color: "text-emerald-600" },
              { label: "Pending Review", value: pendingCount, color: "text-amber-600" },
              { label: "Active Sponsorships", value: activeSponsors, color: "text-blue-600" },
              { label: "Agents", value: userRoles.filter(r => r.role === "agent").length, color: "text-purple-600" },
              { label: "Avg Revenue/User", value: `₹${Number(avgRevenuePerUser).toLocaleString("en-IN")}`, color: "text-accent" },
              { label: "Total Leads", value: leads.length, color: "text-cyan-600" },
              { label: "Featured Properties", value: listings.filter(l => l.is_featured).length, color: "text-yellow-600" },
              { label: "Verified Users", value: users.filter(u => u.is_verified).length, color: "text-emerald-600" },
            ].map(item => (
              <div key={item.label} className="bg-muted/30 rounded-xl p-4 text-center">
                <p className={`text-2xl font-display font-bold ${item.color}`}>{item.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAdvancedAnalytics;
