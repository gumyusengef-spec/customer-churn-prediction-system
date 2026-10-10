import pickle
import os
from django.conf import settings

class ChurnPredictor:
    """ML model wrapper for churn prediction"""
    
    def __init__(self):
        self.model = None
        self.model_path = os.path.join(settings.BASE_DIR, 'trained_models', 'churn_model.pkl')
    
    def load_model(self):
        """Load the trained model from disk"""
        try:
            with open(self.model_path, 'rb') as f:
                self.model = pickle.load(f)
            return True
        except FileNotFoundError:
            print(f"Model file not found at {self.model_path}")
            return False
        except Exception as e:
            print(f"Error loading model: {e}")
            return False
    
    def predict_churn(self, customer_features):
        """
        Predict churn for a single customer
        
        Args:
            customer_features: dict with keys:
                - gender (0 or 1)
                - age (int)
                - tenure (int)
                - contract_type (1-5)
                - usage_frequency (float)
                - complaints (int)
                - satisfaction_score (float)
        
        Returns:
            dict with churn_probability and churn_predicted
        """
        if self.model is None:
            if not self.load_model():
                return {'churn_probability': 0.0, 'churn_predicted': False}
        
        try:
            # Prepare features in correct order
            features = [[
                customer_features.get('gender', 0),
                customer_features.get('age', 0),
                customer_features.get('tenure', 0),
                customer_features.get('contract_type', 1),
                customer_features.get('usage_frequency', 0.0),
                customer_features.get('complaints', 0),
                customer_features.get('satisfaction_score', 0.0)
            ]]
            
            # Get prediction
            churn_predicted = bool(self.model.predict(features)[0])
            
            # Get probability (if model supports it)
            try:
                churn_prob = float(self.model.predict_proba(features)[0][1] * 100)
            except:
                # If model doesn't have predict_proba, use binary prediction
                churn_prob = 90.0 if churn_predicted else 10.0
            
            return {
                'churn_probability': round(churn_prob, 2),
                'churn_predicted': churn_predicted
            }
        
        except Exception as e:
            print(f"Prediction error: {e}")
            return {'churn_probability': 0.0, 'churn_predicted': False}
    
    def predict_batch(self, customers_features):
        """Predict churn for multiple customers"""
        results = []
        for features in customers_features:
            results.append(self.predict_churn(features))
        return results


# Global predictor instance
predictor = ChurnPredictor()