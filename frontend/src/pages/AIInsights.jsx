import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  Loader2, 
  User,
  TrendingDown,
  Lightbulb,
  Target,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/lib/api";

export default function AIInsights() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customInput, setCustomInput] = useState({
    churn_probability: 0.65,
    risk_level: "High",
    tenure: 6,
    contract: "Month-to-month",
    monthly_charges: 85,
    internet_service: "Fiber optic",
    services: []
  });
  const [mode, setMode] = useState("customer"); // "customer" or "custom"

  const fetchHighRiskCustomers = useCallback(async () => {
    try {
      const response = await api.getCustomers({
        risk_level: "High",
        limit: 10,
        sort_by: "churn_probability",
        sort_order: "desc"
      });
      setCustomers(response.data.customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  }, []);

  useEffect(() => {
    fetchHighRiskCustomers();
  }, [fetchHighRiskCustomers]);

  const handleGetRecommendation = async () => {
    setLoading(true);
    setRecommendation(null);

    try {
      const requestData = mode === "customer" && selectedCustomer
        ? {
            customer_id: selectedCustomer.customerID,
            churn_probability: selectedCustomer.churn_probability,
            risk_level: selectedCustomer.risk_level,
            tenure: selectedCustomer.tenure,
            contract: selectedCustomer.Contract,
            monthly_charges: selectedCustomer.MonthlyCharges,
            internet_service: selectedCustomer.InternetService,
            services: [
              selectedCustomer.OnlineSecurity === "Yes" ? "Online Security" : null,
              selectedCustomer.TechSupport === "Yes" ? "Tech Support" : null,
              selectedCustomer.StreamingTV === "Yes" ? "Streaming TV" : null,
              selectedCustomer.StreamingMovies === "Yes" ? "Streaming Movies" : null,
            ].filter(Boolean)
          }
        : customInput;

      const response = await api.getAIRecommendations(requestData);
      setRecommendation(response.data);
      toast.success("AI recommendation generated successfully");
    } catch (error) {
      console.error("Error getting recommendation:", error);
      toast.error("Failed to generate AI recommendation");
    } finally {
      setLoading(false);
    }
  };

  const formatRecommendation = (text) => {
    if (!text) return null;
    
    // Split by headers and format
    const sections = text.split(/(\*\*[^*]+\*\*)/g);
    
    return sections.map((section, index) => {
      if (section.startsWith("**") && section.endsWith("**")) {
        const headerText = section.replace(/\*\*/g, "");
        return (
          <h4 key={index} className="text-sm font-semibold text-gray-900 mt-4 mb-2 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-violet-500" />
            {headerText}
          </h4>
        );
      }
      
      // Format numbered lists
      const lines = section.split('\n').filter(line => line.trim());
      return lines.map((line, lineIndex) => {
        const trimmedLine = line.trim();
        if (trimmedLine.match(/^\d+\./)) {
          return (
            <p key={`${index}-${lineIndex}`} className="text-sm text-gray-700 ml-4 mb-2">
              {trimmedLine}
            </p>
          );
        }
        if (trimmedLine.startsWith("-") || trimmedLine.startsWith("•")) {
          return (
            <p key={`${index}-${lineIndex}`} className="text-sm text-gray-700 ml-6 mb-1">
              {trimmedLine}
            </p>
          );
        }
        if (trimmedLine) {
          return (
            <p key={`${index}-${lineIndex}`} className="text-sm text-gray-700 mb-2">
              {trimmedLine}
            </p>
          );
        }
        return null;
      });
    });
  };

  return (
    <div className="p-8" data-testid="ai-insights-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>
          AI Retention Insights
        </h1>
        <p className="text-gray-500 mt-1">GPT-5.2 powered retention recommendations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Selection */}
        <div className="lg:col-span-1 space-y-6">
          {/* Mode Toggle */}
          <Card className="card-widget" data-testid="mode-toggle-card">
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <Button
                  variant={mode === "customer" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setMode("customer")}
                  data-testid="mode-customer-btn"
                >
                  <User className="w-4 h-4 mr-2" />
                  Select Customer
                </Button>
                <Button
                  variant={mode === "custom" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setMode("custom")}
                  data-testid="mode-custom-btn"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Custom Input
                </Button>
              </div>
            </CardContent>
          </Card>

          {mode === "customer" ? (
            /* High Risk Customers */
            <Card className="card-widget" data-testid="high-risk-customers-card">
              <CardHeader className="pb-2">
                <CardTitle className="card-header-label flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  High Risk Customers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {customers.map((customer) => (
                    <motion.div
                      key={customer.customerID}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedCustomer?.customerID === customer.customerID
                          ? "border-violet-500 bg-violet-50"
                          : "border-gray-200 hover:border-violet-300"
                      }`}
                      onClick={() => setSelectedCustomer(customer)}
                      data-testid={`customer-select-${customer.customerID}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm">{customer.customerID}</span>
                        <Badge className="risk-high">
                          {(customer.churn_probability * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {customer.Contract} • ${customer.MonthlyCharges.toFixed(0)}/mo
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Custom Input Form */
            <Card className="card-widget" data-testid="custom-input-card">
              <CardHeader className="pb-2">
                <CardTitle className="card-header-label">Custom Scenario</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs">Churn Probability</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <Slider
                      value={[customInput.churn_probability * 100]}
                      onValueChange={([v]) => setCustomInput(prev => ({ 
                        ...prev, 
                        churn_probability: v / 100,
                        risk_level: v >= 70 ? "High" : v >= 40 ? "Medium" : "Low"
                      }))}
                      max={100}
                      step={1}
                      className="flex-1"
                      data-testid="churn-prob-slider"
                    />
                    <span className="font-mono text-sm w-12">
                      {(customInput.churn_probability * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Tenure (months)</Label>
                  <Input
                    type="number"
                    value={customInput.tenure}
                    onChange={(e) => setCustomInput(prev => ({ ...prev, tenure: parseInt(e.target.value) || 0 }))}
                    data-testid="custom-tenure-input"
                  />
                </div>

                <div>
                  <Label className="text-xs">Contract Type</Label>
                  <Select 
                    value={customInput.contract} 
                    onValueChange={(v) => setCustomInput(prev => ({ ...prev, contract: v }))}
                  >
                    <SelectTrigger data-testid="custom-contract-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Month-to-month">Month-to-month</SelectItem>
                      <SelectItem value="One year">One year</SelectItem>
                      <SelectItem value="Two year">Two year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Monthly Charges ($)</Label>
                  <Input
                    type="number"
                    value={customInput.monthly_charges}
                    onChange={(e) => setCustomInput(prev => ({ ...prev, monthly_charges: parseFloat(e.target.value) || 0 }))}
                    data-testid="custom-charges-input"
                  />
                </div>

                <div>
                  <Label className="text-xs">Internet Service</Label>
                  <Select 
                    value={customInput.internet_service} 
                    onValueChange={(v) => setCustomInput(prev => ({ ...prev, internet_service: v }))}
                  >
                    <SelectTrigger data-testid="custom-internet-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DSL">DSL</SelectItem>
                      <SelectItem value="Fiber optic">Fiber optic</SelectItem>
                      <SelectItem value="No">No Internet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generate Button */}
          <Button
            className="btn-ai-magic w-full"
            onClick={handleGetRecommendation}
            disabled={loading || (mode === "customer" && !selectedCustomer)}
            data-testid="generate-recommendation-btn"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating with GPT-5.2...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate AI Recommendations
              </>
            )}
          </Button>
        </div>

        {/* Recommendation Output */}
        <div className="lg:col-span-2">
          <Card className="card-widget min-h-[600px]" data-testid="recommendation-card">
            <CardHeader className="pb-2 border-b">
              <CardTitle className="flex items-center justify-between">
                <span className="card-header-label flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  AI Retention Strategy
                </span>
                {recommendation && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleGetRecommendation}
                    disabled={loading}
                    data-testid="refresh-recommendation-btn"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 flex items-center justify-center ai-loading mb-4">
                    <Sparkles className="w-10 h-10 text-white animate-pulse" />
                  </div>
                  <p className="text-gray-500 text-center">
                    Analyzing customer profile with GPT-5.2...<br/>
                    <span className="text-xs">Generating personalized retention strategies</span>
                  </p>
                </div>
              ) : recommendation ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="prose prose-sm max-w-none"
                >
                  {/* Context Banner */}
                  {(mode === "customer" && selectedCustomer) && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-violet-50 to-blue-50 rounded-lg border border-violet-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <User className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                          <p className="font-mono text-sm font-medium">{selectedCustomer.customerID}</p>
                          <p className="text-xs text-gray-500">
                            {selectedCustomer.Contract} • ${selectedCustomer.MonthlyCharges.toFixed(0)}/mo • {selectedCustomer.tenure} months tenure
                          </p>
                        </div>
                        <Badge className="ml-auto risk-high">
                          {(selectedCustomer.churn_probability * 100).toFixed(0)}% Risk
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Recommendation Content */}
                  <div className="space-y-1">
                    {formatRecommendation(recommendation.recommendation)}
                  </div>

                  {/* Timestamp */}
                  <div className="mt-8 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                      Generated at {new Date(recommendation.generated_at).toLocaleString()} by GPT-5.2
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Sparkles className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendation Yet</h3>
                  <p className="text-gray-500 max-w-md">
                    Select a high-risk customer or enter custom parameters, then click "Generate AI Recommendations" to get personalized retention strategies powered by GPT-5.2.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
