"""
ChurnGuard ML Model - XGBoost Classifier for Customer Churn Prediction
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import xgboost as xgb
import joblib
import os
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

# Dataset embedded - Telco Customer Churn
TELCO_DATA = """customerID,gender,SeniorCitizen,Partner,Dependents,tenure,PhoneService,MultipleLines,InternetService,OnlineSecurity,OnlineBackup,DeviceProtection,TechSupport,StreamingTV,StreamingMovies,Contract,PaperlessBilling,PaymentMethod,MonthlyCharges,TotalCharges,Churn
7590-VHVEG,Female,0,Yes,No,1,No,No phone service,DSL,No,Yes,No,No,No,No,Month-to-month,Yes,Electronic check,29.85,29.85,No
5575-GNVDE,Male,0,No,No,34,Yes,No,DSL,Yes,No,Yes,No,No,No,One year,No,Mailed check,56.95,1889.5,No
3668-QPYBK,Male,0,No,No,2,Yes,No,DSL,Yes,Yes,No,No,No,No,Month-to-month,Yes,Mailed check,53.85,108.15,Yes
7795-CFOCW,Male,0,No,No,45,No,No phone service,DSL,Yes,No,Yes,Yes,No,No,One year,No,Bank transfer (automatic),42.30,1840.75,No
9237-HQITU,Female,0,No,No,2,Yes,No,Fiber optic,No,No,No,No,No,No,Month-to-month,Yes,Electronic check,70.70,151.65,Yes
9305-CDSKC,Female,0,No,No,8,Yes,Yes,Fiber optic,No,No,Yes,No,Yes,Yes,Month-to-month,Yes,Electronic check,99.65,820.5,Yes
1452-KIOVK,Male,0,No,Yes,22,Yes,Yes,Fiber optic,No,Yes,No,No,Yes,No,Month-to-month,Yes,Credit card (automatic),89.10,1949.4,No
6713-OKOMC,Female,0,No,No,10,No,No phone service,DSL,Yes,No,No,No,No,No,Month-to-month,No,Mailed check,29.75,301.9,No
7892-POOKP,Female,0,Yes,No,28,Yes,Yes,Fiber optic,No,No,Yes,Yes,Yes,Yes,Month-to-month,Yes,Electronic check,104.80,3046.05,Yes
6388-TABGU,Male,0,No,Yes,62,Yes,No,DSL,Yes,Yes,Yes,No,No,No,One year,No,Bank transfer (automatic),56.15,3487.95,No
9763-GRSKD,Male,0,Yes,Yes,13,Yes,No,DSL,Yes,No,No,No,No,No,Month-to-month,No,Mailed check,49.95,587.45,No
7469-LKBCI,Male,0,No,No,16,Yes,No,No,No internet service,No internet service,No internet service,No internet service,No internet service,No internet service,Two year,No,Credit card (automatic),18.95,326.8,No
8091-TTVAX,Male,0,Yes,No,58,Yes,Yes,Fiber optic,No,No,Yes,No,Yes,Yes,One year,No,Credit card (automatic),100.35,5681.1,No
0280-XJGEX,Male,0,No,No,49,Yes,Yes,Fiber optic,No,Yes,Yes,No,Yes,Yes,Month-to-month,Yes,Bank transfer (automatic),103.70,5036.3,Yes
5129-JLPIS,Male,0,No,No,25,Yes,No,Fiber optic,Yes,No,Yes,Yes,Yes,Yes,Month-to-month,Yes,Electronic check,105.50,2686.05,No
3655-SNQYZ,Female,0,Yes,Yes,69,Yes,Yes,Fiber optic,Yes,Yes,Yes,Yes,Yes,Yes,Two year,No,Credit card (automatic),113.25,7895.15,No
8191-XWSZG,Female,0,No,No,52,Yes,No,No,No internet service,No internet service,No internet service,No internet service,No internet service,No internet service,Two year,No,Mailed check,20.65,1022.95,No
9959-WOFKT,Male,0,No,Yes,71,Yes,Yes,Fiber optic,Yes,No,Yes,No,Yes,Yes,Two year,Yes,Bank transfer (automatic),106.70,7382.25,No
4190-MFLUW,Female,0,Yes,Yes,10,Yes,No,DSL,No,No,Yes,Yes,No,No,Month-to-month,No,Credit card (automatic),55.20,528.35,Yes
4183-MYFRB,Female,0,No,No,21,Yes,No,Fiber optic,No,Yes,Yes,No,No,Yes,Month-to-month,Yes,Electronic check,90.05,1862.9,No"""

class ChurnModel:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_columns = []
        self.feature_importance = {}
        self.metrics = {}
        self.df = None
        
    def load_data(self):
        """Load the Telco Customer Churn dataset"""
        from io import StringIO
        
        # For demo, use embedded sample. In production, load full dataset
        # Full dataset URL: https://raw.githubusercontent.com/IBM/telco-customer-churn-on-icp4d/master/data/Telco-Customer-Churn.csv
        
        # Generate synthetic data based on Telco dataset patterns
        np.random.seed(42)
        n_samples = 7043
        
        data = {
            'customerID': [f'CUST-{i:05d}' for i in range(n_samples)],
            'gender': np.random.choice(['Male', 'Female'], n_samples),
            'SeniorCitizen': np.random.choice([0, 1], n_samples, p=[0.84, 0.16]),
            'Partner': np.random.choice(['Yes', 'No'], n_samples, p=[0.48, 0.52]),
            'Dependents': np.random.choice(['Yes', 'No'], n_samples, p=[0.30, 0.70]),
            'tenure': np.random.randint(0, 73, n_samples),
            'PhoneService': np.random.choice(['Yes', 'No'], n_samples, p=[0.90, 0.10]),
            'MultipleLines': np.random.choice(['Yes', 'No', 'No phone service'], n_samples, p=[0.42, 0.48, 0.10]),
            'InternetService': np.random.choice(['DSL', 'Fiber optic', 'No'], n_samples, p=[0.34, 0.44, 0.22]),
            'OnlineSecurity': np.random.choice(['Yes', 'No', 'No internet service'], n_samples, p=[0.29, 0.49, 0.22]),
            'OnlineBackup': np.random.choice(['Yes', 'No', 'No internet service'], n_samples, p=[0.34, 0.44, 0.22]),
            'DeviceProtection': np.random.choice(['Yes', 'No', 'No internet service'], n_samples, p=[0.34, 0.44, 0.22]),
            'TechSupport': np.random.choice(['Yes', 'No', 'No internet service'], n_samples, p=[0.29, 0.49, 0.22]),
            'StreamingTV': np.random.choice(['Yes', 'No', 'No internet service'], n_samples, p=[0.38, 0.40, 0.22]),
            'StreamingMovies': np.random.choice(['Yes', 'No', 'No internet service'], n_samples, p=[0.38, 0.40, 0.22]),
            'Contract': np.random.choice(['Month-to-month', 'One year', 'Two year'], n_samples, p=[0.55, 0.21, 0.24]),
            'PaperlessBilling': np.random.choice(['Yes', 'No'], n_samples, p=[0.59, 0.41]),
            'PaymentMethod': np.random.choice(['Electronic check', 'Mailed check', 'Bank transfer (automatic)', 'Credit card (automatic)'], n_samples, p=[0.34, 0.23, 0.22, 0.21]),
            'MonthlyCharges': np.round(np.random.uniform(18, 119, n_samples), 2),
            'TotalCharges': np.round(np.random.uniform(18, 8700, n_samples), 2),
        }
        
        # Generate realistic churn based on features
        churn_prob = np.zeros(n_samples)
        churn_prob += (data['Contract'] == 'Month-to-month').astype(float) * 0.25
        churn_prob += (data['tenure'] < 12).astype(float) * 0.15
        churn_prob += (data['InternetService'] == 'Fiber optic').astype(float) * 0.10
        churn_prob += (data['PaymentMethod'] == 'Electronic check').astype(float) * 0.10
        churn_prob += (np.array(data['MonthlyCharges']) > 70).astype(float) * 0.10
        churn_prob += (data['OnlineSecurity'] == 'No').astype(float) * 0.05
        churn_prob += (data['TechSupport'] == 'No').astype(float) * 0.05
        churn_prob = np.clip(churn_prob + np.random.normal(0, 0.1, n_samples), 0, 1)
        
        data['Churn'] = np.where(np.random.random(n_samples) < churn_prob, 'Yes', 'No')
        
        self.df = pd.DataFrame(data)
        return self.df
    
    def preprocess_data(self, df, is_training=True):
        """Preprocess data for model training/prediction"""
        df = df.copy()
        
        # Handle TotalCharges conversion
        df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')
        df['TotalCharges'] = df['TotalCharges'].fillna(df['TotalCharges'].median())
        
        # Encode categorical variables
        categorical_columns = ['gender', 'Partner', 'Dependents', 'PhoneService', 
                              'MultipleLines', 'InternetService', 'OnlineSecurity',
                              'OnlineBackup', 'DeviceProtection', 'TechSupport',
                              'StreamingTV', 'StreamingMovies', 'Contract',
                              'PaperlessBilling', 'PaymentMethod']
        
        for col in categorical_columns:
            if col in df.columns:
                if is_training:
                    le = LabelEncoder()
                    df[col] = le.fit_transform(df[col].astype(str))
                    self.label_encoders[col] = le
                else:
                    if col in self.label_encoders:
                        le = self.label_encoders[col]
                        # Handle unseen labels
                        df[col] = df[col].apply(lambda x: x if x in le.classes_ else le.classes_[0])
                        df[col] = le.transform(df[col].astype(str))
        
        # Encode target variable
        if 'Churn' in df.columns:
            if is_training:
                le = LabelEncoder()
                df['Churn'] = le.fit_transform(df['Churn'])
                self.label_encoders['Churn'] = le
            else:
                df['Churn'] = self.label_encoders['Churn'].transform(df['Churn'])
        
        return df
    
    def train(self):
        """Train the XGBoost model"""
        logger.info("Loading and preprocessing data...")
        df = self.load_data()
        df_processed = self.preprocess_data(df, is_training=True)
        
        # Feature columns (exclude customerID and Churn)
        self.feature_columns = [col for col in df_processed.columns 
                               if col not in ['customerID', 'Churn']]
        
        X = df_processed[self.feature_columns]
        y = df_processed['Churn']
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Train XGBoost
        logger.info("Training XGBoost model...")
        self.model = xgb.XGBClassifier(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            random_state=42,
            eval_metric='logloss',
            use_label_encoder=False
        )
        
        self.model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.model.predict(X_test)
        y_pred_proba = self.model.predict_proba(X_test)[:, 1]
        
        self.metrics = {
            'accuracy': round(accuracy_score(y_test, y_pred), 4),
            'precision': round(precision_score(y_test, y_pred), 4),
            'recall': round(recall_score(y_test, y_pred), 4),
            'f1_score': round(f1_score(y_test, y_pred), 4),
            'roc_auc': round(roc_auc_score(y_test, y_pred_proba), 4)
        }
        
        # Feature importance
        importance = self.model.feature_importances_
        self.feature_importance = dict(zip(self.feature_columns, 
                                          [round(float(x), 4) for x in importance]))
        self.feature_importance = dict(sorted(self.feature_importance.items(), 
                                             key=lambda x: x[1], reverse=True))
        
        logger.info(f"Model trained. Metrics: {self.metrics}")
        return self.metrics
    
    def predict(self, customer_data: dict):
        """Predict churn probability for a single customer"""
        if self.model is None:
            raise ValueError("Model not trained")
        
        # Convert to DataFrame
        df = pd.DataFrame([customer_data])
        
        # Preprocess
        df_processed = self.preprocess_data(df, is_training=False)
        
        # Get features
        X = df_processed[self.feature_columns]
        X_scaled = self.scaler.transform(X)
        
        # Predict
        churn_prob = float(self.model.predict_proba(X_scaled)[0][1])
        churn_prediction = bool(churn_prob >= 0.5)
        
        return {
            'churn_probability': round(churn_prob, 4),
            'churn_prediction': churn_prediction,
            'risk_level': 'High' if churn_prob >= 0.7 else 'Medium' if churn_prob >= 0.4 else 'Low'
        }
    
    def get_customers_with_predictions(self):
        """Get all customers with their churn predictions"""
        if self.df is None or self.model is None:
            raise ValueError("Model not trained")
        
        df = self.df.copy()
        df_processed = self.preprocess_data(df.copy(), is_training=False)
        
        X = df_processed[self.feature_columns]
        X_scaled = self.scaler.transform(X)
        
        probabilities = self.model.predict_proba(X_scaled)[:, 1]
        df['churn_probability'] = probabilities
        df['risk_level'] = pd.cut(probabilities, bins=[0, 0.4, 0.7, 1], 
                                  labels=['Low', 'Medium', 'High'])
        
        # Calculate CLV (simplified: tenure * monthly charges)
        df['clv'] = df['tenure'] * df['MonthlyCharges']
        
        return df
    
    def get_segment_analysis(self):
        """Get customer segmentation analysis"""
        df = self.get_customers_with_predictions()
        
        segments = []
        
        # By Contract Type
        for contract in df['Contract'].unique():
            segment_df = df[df['Contract'] == contract]
            segments.append({
                'segment_type': 'Contract',
                'segment_name': contract,
                'total_customers': len(segment_df),
                'churn_rate': round((segment_df['Churn'] == 'Yes').mean() * 100, 2),
                'avg_monthly_charges': round(segment_df['MonthlyCharges'].mean(), 2),
                'avg_tenure': round(segment_df['tenure'].mean(), 2),
                'total_mrr': round(segment_df['MonthlyCharges'].sum(), 2),
                'avg_clv': round(segment_df['clv'].mean(), 2)
            })
        
        # By Internet Service
        for internet in df['InternetService'].unique():
            segment_df = df[df['InternetService'] == internet]
            segments.append({
                'segment_type': 'InternetService',
                'segment_name': internet,
                'total_customers': len(segment_df),
                'churn_rate': round((segment_df['Churn'] == 'Yes').mean() * 100, 2),
                'avg_monthly_charges': round(segment_df['MonthlyCharges'].mean(), 2),
                'avg_tenure': round(segment_df['tenure'].mean(), 2),
                'total_mrr': round(segment_df['MonthlyCharges'].sum(), 2),
                'avg_clv': round(segment_df['clv'].mean(), 2)
            })
        
        # By Risk Level
        for risk in ['Low', 'Medium', 'High']:
            segment_df = df[df['risk_level'] == risk]
            if len(segment_df) > 0:
                segments.append({
                    'segment_type': 'RiskLevel',
                    'segment_name': risk,
                    'total_customers': len(segment_df),
                    'churn_rate': round((segment_df['Churn'] == 'Yes').mean() * 100, 2),
                    'avg_monthly_charges': round(segment_df['MonthlyCharges'].mean(), 2),
                    'avg_tenure': round(segment_df['tenure'].mean(), 2),
                    'total_mrr': round(segment_df['MonthlyCharges'].sum(), 2),
                    'avg_clv': round(segment_df['clv'].mean(), 2)
                })
        
        return segments
    
    def get_dashboard_stats(self):
        """Get overall dashboard statistics"""
        df = self.get_customers_with_predictions()
        
        total_customers = len(df)
        churned_customers = (df['Churn'] == 'Yes').sum()
        churn_rate = churned_customers / total_customers * 100
        
        high_risk = (df['risk_level'] == 'High').sum()
        medium_risk = (df['risk_level'] == 'Medium').sum()
        low_risk = (df['risk_level'] == 'Low').sum()
        
        return {
            'total_customers': int(total_customers),
            'churned_customers': int(churned_customers),
            'retained_customers': int(total_customers - churned_customers),
            'churn_rate': round(churn_rate, 2),
            'retention_rate': round(100 - churn_rate, 2),
            'high_risk_customers': int(high_risk),
            'medium_risk_customers': int(medium_risk),
            'low_risk_customers': int(low_risk),
            'total_mrr': round(df['MonthlyCharges'].sum(), 2),
            'avg_mrr': round(df['MonthlyCharges'].mean(), 2),
            'total_clv': round(df['clv'].sum(), 2),
            'avg_clv': round(df['clv'].mean(), 2),
            'avg_tenure': round(df['tenure'].mean(), 2),
            'model_metrics': self.metrics,
            'feature_importance': dict(list(self.feature_importance.items())[:10])
        }


# Global model instance
churn_model = ChurnModel()
