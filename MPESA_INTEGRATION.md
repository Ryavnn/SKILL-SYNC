# M-Pesa Integration Documentation

## 🎯 Overview

The SkillSync escrow system has been upgraded from **simulation mode** to **real M-Pesa payments** using the Safaricom Daraja API.

### What Changed

| Component | Before | After |
|-----------|--------|-------|
| **Payment Gateway** | Simulated (always succeeds) | Real M-Pesa STK Push |
| **Escrow Funding** | Instant, fake | Confirmed via callback |
| **User Experience** | Click → Done | Enter phone → Approve on phone → Confirmed |
| **Production Ready** | ❌ No | ✅ Yes (with M-Pesa credentials) |

---

## 📁 Files Created

### Backend

1. **`models/payment.py`** - Payment model tracking M-Pesa transactions
   - Stores checkout request IDs, M-Pesa receipt numbers, payment status
   - Links payments to contracts and escrow transactions

2. **`services/mpesa_service.py`** - M-Pesa API integration
   - OAuth token generation
   - STK Push initiation
   - Callback processing

3. **`repositories/payment_repository.py`** - Database operations for payments
   - Create, update, query payment records
   - Link payments to escrow transactions

4. **`controllers/mpesa_controller.py`** - API controllers
   - `/api/payments/mpesa/stk-push` - Initiate payment
   - `/api/payments/mpesa/callback` - Receive M-Pesa confirmation
   - `/api/payments/mpesa/status/<id>` - Check payment status

5. **`routes/mpesa_routes.py`** - Route definitions
   - Registers M-Pesa endpoints

6. **`migrations/versions/add_payments_table.py`** - Database migration
   - Creates `payments` table with proper indexes

7. **`.env.mpesa.example`** - Environment configuration template
   - M-Pesa credentials reference

### Frontend

8. **Updated `frontend/src/pages/client/Payments.jsx`**
   - Phone number input
   - M-Pesa payment flow
   - Real-time payment status polling
   - Success/failure feedback

9. **Updated `frontend/src/services/api.js`**
   - `mpesaApi.initiateSTKPush()`
   - `mpesaApi.getPaymentStatus()`

### Modified

10. **`services/escrow_service.py`**
    - Replaced `fund_escrow()` with `fund_escrow_after_payment()`
    - Now called ONLY after M-Pesa confirms payment

11. **`app/__init__.py`**
    - Registered M-Pesa routes

12. **`models/__init__.py`**
    - Imported Payment model

---

## 🔄 Payment Flow

### Complete Flow Diagram

```
┌─────────────┐
│   Client    │
│  Opens Fund │
│  Escrow UI  │
└──────┬──────┘
       │
       │ 1. Enters phone number (0712345678)
       │    Selects contract
       │
       ▼
┌─────────────────────────────────────┐
│  POST /api/payments/mpesa/stk-push  │
│  - Validates contract               │
│  - Creates Payment record (pending) │
│  - Calls M-Pesa STK Push API        │
└──────┬──────────────────────────────┘
       │
       │ 2. M-Pesa sends STK Push to user's phone
       │
       ▼
┌──────────────┐
│ User's Phone │
│ "Lipa M-Pesa"│
│ Enter PIN    │
└──────┬───────┘
       │
       │ 3. User enters PIN
       │
       ▼
┌─────────────────────────────────────┐
│    Safaricom M-Pesa Servers         │
│  - Processes payment                │
│  - Debits user's M-Pesa account     │
└──────┬──────────────────────────────┘
       │
       │ 4. Sends callback to our server
       │
       ▼
┌────────────────────────────────────┐
│ POST /api/payments/mpesa/callback  │
│  - Finds Payment by CheckoutID     │
│  - If success:                     │
│    → Call fund_escrow_after_payment│
│    → Mark Payment as 'completed'   │
│  - If failed:                      │
│    → Mark Payment as 'failed'      │
└──────┬─────────────────────────────┘
       │
       │ 5. Escrow updated
       │
       ▼
┌──────────────────────────┐
│ fund_escrow_after_payment│
│  - Mark milestones 'funded'
│  - Create EscrowTransaction│
│  - Send notifications      │
└──────┬───────────────────┘
       │
       │ 6. Frontend polls payment status
       │    GET /api/payments/mpesa/status/<id>
       │
       ▼
┌─────────────┐
│   Client    │
│ Sees Success│
│   Message   │
└─────────────┘
```

---

## 🛠️ Setup Instructions

### 1. Register with Safaricom Daraja

1. Go to: https://developer.safaricom.co.ke
2. Create account
3. Create new app: "SkillSync Payments"
4. Select: **Lipa Na M-Pesa Online**
5. Copy credentials:
   - Consumer Key
   - Consumer Secret
   - Passkey (from Test Credentials section)

### 2. Configure Environment Variables

Copy `.env.mpesa.example` to `.env` and fill in:

```bash
MPESA_ENVIRONMENT=sandbox  # or 'production'
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_PASSKEY=your_passkey
MPESA_SHORTCODE=174379  # Sandbox shortcode
MPESA_CALLBACK_URL=https://your-server.com/api/payments/mpesa/callback
```

### 3. Setup Callback URL (Development)

For local development, use **ngrok** to expose your local server:

```bash
# Terminal 1: Start backend
cd backend
python run.py

# Terminal 2: Expose with ngrok
ngrok http 5000
```

Copy the ngrok URL (e.g., `https://abc123.ngrok.io`) and set:

```bash
MPESA_CALLBACK_URL=https://abc123.ngrok.io/api/payments/mpesa/callback
```

### 4. Run Database Migration

```bash
cd backend
flask db upgrade
```

This creates the `payments` table.

### 5. Install Dependencies

```bash
pip install requests
```

(Flask, SQLAlchemy, etc. should already be installed)

### 6. Test the Integration

**Sandbox Test Numbers:**
- Phone: `254708374149`
- Any amount between 1 and 70,000 will **succeed**
- Any amount above 70,000 will **fail**

---

## 📊 API Reference

### Initiate STK Push

```http
POST /api/payments/mpesa/stk-push
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "phone_number": "0712345678",
  "contract_id": "uuid-here"
}
```

**Response (Success):**
```json
{
  "status": "success",
  "data": {
    "payment_id": "uuid",
    "checkout_request_id": "ws_CO_123456789",
    "amount": 5000.0,
    "phone_number": "254712345678",
    "message": "Check your phone to complete payment"
  },
  "message": "Payment initiated successfully"
}
```

**Response (Error):**
```json
{
  "status": "error",
  "message": "Contract not found"
}
```

### Check Payment Status

```http
GET /api/payments/mpesa/status/<payment_id>
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "payment_id": "uuid",
    "contract_id": "uuid",
    "status": "completed",  // pending | processing | completed | failed
    "amount": "5000.00",
    "phone_number": "254712345678",
    "mpesa_receipt_number": "ABC123XYZ",
    "result_desc": "The service request is processed successfully.",
    "created_at": "2026-03-28T19:00:00",
    "completed_at": "2026-03-28T19:01:30"
  }
}
```

### M-Pesa Callback (Called by Safaricom)

```http
POST /api/payments/mpesa/callback
Content-Type: application/json
(NO JWT - public endpoint)

{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "...",
      "CheckoutRequestID": "ws_CO_123456789",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          {"Name": "Amount", "Value": 5000},
          {"Name": "MpesaReceiptNumber", "Value": "ABC123XYZ"},
          {"Name": "TransactionDate", "Value": 20260328190130},
          {"Name": "PhoneNumber", "Value": 254712345678}
        ]
      }
    }
  }
}
```

**Response to M-Pesa:**
```json
{
  "ResultCode": 0,
  "ResultDesc": "Payment processed successfully"
}
```

---

## 🔐 Security Considerations

### Implemented

✅ JWT authentication on STK Push endpoint  
✅ User must be contract client to initiate payment  
✅ Payment status checks require ownership  
✅ Duplicate CheckoutRequestID prevented (unique constraint)  
✅ Duplicate M-Pesa receipt prevented (unique constraint)  
✅ Status transitions validated (pending → processing → completed)  

### Recommended for Production

1. **Webhook Signature Verification**
   - Safaricom may sign callbacks
   - Verify signature to prevent spoofed callbacks

2. **Rate Limiting**
   - Limit STK Push requests per user (e.g., 5 per minute)
   - Prevent abuse

3. **IP Whitelisting**
   - Safaricom callback IPs should be whitelisted
   - Reject callbacks from unknown IPs

4. **Idempotency Keys**
   - Prevent duplicate payment initiations
   - Use contract_id + timestamp as idempotency key

5. **Logging & Monitoring**
   - Log all M-Pesa requests/responses
   - Alert on failed callbacks
   - Monitor payment completion rates

6. **Timeout Handling**
   - Set max payment lifetime (e.g., 5 minutes)
   - Auto-expire pending payments

---

## 🧪 Testing

### Sandbox Testing

1. Use test phone number: `254708374149`
2. Use amounts between 1-70,000 for success
3. Use amounts above 70,000 for failure
4. STK Push appears instantly in sandbox

### Example Test Flow

```bash
# 1. Start backend
cd backend
python run.py

# 2. Start ngrok
ngrok http 5000

# 3. Update .env with ngrok URL

# 4. Test STK Push
curl -X POST http://localhost:5000/api/payments/mpesa/stk-push \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "254708374149",
    "contract_id": "your-contract-uuid"
  }'

# 5. Check payment status
curl http://localhost:5000/api/payments/mpesa/status/PAYMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Frontend Testing

1. Login as client
2. Go to Payments page
3. Click "Fund Escrow"
4. Enter phone: `0708374149`
5. Select contract
6. Click "Pay with M-Pesa"
7. Watch status update in real-time

---

## 🚨 Troubleshooting

### "Failed to authenticate with M-Pesa"

**Cause:** Invalid Consumer Key/Secret  
**Fix:** Verify credentials in `.env`

### "Invalid phone number format"

**Cause:** Phone number not in correct format  
**Fix:** Use `0712345678` or `254712345678`

### "Callback not received"

**Cause:** Callback URL not accessible  
**Fix:**
1. Check ngrok is running
2. Verify MPESA_CALLBACK_URL is correct
3. Check ngrok logs for incoming requests

### "Payment stuck in pending"

**Cause:** User cancelled or didn't enter PIN  
**Fix:**
1. Wait for timeout (30 polls = 2 minutes)
2. Payment will be marked as failed
3. User can retry

### "Escrow not funded after payment"

**Cause:** Callback received but escrow update failed  
**Fix:**
1. Check backend logs for errors
2. Verify milestones exist and are pending
3. Check contract status is 'active'

---

## 📈 Production Checklist

Before going live:

- [ ] Switch `MPESA_ENVIRONMENT=production`
- [ ] Use production Consumer Key/Secret
- [ ] Use production Passkey
- [ ] Use actual business shortcode
- [ ] Setup production callback URL (HTTPS)
- [ ] Whitelist callback IP with Safaricom
- [ ] Test with small amounts first
- [ ] Enable logging and monitoring
- [ ] Setup alerts for failed payments
- [ ] Add rate limiting
- [ ] Implement webhook signature verification
- [ ] Review and test error handling
- [ ] Load test with multiple simultaneous payments
- [ ] Create runbook for common issues

---

## 💡 Future Enhancements

1. **Payout System**
   - M-Pesa B2C API for paying freelancers
   - Automated payouts on milestone release

2. **Multiple Payment Methods**
   - Add Stripe for international cards
   - PayPal integration

3. **Refunds**
   - M-Pesa refund API
   - Automated dispute refunds

4. **Payment Plans**
   - Installment payments for large projects
   - Scheduled payments

5. **Receipts**
   - PDF receipt generation
   - Email receipts automatically

6. **Analytics**
   - Payment success rate tracking
   - Average completion time
   - Revenue analytics

---

## 📞 Support

For M-Pesa API issues:
- Safaricom Support: api-support@safaricom.co.ke
- Daraja Portal: https://developer.safaricom.co.ke/support

For SkillSync integration issues:
- Check backend logs
- Review this documentation
- Test in sandbox first

---

**Last Updated:** 2026-03-28  
**Version:** 1.0  
**Status:** ✅ Production Ready (with M-Pesa credentials)
