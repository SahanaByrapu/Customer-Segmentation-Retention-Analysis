import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  Download, 
  BarChart3, 
  Users,
  TrendingUp,
  Loader2,
  FileDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import api from "@/lib/api";

export default function Reports() {
  const [segments, setSegments] = useState([]);
  const [modelMetrics, setModelMetrics] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [segmentType, setSegmentType] = useState("Contract");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [segmentsRes, metricsRes, statsRes] = await Promise.all([
        api.getSegments(segmentType),
        api.getModelMetrics(),
        api.getDashboardStats()
      ]);
      
      setSegments(segmentsRes.data.segments);
      setModelMetrics(metricsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  }, [segmentType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async (riskLevel = null) => {
    setExporting(true);
    try {
      const response = await api.exportCustomers("csv", riskLevel);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `customers_export${riskLevel ? `_${riskLevel.toLowerCase()}_risk` : ''}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Export completed successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8" data-testid="reports-loading">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="reports-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>
            Reports & Export
          </h1>
          <p className="text-gray-500 mt-1">Generate and export customer analytics reports</p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => handleExport(null)}
            disabled={exporting}
            data-testid="export-all-btn"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export All
          </Button>
          <Button 
            className="bg-red-600 hover:bg-red-700"
            onClick={() => handleExport("High")}
            disabled={exporting}
            data-testid="export-high-risk-btn"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export High Risk
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-widget"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-50">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Total Customers</p>
              <p className="text-2xl font-black tabular-nums" style={{ fontFamily: 'Chivo, sans-serif' }}>
                {stats?.total_customers?.toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-widget"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-red-50">
              <TrendingUp className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Churn Rate</p>
              <p className="text-2xl font-black tabular-nums" style={{ fontFamily: 'Chivo, sans-serif' }}>
                {stats?.churn_rate}%
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-widget"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-emerald-50">
              <BarChart3 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Model Accuracy</p>
              <p className="text-2xl font-black tabular-nums" style={{ fontFamily: 'Chivo, sans-serif' }}>
                {modelMetrics?.metrics?.accuracy ? (modelMetrics.metrics.accuracy * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-widget"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-amber-50">
              <FileText className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">High Risk</p>
              <p className="text-2xl font-black tabular-nums" style={{ fontFamily: 'Chivo, sans-serif' }}>
                {stats?.high_risk_customers?.toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Segment Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="card-widget" data-testid="segment-analysis-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="card-header-label">Segment Analysis</CardTitle>
              <Select value={segmentType} onValueChange={setSegmentType}>
                <SelectTrigger className="w-[180px]" data-testid="segment-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Contract">By Contract</SelectItem>
                  <SelectItem value="InternetService">By Internet Service</SelectItem>
                  <SelectItem value="RiskLevel">By Risk Level</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Segment</TableHead>
                  <TableHead className="text-right">Customers</TableHead>
                  <TableHead className="text-right">Churn Rate</TableHead>
                  <TableHead className="text-right">Avg CLV</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {segments.map((segment) => (
                  <TableRow key={segment.segment_name}>
                    <TableCell className="font-medium">{segment.segment_name}</TableCell>
                    <TableCell className="text-right font-mono">
                      {segment.total_customers.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge 
                        className={
                          segment.churn_rate > 30 ? "risk-high" :
                          segment.churn_rate > 15 ? "risk-medium" : "risk-low"
                        }
                      >
                        {segment.churn_rate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${segment.avg_clv.toFixed(0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Model Performance */}
        <Card className="card-widget" data-testid="model-performance-card">
          <CardHeader className="pb-2">
            <CardTitle className="card-header-label flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-500" />
              XGBoost Model Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {modelMetrics?.metrics && Object.entries(modelMetrics.metrics).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {key.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${value * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-mono text-sm w-14 text-right">
                      {(value * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Importance */}
      <Card className="card-widget" data-testid="feature-importance-card">
        <CardHeader className="pb-2">
          <CardTitle className="card-header-label">Feature Importance (Top 10)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modelMetrics?.feature_importance && 
              Object.entries(modelMetrics.feature_importance).slice(0, 10).map(([feature, importance], index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-xs text-gray-400 w-4">{index + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 capitalize">
                        {feature.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="font-mono text-xs text-gray-500">
                        {(importance * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${importance * 100}%` }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                      ></motion.div>
                    </div>
                  </div>
                </motion.div>
              ))
            }
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
