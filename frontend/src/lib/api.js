import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const api = {
  // Dashboard
  getDashboardStats: () => axios.get(`${API}/dashboard/stats`),
  
  // Customers
  getCustomers: (params) => axios.get(`${API}/customers`, { params }),
  getCustomer: (id) => axios.get(`${API}/customers/${id}`),
  
  // Predictions
  predictChurn: (data) => axios.post(`${API}/predict`, data),
  
  // Segments
  getSegments: (segmentType) => 
    axios.get(`${API}/segments`, { params: { segment_type: segmentType } }),
  
  // AI Recommendations
  getAIRecommendations: (data) => axios.post(`${API}/ai-recommendations`, data),
  
  // Charts
  getTenureChurnChart: () => axios.get(`${API}/charts/tenure-churn`),
  getMonthlyChargesChart: () => axios.get(`${API}/charts/monthly-charges-distribution`),
  
  // Model
  getModelMetrics: () => axios.get(`${API}/model/metrics`),
  
  // Export
  exportCustomers: (format, riskLevel) => 
    axios.get(`${API}/export/customers`, { 
      params: { format, risk_level: riskLevel },
      responseType: format === 'csv' ? 'blob' : 'json'
    }),
};

export default api;
