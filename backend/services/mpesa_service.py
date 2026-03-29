"""
M-Pesa Service — Integrates with Safaricom Daraja API.

Handles:
  - OAuth token generation
  - STK Push (customer payment request)
  - Callback processing (payment confirmation)

Environment Variables Required:
  MPESA_CONSUMER_KEY
  MPESA_CONSUMER_SECRET
  MPESA_PASSKEY
  MPESA_SHORTCODE
  MPESA_ENVIRONMENT (sandbox | production)
  MPESA_CALLBACK_URL
"""

import os
import base64
import requests
from datetime import datetime
from typing import Dict, Optional


class MpesaService:
    """Safaricom M-Pesa Daraja API integration."""

    def __init__(self):
        self.consumer_key = os.getenv('MPESA_CONSUMER_KEY')
        self.consumer_secret = os.getenv('MPESA_CONSUMER_SECRET')
        self.passkey = os.getenv('MPESA_PASSKEY')
        self.shortcode = os.getenv('MPESA_SHORTCODE')
        self.environment = os.getenv('MPESA_ENVIRONMENT', 'sandbox')
        self.callback_url = os.getenv('MPESA_CALLBACK_URL')
        
        # API endpoints
        if self.environment == 'production':
            self.base_url = 'https://api.safaricom.co.ke'
        else:
            self.base_url = 'https://sandbox.safaricom.co.ke'
        
        self.auth_url = f'{self.base_url}/oauth/v1/generate?grant_type=client_credentials'
        self.stk_push_url = f'{self.base_url}/mpesa/stkpush/v1/processrequest'

    # ──────────────────────────────────────────────────────────────
    # Authentication
    # ──────────────────────────────────────────────────────────────

    def get_access_token(self) -> Optional[str]:
        """
        Generate OAuth access token from Safaricom.
        
        Returns:
            Access token string, or None if authentication fails.
        """
        try:
            # Encode credentials
            credentials = f'{self.consumer_key}:{self.consumer_secret}'
            encoded_credentials = base64.b64encode(credentials.encode()).decode()
            
            headers = {
                'Authorization': f'Basic {encoded_credentials}'
            }
            
            response = requests.get(self.auth_url, headers=headers)
            response.raise_for_status()
            
            return response.json().get('access_token')
            
        except requests.RequestException as e:
            print(f"M-Pesa Auth Error: {str(e)}")
            return None

    # ──────────────────────────────────────────────────────────────
    # STK Push
    # ──────────────────────────────────────────────────────────────

    def generate_password(self, timestamp: str) -> str:
        """
        Generate M-Pesa password for STK Push.
        
        Formula: Base64(Shortcode + Passkey + Timestamp)
        """
        data = f'{self.shortcode}{self.passkey}{timestamp}'
        return base64.b64encode(data.encode()).decode()

    def initiate_stk_push(
        self,
        phone_number: str,
        amount: float,
        account_reference: str,
        transaction_desc: str = "SkillSync Payment"
    ) -> Dict:
        """
        Initiate STK Push to customer's phone.
        
        Args:
            phone_number: Phone number in format 254XXXXXXXXX
            amount: Amount to charge
            account_reference: Unique reference (e.g., contract_id)
            transaction_desc: Description shown to customer
            
        Returns:
            {
                "success": True/False,
                "checkout_request_id": "...",
                "merchant_request_id": "...",
                "response_code": "0",
                "response_description": "Success...",
                "customer_message": "Success...",
                "error": "..." (if failed)
            }
        """
        # Get access token
        access_token = self.get_access_token()
        if not access_token:
            return {
                "success": False,
                "error": "Failed to authenticate with M-Pesa"
            }
        
        # Format phone number
        phone_number = self._format_phone_number(phone_number)
        if not phone_number:
            return {
                "success": False,
                "error": "Invalid phone number format"
            }
        
        # Generate timestamp and password
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password = self.generate_password(timestamp)
        
        # Prepare request
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(amount),  # M-Pesa expects integer
            "PartyA": phone_number,
            "PartyB": self.shortcode,
            "PhoneNumber": phone_number,
            "CallBackURL": self.callback_url,
            "AccountReference": account_reference,
            "TransactionDesc": transaction_desc
        }
        
        try:
            response = requests.post(
                self.stk_push_url,
                json=payload,
                headers=headers,
                timeout=30
            )
            response.raise_for_status()
            
            data = response.json()
            
            # Success response
            if data.get('ResponseCode') == '0':
                return {
                    "success": True,
                    "checkout_request_id": data.get('CheckoutRequestID'),
                    "merchant_request_id": data.get('MerchantRequestID'),
                    "response_code": data.get('ResponseCode'),
                    "response_description": data.get('ResponseDescription'),
                    "customer_message": data.get('CustomerMessage')
                }
            else:
                return {
                    "success": False,
                    "error": data.get('ResponseDescription', 'STK Push failed')
                }
                
        except requests.RequestException as e:
            print(f"M-Pesa STK Push Error: {str(e)}")
            return {
                "success": False,
                "error": f"Network error: {str(e)}"
            }

    # ──────────────────────────────────────────────────────────────
    # Callback Processing
    # ──────────────────────────────────────────────────────────────

    def process_callback(self, callback_data: Dict) -> Dict:
        """
        Process M-Pesa callback response.
        
        Expected structure:
        {
            "Body": {
                "stkCallback": {
                    "MerchantRequestID": "...",
                    "CheckoutRequestID": "...",
                    "ResultCode": 0,
                    "ResultDesc": "The service request is processed successfully.",
                    "CallbackMetadata": {
                        "Item": [
                            {"Name": "Amount", "Value": 1000},
                            {"Name": "MpesaReceiptNumber", "Value": "ABC123"},
                            {"Name": "TransactionDate", "Value": 20240101120000},
                            {"Name": "PhoneNumber", "Value": 254712345678}
                        ]
                    }
                }
            }
        }
        
        Returns:
            {
                "success": True/False,
                "checkout_request_id": "...",
                "result_code": "0",
                "result_desc": "...",
                "amount": 1000,
                "mpesa_receipt_number": "ABC123",
                "phone_number": "254712345678",
                "transaction_date": "20240101120000"
            }
        """
        try:
            body = callback_data.get('Body', {})
            stk_callback = body.get('stkCallback', {})
            
            result_code = stk_callback.get('ResultCode')
            checkout_request_id = stk_callback.get('CheckoutRequestID')
            merchant_request_id = stk_callback.get('MerchantRequestID')
            result_desc = stk_callback.get('ResultDesc', '')
            
            # Extract metadata (only present on successful payments)
            metadata = {}
            if result_code == 0:
                callback_metadata = stk_callback.get('CallbackMetadata', {})
                items = callback_metadata.get('Item', [])
                
                for item in items:
                    name = item.get('Name')
                    value = item.get('Value')
                    
                    if name == 'Amount':
                        metadata['amount'] = float(value)
                    elif name == 'MpesaReceiptNumber':
                        metadata['mpesa_receipt_number'] = value
                    elif name == 'TransactionDate':
                        metadata['transaction_date'] = str(value)
                    elif name == 'PhoneNumber':
                        metadata['phone_number'] = str(value)
            
            return {
                "success": result_code == 0,
                "checkout_request_id": checkout_request_id,
                "merchant_request_id": merchant_request_id,
                "result_code": str(result_code),
                "result_desc": result_desc,
                **metadata
            }
            
        except Exception as e:
            print(f"M-Pesa Callback Processing Error: {str(e)}")
            return {
                "success": False,
                "error": f"Failed to process callback: {str(e)}"
            }

    # ──────────────────────────────────────────────────────────────
    # Helpers
    # ──────────────────────────────────────────────────────────────

    def _format_phone_number(self, phone: str) -> Optional[str]:
        """
        Convert phone number to M-Pesa format (254XXXXXXXXX).
        
        Accepts:
          - 0712345678 → 254712345678
          - 712345678 → 254712345678
          - 254712345678 → 254712345678
          - +254712345678 → 254712345678
        """
        # Remove whitespace and special characters
        phone = ''.join(filter(str.isdigit, phone))
        
        # Remove leading + if present
        if phone.startswith('254'):
            return phone
        elif phone.startswith('0'):
            return '254' + phone[1:]
        elif len(phone) == 9:
            return '254' + phone
        else:
            return None

    def validate_configuration(self) -> Dict:
        """
        Check if all required M-Pesa configuration is present.
        
        Returns:
            {"valid": True/False, "missing": [...]}
        """
        required = [
            'MPESA_CONSUMER_KEY',
            'MPESA_CONSUMER_SECRET',
            'MPESA_PASSKEY',
            'MPESA_SHORTCODE',
            'MPESA_CALLBACK_URL'
        ]
        
        missing = []
        for var in required:
            if not os.getenv(var):
                missing.append(var)
        
        return {
            "valid": len(missing) == 0,
            "missing": missing
        }
