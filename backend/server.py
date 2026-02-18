from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from ml_model import churn_model
import pandas as pd
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="ChurnGuard AI API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Pydantic Models
class CustomerPredictionRequest(BaseModel):
    gender: str = "Male"
    SeniorCitizen: int = 0
    Partner: str = "No"
    Dependents: str = "No"
    tenure: int = 12
    PhoneService: str = "Yes"
    MultipleLines: str = "No"
    InternetService: str = "DSL"
    OnlineSecurity: str = "No"
    OnlineBackup: str = "No"
    DeviceProtection: str = "No"
    TechSupport: str = "No"
    StreamingTV: str = "No"
    StreamingMovies: str = "No"
    Contract: str = "Month-to-month"
    PaperlessBilling: str = "Yes"
    PaymentMethod: str = "Electronic check"
    MonthlyCharges: float = 50.0
    TotalCharges: float = 600.0

class AIRecommendationRequest(BaseModel):
    customer_id: Optional[str] = None
    churn_probability: float
    risk_level: str
    tenure: int
    contract: str
    monthly_charges: float
    internet_service: str
    services: List[str] = []

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Initialize model on startup
@app.on_event("startup")
async def startup_event():
    logger.info("Training ChurnGuard ML model...")
    try:
        metrics = churn_model.train()
        logger.info(f"Model trained successfully. Metrics: {metrics}")
    except Exception as e:
        logger.error(f"Failed to train model: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# API Routes
@api_router.get("/")
async def root():
    return {"message": "ChurnGuard AI API", "status": "running"}

@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    """Get overall dashboard statistics"""
    try:
        stats = churn_model.get_dashboard_stats()
        return stats
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/customers")
async def get_customers(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    risk_level: Optional[str] = Query(None),
    contract: Optional[str] = Query(None),
    internet_service: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("churn_probability"),
    sort_order: str = Query("desc")
):
    """Get paginated list of customers with predictions"""
    try:
        df = churn_model.get_customers_with_predictions()
        
        # Apply filters
        if risk_level:
            df = df[df['risk_level'] == risk_level]
        if contract:
            df = df[df['Contract'] == contract]
        if internet_service:
            df = df[df['InternetService'] == internet_service]
        if search:
            df = df[df['customerID'].str.contains(search, case=False)]
        
        # Sort
        ascending = sort_order == "asc"
        if sort_by in df.columns:
            df = df.sort_values(by=sort_by, ascending=ascending)
        
        # Paginate
        total = len(df)
        start = (page - 1) * limit
        end = start + limit
        df_page = df.iloc[start:end]
        
        customers = df_page.to_dict('records')
        
        # Clean up for JSON serialization
        for customer in customers:
            customer['churn_probability'] = round(float(customer['churn_probability']), 4)
            customer['clv'] = round(float(customer['clv']), 2)
            customer['risk_level'] = str(customer['risk_level'])
        
        return {
            'customers': customers,
            'total': total,
            'page': page,
            'limit': limit,
            'total_pages': (total + limit - 1) // limit
        }
    except Exception as e:
        logger.error(f"Error getting customers: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/customers/{customer_id}")
async def get_customer(customer_id: str):
    """Get single customer details"""
    try:
        df = churn_model.get_customers_with_predictions()
        customer_df = df[df['customerID'] == customer_id]
        
        if len(customer_df) == 0:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        customer = customer_df.iloc[0].to_dict()
        customer['churn_probability'] = round(float(customer['churn_probability']), 4)
        customer['clv'] = round(float(customer['clv']), 2)
        customer['risk_level'] = str(customer['risk_level'])
        
        return customer
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting customer: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/predict")
async def predict_churn(request: CustomerPredictionRequest):
    """Predict churn for a new customer"""
    try:
        customer_data = request.model_dump()
        prediction = churn_model.predict(customer_data)
        return prediction
    except Exception as e:
        logger.error(f"Error predicting churn: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/segments")
async def get_segments(segment_type: Optional[str] = Query(None)):
    """Get customer segmentation analysis"""
    try:
        segments = churn_model.get_segment_analysis()
        
        if segment_type:
            segments = [s for s in segments if s['segment_type'] == segment_type]
        
        return {'segments': segments}
    except Exception as e:
        logger.error(f"Error getting segments: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/model/metrics")
async def get_model_metrics():
    """Get ML model performance metrics"""
    return {
        'metrics': churn_model.metrics,
        'feature_importance': churn_model.feature_importance
    }

@api_router.post("/ai-recommendations")
async def get_ai_recommendations(request: AIRecommendationRequest):
    """Get AI-powered retention recommendations using GPT-5.2"""
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        # Build context for AI
        services_str = ", ".join(request.services) if request.services else "None"
        
        prompt = f"""You are a customer retention expert for a telecommunications company. Analyze this customer and provide personalized retention strategies.

Customer Profile:
- Customer ID: {request.customer_id or 'New Customer'}
- Churn Probability: {request.churn_probability * 100:.1f}%
- Risk Level: {request.risk_level}
- Tenure: {request.tenure} months
- Contract Type: {request.contract}
- Monthly Charges: ${request.monthly_charges:.2f}
- Internet Service: {request.internet_service}
- Additional Services: {services_str}

Based on this profile, provide:
1. **Risk Assessment**: Brief analysis of why this customer might churn
2. **Top 3 Retention Strategies**: Specific, actionable recommendations
3. **Offer Suggestions**: Personalized offers or discounts
4. **Expected Impact**: Estimated churn reduction if strategies are implemented

Keep your response concise and actionable. Format with clear headers."""

        chat = LlmChat(
            api_key=api_key,
            session_id=f"retention-{uuid.uuid4()}",
            system_message="You are an expert customer retention analyst for a telecom company. Provide data-driven, actionable retention strategies."
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Store recommendation in DB
        recommendation_doc = {
            'id': str(uuid.uuid4()),
            'customer_id': request.customer_id,
            'churn_probability': request.churn_probability,
            'risk_level': request.risk_level,
            'recommendation': response,
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        await db.ai_recommendations.insert_one(recommendation_doc)
        
        return {
            'recommendation': response,
            'generated_at': datetime.now(timezone.utc).isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting AI recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/export/customers")
async def export_customers(
    format: str = Query("csv"),
    risk_level: Optional[str] = Query(None)
):
    """Export customer data"""
    try:
        from fastapi.responses import StreamingResponse
        import io
        
        df = churn_model.get_customers_with_predictions()
        
        if risk_level:
            df = df[df['risk_level'] == risk_level]
        
        # Select relevant columns
        export_cols = ['customerID', 'gender', 'tenure', 'Contract', 'MonthlyCharges', 
                       'TotalCharges', 'InternetService', 'churn_probability', 'risk_level', 'clv', 'Churn']
        df_export = df[export_cols]
        
        if format == "csv":
            stream = io.StringIO()
            df_export.to_csv(stream, index=False)
            response = StreamingResponse(
                iter([stream.getvalue()]),
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=customers_export.csv"}
            )
            return response
        else:
            return {"data": df_export.to_dict('records')}
    except Exception as e:
        logger.error(f"Error exporting customers: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/charts/tenure-churn")
async def get_tenure_churn_chart():
    """Get data for tenure vs churn chart"""
    try:
        df = churn_model.get_customers_with_predictions()
        
        # Group by tenure buckets
        df['tenure_bucket'] = pd.cut(df['tenure'], bins=[0, 12, 24, 36, 48, 60, 72], 
                                     labels=['0-12', '13-24', '25-36', '37-48', '49-60', '61-72'])
        
        chart_data = df.groupby('tenure_bucket').agg({
            'customerID': 'count',
            'churn_probability': 'mean',
            'Churn': lambda x: (x == 'Yes').mean() * 100
        }).reset_index()
        
        chart_data.columns = ['tenure_bucket', 'customers', 'avg_churn_prob', 'actual_churn_rate']
        chart_data['avg_churn_prob'] = (chart_data['avg_churn_prob'] * 100).round(2)
        chart_data['actual_churn_rate'] = chart_data['actual_churn_rate'].round(2)
        
        return chart_data.to_dict('records')
    except Exception as e:
        logger.error(f"Error getting chart data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/charts/monthly-charges-distribution")
async def get_monthly_charges_chart():
    """Get monthly charges distribution by churn"""
    try:
        df = churn_model.get_customers_with_predictions()
        
        df['charges_bucket'] = pd.cut(df['MonthlyCharges'], bins=[0, 30, 50, 70, 90, 120],
                                      labels=['$0-30', '$30-50', '$50-70', '$70-90', '$90+'])
        
        chart_data = df.groupby(['charges_bucket', 'Churn']).size().unstack(fill_value=0)
        chart_data = chart_data.reset_index()
        chart_data.columns = ['charges_bucket', 'retained', 'churned']
        
        return chart_data.to_dict('records')
    except Exception as e:
        logger.error(f"Error getting chart data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
