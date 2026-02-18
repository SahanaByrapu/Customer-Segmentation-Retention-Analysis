import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  User,
  AlertTriangle,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import api from "@/lib/api";

const RiskBadge = ({ level }) => {
  const config = {
    High: { className: "risk-high", icon: AlertTriangle },
    Medium: { className: "risk-medium", icon: AlertCircle },
    Low: { className: "risk-low", icon: CheckCircle }
  };
  
  const { className, icon: Icon } = config[level] || config.Low;
  
  return (
    <Badge className={`${className} flex items-center gap-1`}>
      <Icon className="w-3 h-3" />
      {level}
    </Badge>
  );
};

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    risk_level: "",
    contract: "",
    internet_service: "",
    search: ""
  });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.risk_level && { risk_level: filters.risk_level }),
        ...(filters.contract && { contract: filters.contract }),
        ...(filters.internet_service && { internet_service: filters.internet_service }),
        ...(filters.search && { search: filters.search }),
        sort_by: "churn_probability",
        sort_order: "desc"
      };
      
      const response = await api.getCustomers(params);
      setCustomers(response.data.customers);
      setPagination(prev => ({
        ...prev,
        total: response.data.total,
        totalPages: response.data.total_pages
      }));
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value === "all" ? "" : value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleCustomerClick = (customer) => {
    setSelectedCustomer(customer);
    setDialogOpen(true);
  };

  return (
    <div className="p-8" data-testid="customers-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>
          Customers
        </h1>
        <p className="text-gray-500 mt-1">View and analyze customer churn risk profiles</p>
      </div>

      {/* Filters */}
      <Card className="card-widget mb-6" data-testid="filters-card">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by Customer ID..."
                className="pl-10"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                data-testid="search-input"
              />
            </div>
            
            <Select 
              value={filters.risk_level || "all"} 
              onValueChange={(v) => handleFilterChange("risk_level", v)}
            >
              <SelectTrigger className="w-[150px]" data-testid="risk-filter">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risks</SelectItem>
                <SelectItem value="High">High Risk</SelectItem>
                <SelectItem value="Medium">Medium Risk</SelectItem>
                <SelectItem value="Low">Low Risk</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.contract || "all"} 
              onValueChange={(v) => handleFilterChange("contract", v)}
            >
              <SelectTrigger className="w-[180px]" data-testid="contract-filter">
                <SelectValue placeholder="Contract Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contracts</SelectItem>
                <SelectItem value="Month-to-month">Month-to-month</SelectItem>
                <SelectItem value="One year">One year</SelectItem>
                <SelectItem value="Two year">Two year</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.internet_service || "all"} 
              onValueChange={(v) => handleFilterChange("internet_service", v)}
            >
              <SelectTrigger className="w-[160px]" data-testid="internet-filter">
                <SelectValue placeholder="Internet Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Internet</SelectItem>
                <SelectItem value="DSL">DSL</SelectItem>
                <SelectItem value="Fiber optic">Fiber optic</SelectItem>
                <SelectItem value="No">No Internet</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card className="card-widget" data-testid="customers-table-card">
        <CardHeader className="pb-2">
          <CardTitle className="card-header-label">
            {pagination.total.toLocaleString()} Customers Found
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : (
            <>
              <table className="w-full data-table" data-testid="customers-table">
                <thead>
                  <tr>
                    <th>Customer ID</th>
                    <th>Demographics</th>
                    <th>Tenure</th>
                    <th>Contract</th>
                    <th>Monthly Charges</th>
                    <th>Churn Prob.</th>
                    <th>Risk Level</th>
                    <th>CLV</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer, index) => (
                    <motion.tr
                      key={customer.customerID}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleCustomerClick(customer)}
                      data-testid={`customer-row-${customer.customerID}`}
                    >
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-500" />
                          </div>
                          <span className="font-mono text-sm">{customer.customerID}</span>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm">
                          {customer.gender}, {customer.SeniorCitizen ? "Senior" : "Non-senior"}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono">{customer.tenure} mo</span>
                      </td>
                      <td>
                        <span className="text-sm">{customer.Contract}</span>
                      </td>
                      <td>
                        <span className="font-mono">${customer.MonthlyCharges.toFixed(2)}</span>
                      </td>
                      <td>
                        <div className="w-24">
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={customer.churn_probability * 100} 
                              className="h-2 flex-1"
                            />
                            <span className="font-mono text-xs">
                              {(customer.churn_probability * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <RiskBadge level={customer.risk_level} />
                      </td>
                      <td>
                        <span className="font-mono">${customer.clv.toFixed(0)}</span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    data-testid="prev-page-btn"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm px-3">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    data-testid="next-page-btn"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Customer Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="customer-detail-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <span className="font-mono">{selectedCustomer?.customerID}</span>
                <p className="text-sm font-normal text-gray-500">Customer Profile</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-6 mt-4">
              {/* Risk Score */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Churn Risk Score</span>
                  <RiskBadge level={selectedCustomer.risk_level} />
                </div>
                <div className="confidence-gauge w-full rounded-full overflow-hidden">
                  <div 
                    className="h-2 bg-gray-900 transition-all"
                    style={{ width: `${selectedCustomer.churn_probability * 100}%` }}
                  ></div>
                </div>
                <p className="text-right text-2xl font-black mt-2 tabular-nums" style={{ fontFamily: 'Chivo, sans-serif' }}>
                  {(selectedCustomer.churn_probability * 100).toFixed(1)}%
                </p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="card-header-label">Demographics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Gender</span>
                      <span>{selectedCustomer.gender}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Senior Citizen</span>
                      <span>{selectedCustomer.SeniorCitizen ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Partner</span>
                      <span>{selectedCustomer.Partner}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Dependents</span>
                      <span>{selectedCustomer.Dependents}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="card-header-label">Account Info</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tenure</span>
                      <span className="font-mono">{selectedCustomer.tenure} months</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Contract</span>
                      <span>{selectedCustomer.Contract}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Monthly Charges</span>
                      <span className="font-mono">${selectedCustomer.MonthlyCharges.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Charges</span>
                      <span className="font-mono">${selectedCustomer.TotalCharges.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="card-header-label">Services</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Internet</span>
                      <span>{selectedCustomer.InternetService}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phone Service</span>
                      <span>{selectedCustomer.PhoneService}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Online Security</span>
                      <span>{selectedCustomer.OnlineSecurity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tech Support</span>
                      <span>{selectedCustomer.TechSupport}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="card-header-label">Value Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Customer Lifetime Value</span>
                      <span className="font-mono font-medium text-emerald-600">${selectedCustomer.clv.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Actual Churn</span>
                      <Badge variant={selectedCustomer.Churn === "Yes" ? "destructive" : "default"}>
                        {selectedCustomer.Churn}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
