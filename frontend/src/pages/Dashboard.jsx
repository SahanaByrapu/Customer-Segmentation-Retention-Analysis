import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  UserMinus, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle,
  Activity,
  Target,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import api from "@/lib/api";

const COLORS = {
  churn: "#EF4444",
  retention: "#10B981",
  neutral: "#9CA3AF",
  primary: "#2563EB",
  warning: "#F59E0B"
};

const StatCard = ({ title, value, icon: Icon, trend, color, subtext }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="stat-card card-widget"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="card-header-label mb-2">{title}</p>
        <p className="text-3xl font-black text-gray-900 tabular-nums" style={{ fontFamily: 'Chivo, sans-serif' }}>
          {value}
        </p>
        {subtext && (
          <p className="text-sm text-gray-500 mt-1">{subtext}</p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6" strokeWidth={1.5} />
      </div>
    </div>
    {trend !== undefined && (
      <div className="mt-4 flex items-center gap-2">
        <Badge variant={trend >= 0 ? "default" : "destructive"} className="text-xs">
          {trend >= 0 ? "+" : ""}{trend}%
        </Badge>
        <span className="text-xs text-gray-500">vs last month</span>
      </div>
    )}
  </motion.div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}%
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [tenureChart, setTenureChart] = useState([]);
  const [chargesChart, setChargesChart] = useState([]);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, tenureRes, chargesRes, segmentsRes] = await Promise.all([
        api.getDashboardStats(),
        api.getTenureChurnChart(),
        api.getMonthlyChargesChart(),
        api.getSegments("Contract")
      ]);
      
      setStats(statsRes.data);
      setTenureChart(tenureRes.data);
      setChargesChart(chargesRes.data);
      setSegments(segmentsRes.data.segments);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="p-8" data-testid="dashboard-loading">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const riskData = [
    { name: "Low Risk", value: stats?.low_risk_customers || 0, color: COLORS.retention },
    { name: "Medium Risk", value: stats?.medium_risk_customers || 0, color: COLORS.warning },
    { name: "High Risk", value: stats?.high_risk_customers || 0, color: COLORS.churn }
  ];

  return (
    <div className="p-8" data-testid="dashboard">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>
          Dashboard
        </h1>
        <p className="text-gray-500 mt-1">Customer churn analytics and retention insights</p>
      </div>

      {/* KPI Cards - Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Customers"
          value={stats?.total_customers?.toLocaleString()}
          icon={Users}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Churn Rate"
          value={`${stats?.churn_rate}%`}
          icon={UserMinus}
          color="bg-red-50 text-red-600"
          subtext={`${stats?.churned_customers} churned`}
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${(stats?.total_mrr / 1000)?.toFixed(0)}K`}
          icon={DollarSign}
          color="bg-emerald-50 text-emerald-600"
          subtext={`Avg: $${stats?.avg_mrr?.toFixed(2)}/customer`}
        />
        <StatCard
          title="Avg CLV"
          value={`$${stats?.avg_clv?.toFixed(0)}`}
          icon={TrendingUp}
          color="bg-violet-50 text-violet-600"
        />
      </div>

      {/* Risk Distribution & Model Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Risk Distribution */}
        <Card className="card-widget col-span-1" data-testid="risk-distribution-card">
          <CardHeader className="pb-2">
            <CardTitle className="card-header-label">Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {riskData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs text-gray-600">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* High Risk Alert */}
        <Card className="card-widget col-span-1" data-testid="high-risk-card">
          <CardHeader className="pb-2">
            <CardTitle className="card-header-label flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              High Risk Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-5xl font-black text-red-600 tabular-nums" style={{ fontFamily: 'Chivo, sans-serif' }}>
                {stats?.high_risk_customers}
              </p>
              <p className="text-gray-500 text-sm mt-2">Require immediate attention</p>
            </div>
            <div className="space-y-3 mt-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Risk Score Progress</span>
                  <span className="font-mono text-gray-900">
                    {((stats?.high_risk_customers / stats?.total_customers) * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={(stats?.high_risk_customers / stats?.total_customers) * 100} 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Model Metrics */}
        <Card className="card-widget col-span-1" data-testid="model-metrics-card">
          <CardHeader className="pb-2">
            <CardTitle className="card-header-label flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              Model Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.model_metrics && Object.entries(stats.model_metrics).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">{key.replace('_', ' ')}</span>
                  <span className="font-mono text-sm font-medium text-gray-900">
                    {(value * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Tenure vs Churn */}
        <Card className="card-widget" data-testid="tenure-churn-chart">
          <CardHeader className="pb-2">
            <CardTitle className="card-header-label flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              Churn Rate by Tenure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tenureChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="tenure_bucket" 
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="actual_churn_rate" 
                    name="Actual Churn" 
                    stroke={COLORS.churn}
                    strokeWidth={2}
                    dot={{ fill: COLORS.churn }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avg_churn_prob" 
                    name="Predicted Churn" 
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: COLORS.primary }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Charges Distribution */}
        <Card className="card-widget" data-testid="charges-chart">
          <CardHeader className="pb-2">
            <CardTitle className="card-header-label flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              Customers by Monthly Charges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chargesChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="charges_bucket" 
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="retained" name="Retained" fill={COLORS.retention} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="churned" name="Churned" fill={COLORS.churn} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segment Analysis */}
      <Card className="card-widget" data-testid="segments-card">
        <CardHeader className="pb-2">
          <CardTitle className="card-header-label flex items-center gap-2">
            <Target className="w-4 h-4 text-gray-500" />
            Churn by Contract Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {segments.map((segment) => (
              <div 
                key={segment.segment_name} 
                className="p-4 border border-gray-200 rounded-sm hover:border-blue-300 transition-colors"
              >
                <p className="text-sm font-medium text-gray-900 mb-3">{segment.segment_name}</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Customers</span>
                    <span className="font-mono text-sm">{segment.total_customers.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Churn Rate</span>
                    <span className={`font-mono text-sm ${segment.churn_rate > 30 ? 'text-red-600' : segment.churn_rate > 15 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {segment.churn_rate}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Avg CLV</span>
                    <span className="font-mono text-sm">${segment.avg_clv.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
