import { useState } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  User
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import api from "@/lib/api";

const defaultFormData = {
  gender: "Male",
  SeniorCitizen: 0,
  Partner: "No",
  Dependents: "No",
  tenure: 12,
  PhoneService: "Yes",
  MultipleLines: "No",
  InternetService: "DSL",
  OnlineSecurity: "No",
  OnlineBackup: "No",
  DeviceProtection: "No",
  TechSupport: "No",
  StreamingTV: "No",
  StreamingMovies: "No",
  Contract: "Month-to-month",
  PaperlessBilling: "Yes",
  PaymentMethod: "Electronic check",
  MonthlyCharges: 50.0,
  TotalCharges: 600.0
};

const RiskGauge = ({ probability }) => {
  const percentage = probability * 100;
  const riskLevel = percentage >= 70 ? "High" : percentage >= 40 ? "Medium" : "Low";
  const riskConfig = {
    High: { color: "text-red-600", bg: "bg-red-500", icon: AlertTriangle },
    Medium: { color: "text-amber-600", bg: "bg-amber-500", icon: AlertCircle },
    Low: { color: "text-emerald-600", bg: "bg-emerald-500", icon: CheckCircle }
  };
  
  const config = riskConfig[riskLevel];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-8"
    >
      <div className="relative w-48 h-48 mx-auto">
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="80"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="12"
          />
          <motion.circle
            cx="96"
            cy="96"
            r="80"
            fill="none"
            stroke={percentage >= 70 ? "#EF4444" : percentage >= 40 ? "#F59E0B" : "#10B981"}
            strokeWidth="12"
            strokeLinecap="round"
            initial={{ strokeDasharray: "0 502" }}
            animate={{ strokeDasharray: `${percentage * 5.02} 502` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className={`w-8 h-8 ${config.color} mb-2`} />
          <span className={`text-4xl font-black tabular-nums ${config.color}`} style={{ fontFamily: 'Chivo, sans-serif' }}>
            {percentage.toFixed(1)}%
          </span>
          <Badge className={`mt-2 ${config.bg} text-white`}>{riskLevel} Risk</Badge>
        </div>
      </div>
    </motion.div>
  );
};

export default function Predictions() {
  const [formData, setFormData] = useState(defaultFormData);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPrediction(null);
    
    try {
      const response = await api.predictChurn(formData);
      setPrediction(response.data);
      toast.success("Prediction completed successfully");
    } catch (error) {
      console.error("Prediction error:", error);
      toast.error("Failed to generate prediction");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(defaultFormData);
    setPrediction(null);
  };

  return (
    <div className="p-8" data-testid="predictions-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>
          Churn Prediction
        </h1>
        <p className="text-gray-500 mt-1">Predict churn risk for new or existing customers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prediction Form */}
        <div className="lg:col-span-2">
          <Card className="card-widget" data-testid="prediction-form-card">
            <CardHeader className="pb-2">
              <CardTitle className="card-header-label flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Demographics */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Demographics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs">Gender</Label>
                      <Select value={formData.gender} onValueChange={(v) => handleChange("gender", v)}>
                        <SelectTrigger data-testid="gender-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                      <Switch
                        checked={formData.SeniorCitizen === 1}
                        onCheckedChange={(v) => handleChange("SeniorCitizen", v ? 1 : 0)}
                        data-testid="senior-switch"
                      />
                      <Label className="text-xs">Senior Citizen</Label>
                    </div>
                    <div>
                      <Label className="text-xs">Partner</Label>
                      <Select value={formData.Partner} onValueChange={(v) => handleChange("Partner", v)}>
                        <SelectTrigger data-testid="partner-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Dependents</Label>
                      <Select value={formData.Dependents} onValueChange={(v) => handleChange("Dependents", v)}>
                        <SelectTrigger data-testid="dependents-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Account Details */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Account Details</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs">Tenure (months)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="72"
                        value={formData.tenure}
                        onChange={(e) => handleChange("tenure", parseInt(e.target.value) || 0)}
                        data-testid="tenure-input"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Contract</Label>
                      <Select value={formData.Contract} onValueChange={(v) => handleChange("Contract", v)}>
                        <SelectTrigger data-testid="contract-select">
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
                        min="0"
                        step="0.01"
                        value={formData.MonthlyCharges}
                        onChange={(e) => handleChange("MonthlyCharges", parseFloat(e.target.value) || 0)}
                        data-testid="monthly-charges-input"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Total Charges ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.TotalCharges}
                        onChange={(e) => handleChange("TotalCharges", parseFloat(e.target.value) || 0)}
                        data-testid="total-charges-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Services */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Services</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs">Internet Service</Label>
                      <Select value={formData.InternetService} onValueChange={(v) => handleChange("InternetService", v)}>
                        <SelectTrigger data-testid="internet-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DSL">DSL</SelectItem>
                          <SelectItem value="Fiber optic">Fiber optic</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Phone Service</Label>
                      <Select value={formData.PhoneService} onValueChange={(v) => handleChange("PhoneService", v)}>
                        <SelectTrigger data-testid="phone-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Online Security</Label>
                      <Select value={formData.OnlineSecurity} onValueChange={(v) => handleChange("OnlineSecurity", v)}>
                        <SelectTrigger data-testid="security-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                          <SelectItem value="No internet service">No internet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Tech Support</Label>
                      <Select value={formData.TechSupport} onValueChange={(v) => handleChange("TechSupport", v)}>
                        <SelectTrigger data-testid="techsupport-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                          <SelectItem value="No internet service">No internet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Billing */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Billing</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 pt-2">
                      <Switch
                        checked={formData.PaperlessBilling === "Yes"}
                        onCheckedChange={(v) => handleChange("PaperlessBilling", v ? "Yes" : "No")}
                        data-testid="paperless-switch"
                      />
                      <Label className="text-xs">Paperless Billing</Label>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Payment Method</Label>
                      <Select value={formData.PaymentMethod} onValueChange={(v) => handleChange("PaymentMethod", v)}>
                        <SelectTrigger data-testid="payment-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Electronic check">Electronic check</SelectItem>
                          <SelectItem value="Mailed check">Mailed check</SelectItem>
                          <SelectItem value="Bank transfer (automatic)">Bank transfer</SelectItem>
                          <SelectItem value="Credit card (automatic)">Credit card</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-gray-900 hover:bg-gray-800"
                    disabled={loading}
                    data-testid="predict-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Predict Churn Risk
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleReset}
                    data-testid="reset-btn"
                  >
                    Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Prediction Result */}
        <div className="lg:col-span-1">
          <Card className="card-widget sticky top-8" data-testid="prediction-result-card">
            <CardHeader className="pb-2">
              <CardTitle className="card-header-label flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-500" />
                Prediction Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 flex items-center justify-center ai-loading">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                  <p className="text-gray-500">Running XGBoost model...</p>
                </div>
              ) : prediction ? (
                <div>
                  <RiskGauge probability={prediction.churn_probability} />
                  
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Prediction Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Churn Probability</span>
                        <span className="font-mono font-medium">
                          {(prediction.churn_probability * 100).toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Prediction</span>
                        <Badge variant={prediction.churn_prediction ? "destructive" : "default"}>
                          {prediction.churn_prediction ? "Will Churn" : "Will Stay"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Risk Level</span>
                        <span className={`font-medium ${
                          prediction.risk_level === 'High' ? 'text-red-600' :
                          prediction.risk_level === 'Medium' ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {prediction.risk_level}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">Enter customer details and click predict to see the churn risk analysis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
