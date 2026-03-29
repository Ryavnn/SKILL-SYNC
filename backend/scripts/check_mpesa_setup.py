#!/usr/bin/env python3
"""
M-Pesa Integration Setup Script

Validates M-Pesa configuration and provides setup guidance.
Run this after adding M-Pesa credentials to .env
"""

import os
import sys
from dotenv import load_dotenv

# Color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_header(text):
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}{text.center(60)}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")

def print_success(text):
    print(f"{GREEN}✓ {text}{RESET}")

def print_error(text):
    print(f"{RED}✗ {text}{RESET}")

def print_warning(text):
    print(f"{YELLOW}⚠ {text}{RESET}")

def print_info(text):
    print(f"  {text}")

def check_env_var(var_name, required=True):
    """Check if environment variable is set"""
    value = os.getenv(var_name)
    
    if value:
        # Mask sensitive values
        if 'KEY' in var_name or 'SECRET' in var_name or 'PASSKEY' in var_name:
            display_value = f"{value[:8]}..." if len(value) > 8 else "***"
        else:
            display_value = value
        
        print_success(f"{var_name}: {display_value}")
        return True
    else:
        if required:
            print_error(f"{var_name}: NOT SET")
        else:
            print_warning(f"{var_name}: Optional (not set)")
        return False

def validate_phone_format():
    """Test phone number formatting"""
    from services.mpesa_service import MpesaService
    
    mpesa = MpesaService()
    
    test_cases = [
        ("0712345678", "254712345678"),
        ("712345678", "254712345678"),
        ("254712345678", "254712345678"),
        ("+254712345678", "254712345678"),
    ]
    
    print_info("Testing phone number formatting:")
    
    all_passed = True
    for input_phone, expected in test_cases:
        result = mpesa._format_phone_number(input_phone)
        if result == expected:
            print_success(f"  {input_phone} → {result}")
        else:
            print_error(f"  {input_phone} → {result} (expected {expected})")
            all_passed = False
    
    return all_passed

def check_database():
    """Check if payments table exists"""
    try:
        from app import db, create_app
        from models.payment import Payment
        
        app = create_app()
        with app.app_context():
            # Try to query payments table
            Payment.query.limit(1).all()
            print_success("Database: payments table exists")
            return True
    except Exception as e:
        if "does not exist" in str(e) or "no such table" in str(e):
            print_error("Database: payments table NOT found")
            print_info("  → Run: flask db upgrade")
            return False
        else:
            print_warning(f"Database: Could not verify ({str(e)[:50]}...)")
            return True

def check_mpesa_connectivity():
    """Test M-Pesa API connectivity"""
    try:
        from services.mpesa_service import MpesaService
        
        mpesa = MpesaService()
        token = mpesa.get_access_token()
        
        if token:
            print_success(f"M-Pesa API: Connected (token: {token[:10]}...)")
            return True
        else:
            print_error("M-Pesa API: Failed to get access token")
            print_info("  → Check CONSUMER_KEY and CONSUMER_SECRET")
            return False
    except Exception as e:
        print_error(f"M-Pesa API: Error - {str(e)}")
        return False

def main():
    print_header("M-Pesa Integration Setup Checker")
    
    # Load environment variables
    load_dotenv()
    
    # Track status
    all_checks_passed = True
    
    # 1. Check environment variables
    print_header("Environment Variables")
    
    required_vars = [
        'MPESA_CONSUMER_KEY',
        'MPESA_CONSUMER_SECRET',
        'MPESA_PASSKEY',
        'MPESA_SHORTCODE',
        'MPESA_CALLBACK_URL',
    ]
    
    optional_vars = [
        'MPESA_ENVIRONMENT',
    ]
    
    for var in required_vars:
        if not check_env_var(var, required=True):
            all_checks_passed = False
    
    for var in optional_vars:
        check_env_var(var, required=False)
    
    # 2. Check M-Pesa configuration
    print_header("M-Pesa Configuration")
    
    environment = os.getenv('MPESA_ENVIRONMENT', 'sandbox')
    print_info(f"Environment: {environment}")
    
    if environment == 'sandbox':
        print_success("Using sandbox (testing mode)")
        print_info("  Shortcode: 174379")
        print_info("  Test phone: 254708374149")
    elif environment == 'production':
        print_warning("Using PRODUCTION (real money!)")
        print_info("  Make sure you have production credentials")
    else:
        print_error(f"Invalid environment: {environment}")
        print_info("  Should be 'sandbox' or 'production'")
        all_checks_passed = False
    
    callback_url = os.getenv('MPESA_CALLBACK_URL', '')
    if callback_url:
        if callback_url.startswith('https://'):
            print_success(f"Callback URL: {callback_url}")
        elif 'ngrok' in callback_url:
            print_success(f"Callback URL (ngrok): {callback_url}")
            print_warning("  Remember to update if ngrok restarts!")
        elif callback_url.startswith('http://'):
            print_warning(f"Callback URL uses HTTP: {callback_url}")
            print_info("  M-Pesa prefers HTTPS (use ngrok for local dev)")
        else:
            print_error(f"Invalid callback URL: {callback_url}")
            all_checks_passed = False
    
    # 3. Check database
    print_header("Database")
    if not check_database():
        all_checks_passed = False
    
    # 4. Check phone formatting
    print_header("Phone Number Formatting")
    if not validate_phone_format():
        all_checks_passed = False
    
    # 5. Test M-Pesa connectivity
    print_header("M-Pesa API Connectivity")
    
    if os.getenv('MPESA_CONSUMER_KEY') and os.getenv('MPESA_CONSUMER_SECRET'):
        if not check_mpesa_connectivity():
            all_checks_passed = False
    else:
        print_warning("Skipping connectivity test (credentials not set)")
    
    # Final summary
    print_header("Summary")
    
    if all_checks_passed:
        print_success("All checks passed! ✓")
        print("\nNext steps:")
        print("  1. Start backend: python run.py")
        print("  2. Test STK Push with sandbox phone: 254708374149")
        print("  3. Check TESTING_GUIDE.md for detailed test scenarios")
    else:
        print_error("Some checks failed")
        print("\nCommon fixes:")
        print("  • Missing credentials → Add to .env file")
        print("  • Database not ready → Run: flask db upgrade")
        print("  • Wrong credentials → Check Daraja portal")
        print("  • Callback URL issue → Start ngrok and update .env")
    
    print()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nSetup check cancelled.")
        sys.exit(0)
    except Exception as e:
        print_error(f"\nUnexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
