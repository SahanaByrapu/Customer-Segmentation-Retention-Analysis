#!/usr/bin/env python3
"""
ChurnGuard AI Dashboard - Backend API Testing Suite
Tests all API endpoints using the public URL from REACT_APP_BACKEND_URL
"""

import requests
import json
import sys
import time
from datetime import datetime

# Public endpoint from frontend/.env
BASE_URL = "https://churn-predict-8.preview.emergentagent.com/api"

class ChurnGuardAPITester:
    def __init__(self, base_url=BASE_URL):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status=200, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        self.tests_run += 1
        
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            start_time = time.time()
            
            if method == 'GET':
                response = self.session.get(url, params=params)
            elif method == 'POST':
                response = self.session.post(url, json=data, params=params)
            else:
                response = self.session.request(method, url, json=data, params=params)
            
            duration = time.time() - start_time
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code} ({duration:.2f}s)")
                try:
                    resp_data = response.json()
                    if isinstance(resp_data, dict):
                        print(f"   Response keys: {list(resp_data.keys())}")
                    elif isinstance(resp_data, list):
                        print(f"   Response: List with {len(resp_data)} items")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")

            self.test_results.append({
                'name': name,
                'success': success,
                'status_code': response.status_code,
                'expected_status': expected_status,
                'duration': duration,
                'endpoint': endpoint
            })

            return success, response.json() if success and response.headers.get('content-type', '').startswith('application/json') else response.text[:100]

        except Exception as e:
            print(f"❌ FAILED - Error: {str(e)}")
            self.test_results.append({
                'name': name,
                'success': False,
                'error': str(e),
                'endpoint': endpoint
            })
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "/")

    def test_dashboard_stats(self):
        """Test dashboard statistics endpoint"""
        return self.run_test("Dashboard Stats", "GET", "/dashboard/stats")

    def test_customers_list(self):
        """Test customers list endpoint"""
        params = {"page": 1, "limit": 10}
        return self.run_test("Customers List", "GET", "/customers", params=params)

    def test_customers_with_filters(self):
        """Test customers with filters"""
        params = {
            "page": 1, 
            "limit": 5,
            "risk_level": "High",
            "sort_by": "churn_probability",
            "sort_order": "desc"
        }
        return self.run_test("Customers with Filters", "GET", "/customers", params=params)

    def test_customer_search(self):
        """Test customer search functionality"""
        # First get a customer ID
        success, customers_data = self.test_customers_list()
        if success and customers_data.get('customers'):
            customer_id = customers_data['customers'][0]['customerID']
            params = {"search": customer_id[:5]}  # Search by partial ID
            return self.run_test("Customer Search", "GET", "/customers", params=params)
        return False, {}

    def test_single_customer(self):
        """Test single customer endpoint"""
        # First get a customer ID
        success, customers_data = self.test_customers_list()
        if success and customers_data.get('customers'):
            customer_id = customers_data['customers'][0]['customerID']
            return self.run_test("Single Customer", "GET", f"/customers/{customer_id}")
        return False, {}

    def test_churn_prediction(self):
        """Test churn prediction endpoint"""
        test_customer = {
            "gender": "Male",
            "SeniorCitizen": 0,
            "Partner": "No", 
            "Dependents": "No",
            "tenure": 6,
            "PhoneService": "Yes",
            "MultipleLines": "No",
            "InternetService": "Fiber optic",
            "OnlineSecurity": "No",
            "OnlineBackup": "No", 
            "DeviceProtection": "No",
            "TechSupport": "No",
            "StreamingTV": "Yes",
            "StreamingMovies": "Yes",
            "Contract": "Month-to-month",
            "PaperlessBilling": "Yes",
            "PaymentMethod": "Electronic check",
            "MonthlyCharges": 89.95,
            "TotalCharges": 539.70
        }
        return self.run_test("Churn Prediction", "POST", "/predict", data=test_customer)

    def test_segments_analysis(self):
        """Test segments analysis endpoint"""
        return self.run_test("Segments Analysis", "GET", "/segments")

    def test_segments_by_type(self):
        """Test segments filtered by type"""
        params = {"segment_type": "Contract"}
        return self.run_test("Segments by Type", "GET", "/segments", params=params)

    def test_model_metrics(self):
        """Test model metrics endpoint"""
        return self.run_test("Model Metrics", "GET", "/model/metrics")

    def test_ai_recommendations(self):
        """Test AI recommendations endpoint (GPT-5.2)"""
        recommendation_data = {
            "customer_id": "TEST-CUSTOMER",
            "churn_probability": 0.75,
            "risk_level": "High",
            "tenure": 6,
            "contract": "Month-to-month",
            "monthly_charges": 85.50,
            "internet_service": "Fiber optic",
            "services": ["Streaming TV", "Streaming Movies"]
        }
        print("⏳ AI recommendation may take a few seconds...")
        return self.run_test("AI Recommendations (GPT-5.2)", "POST", "/ai-recommendations", data=recommendation_data)

    def test_export_customers(self):
        """Test customer data export"""
        params = {"format": "csv"}
        success, response = self.run_test("Export Customers CSV", "GET", "/export/customers", params=params)
        # CSV endpoints return CSV data, not JSON, so we expect the JSON parsing to fail
        # As long as status is 200, the export is working
        return success

    def test_export_high_risk(self):
        """Test high risk customer export"""
        params = {"format": "csv", "risk_level": "High"}  
        success, response = self.run_test("Export High Risk CSV", "GET", "/export/customers", params=params)
        # CSV endpoints return CSV data, not JSON, so we expect the JSON parsing to fail
        # As long as status is 200, the export is working
        return success

    def test_tenure_churn_chart(self):
        """Test tenure vs churn chart data"""
        return self.run_test("Tenure vs Churn Chart", "GET", "/charts/tenure-churn")

    def test_monthly_charges_chart(self):
        """Test monthly charges distribution chart"""
        return self.run_test("Monthly Charges Chart", "GET", "/charts/monthly-charges-distribution")

    def test_status_endpoints(self):
        """Test status check endpoints"""
        # Create status check
        status_data = {"client_name": f"test_client_{int(time.time())}"}
        success, _ = self.run_test("Create Status Check", "POST", "/status", data=status_data, expected_status=200)
        
        # Get status checks
        if success:
            self.run_test("Get Status Checks", "GET", "/status")
        
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("="*80)
        print("🚀 ChurnGuard AI Dashboard - Backend API Testing Suite")
        print("="*80)
        print(f"Testing against: {self.base_url}")
        print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Core API Tests
        print("\n📊 CORE API ENDPOINTS")
        print("-" * 40)
        self.test_root_endpoint()
        self.test_dashboard_stats()
        
        # Customer Management Tests  
        print("\n👥 CUSTOMER MANAGEMENT")
        print("-" * 40)
        self.test_customers_list()
        self.test_customers_with_filters()
        self.test_customer_search()
        self.test_single_customer()
        
        # ML Prediction Tests
        print("\n🤖 MACHINE LEARNING")
        print("-" * 40)
        self.test_churn_prediction()
        self.test_model_metrics()
        
        # Analytics Tests
        print("\n📈 ANALYTICS & REPORTING")
        print("-" * 40)
        self.test_segments_analysis()
        self.test_segments_by_type()
        self.test_tenure_churn_chart()
        self.test_monthly_charges_chart()
        
        # Data Export Tests
        print("\n📄 DATA EXPORT")
        print("-" * 40)
        self.test_export_customers()
        self.test_export_high_risk()
        
        # AI Integration Tests
        print("\n✨ AI INTEGRATION (GPT-5.2)")
        print("-" * 40)
        self.test_ai_recommendations()
        
        # System Tests
        print("\n⚡ SYSTEM STATUS")
        print("-" * 40)
        self.test_status_endpoints()
        
        # Final Results
        print("\n" + "="*80)
        print("📊 TEST RESULTS SUMMARY")
        print("="*80)
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📋 Total Tests: {self.tests_run}")
        print(f"🎯 Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Failed Tests Detail
        failed_tests = [t for t in self.test_results if not t['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                error_msg = test.get('error', f"Status {test.get('status_code')} != {test.get('expected_status')}")
                print(f"   • {test['name']}: {error_msg}")
        
        print(f"\nCompleted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        return self.tests_passed == self.tests_run

def main():
    tester = ChurnGuardAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())