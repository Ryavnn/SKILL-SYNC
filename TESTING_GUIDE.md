# M-Pesa Integration Testing Guide

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Backend running
- Safaricom Daraja account created
- Ngrok installed (for local testing)

### Step 1: Get Daraja Credentials (2 min)

1. Go to: https://developer.safaricom.co.ke
2. Login → My Apps → Create New App
3. App Name: "SkillSync Test"
4. Select: **Lipa Na M-Pesa Online**
5. Save and note:
   - **Consumer Key**
   - **Consumer Secret**
6. Go to "Test Credentials" tab:
   - Copy **Passkey**

### Step 2: Setup Environment (1 min)

```bash
cd backend

# Add to .env file:
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=paste_your_consumer_key_here
MPESA_CONSUMER_SECRET=paste_your_consumer_secret_here
MPESA_PASSKEY=paste_your_passkey_here
MPESA_SHORTCODE=174379
MPESA_CALLBACK_URL=http://placeholder.com/callback  # We'll update this in Step 3
```

### Step 3: Expose Callback URL (1 min)

```bash
# Terminal 1: Start backend
python run.py

# Terminal 2: Start ngrok
ngrok http 5000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Update .env:
MPESA_CALLBACK_URL=https://abc123.ngrok.io/api/payments/mpesa/callback

# Restart backend
```

### Step 4: Run Migration (30 sec)

```bash
flask db upgrade
```

### Step 5: Test It! (1 min)

```bash
# Test 1: Check M-Pesa config
curl http://localhost:5000/api/payments/mpesa/config-check

# Test 2: Initiate payment (requires JWT token)
curl -X POST http://localhost:5000/api/payments/mpesa/stk-push \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "254708374149",
    "contract_id": "your-contract-uuid"
  }'

# Expected response:
# {
#   "status": "success",
#   "data": {
#     "payment_id": "...",
#     "message": "Check your phone to complete payment"
#   }
# }
```

---

## 🧪 Testing Scenarios

### Scenario 1: Successful Payment

**Input:**
- Phone: `254708374149`
- Amount: 1000 (any amount 1-70,000 succeeds in sandbox)

**Expected Flow:**
1. STK Push sent → Status 200
2. User enters PIN on phone (sandbox auto-completes)
3. Callback received → Payment marked 'completed'
4. Escrow funded → Milestones marked 'funded'

**Verify:**
```bash
# Check payment status
curl http://localhost:5000/api/payments/mpesa/status/PAYMENT_ID \
  -H "Authorization: Bearer TOKEN"

# Should show:
# "status": "completed"
# "mpesa_receipt_number": "ABC123..."
```

### Scenario 2: Failed Payment

**Input:**
- Phone: `254708374149`
- Amount: 80000 (above 70,000 fails in sandbox)

**Expected Flow:**
1. STK Push sent → Status 200
2. M-Pesa simulates failure
3. Callback received with ResultCode ≠ 0
4. Payment marked 'failed'

**Verify:**
```bash
# Check payment status
curl http://localhost:5000/api/payments/mpesa/status/PAYMENT_ID \
  -H "Authorization: Bearer TOKEN"

# Should show:
# "status": "failed"
# "result_desc": "Insufficient funds..." (or similar)
```

### Scenario 3: User Cancellation

**Input:**
- Phone: `254708374149`
- Amount: 1000
- User cancels on phone

**Expected Flow:**
1. STK Push sent
2. User clicks "Cancel" on phone prompt
3. Callback received with ResultCode = 1032 (user cancelled)
4. Payment marked 'failed'

**In Sandbox:** Auto-completes, so this is production-only

### Scenario 4: Timeout

**Input:**
- Phone: `254708374149`
- Amount: 1000
- User doesn't respond

**Expected Flow:**
1. STK Push sent
2. User ignores prompt
3. No callback received within timeout period
4. Frontend polling stops after 30 attempts (2 minutes)
5. Payment remains 'pending'

**Note:** In sandbox, payments complete instantly. Timeout testing is production-only.

---

## 🎯 Frontend Testing

### Test Flow

1. **Login as Client**
   ```
   Email: client@test.com
   Password: Password123!
   ```

2. **Navigate to Payments**
   ```
   Dashboard → Payments
   ```

3. **Fund Escrow**
   - Click "Fund Escrow"
   - Select contract
   - Enter phone: `0708374149`
   - Click "Pay with M-Pesa"

4. **Watch Status Updates**
   - Initial: "Initiating M-Pesa payment..."
   - Pending: "Check your phone to complete payment"
   - Processing: "Payment confirmed. Updating escrow..."
   - Completed: "Payment successful! Escrow funded."

5. **Verify Payment History**
   - Payment should appear in transaction table
   - Status: "completed"
   - Type: "deposit"

---

## 📊 Verification Checklist

After successful payment:

- [ ] Payment record created in `payments` table
- [ ] Payment status = 'completed'
- [ ] M-Pesa receipt number stored
- [ ] EscrowTransaction created (type='deposit')
- [ ] Milestones status = 'funded'
- [ ] Notification sent to freelancer
- [ ] Payment appears in client's transaction history
- [ ] Escrow balance updated

**SQL Verification:**

```sql
-- Check payment
SELECT * FROM payments WHERE id = 'payment-uuid';

-- Check escrow transaction
SELECT * FROM escrow_transactions WHERE id = 'transaction-uuid';

-- Check milestones
SELECT * FROM milestones WHERE contract_id = 'contract-uuid';

-- Should show status = 'funded'
```

---

## 🔍 Debugging

### Enable Debug Logging

```python
# In mpesa_service.py, add:
import logging
logging.basicConfig(level=logging.DEBUG)

# Before each API call:
print(f"Calling M-Pesa API: {url}")
print(f"Payload: {payload}")

# After response:
print(f"Response: {response.json()}")
```

### Monitor Ngrok Requests

```bash
# Ngrok provides a web interface:
http://localhost:4040

# Shows all HTTP requests to your tunnel
# Check if callback is being received
```

### Check Backend Logs

```bash
# Flask should log all requests:
tail -f backend/logs/app.log

# Or watch terminal output
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Failed to authenticate" | Wrong credentials | Verify Consumer Key/Secret |
| "Invalid phone number" | Wrong format | Use 0712345678 or 254712345678 |
| "Callback not received" | Ngrok not running | Start ngrok, update URL |
| "Payment pending forever" | Callback URL wrong | Check ngrok URL in .env |
| "Escrow not funded" | Callback succeeded but escrow failed | Check contract status, milestones |

---

## 🎬 Video Walkthrough

### Recording a Test Session

1. **Setup Screen Recording**
   - Record entire flow
   - Show browser console
   - Show backend logs

2. **Demonstrate:**
   - Login
   - Open Fund Escrow modal
   - Enter phone number
   - Submit payment
   - Show STK Push (if testing on real phone)
   - Show status updates
   - Show completion
   - Verify in transaction history

3. **Verify in Database**
   - Show payment record
   - Show escrow transaction
   - Show updated milestones

---

## 📞 Sandbox vs Production

### Sandbox

**Pros:**
- ✅ Free testing
- ✅ Instant responses
- ✅ Predictable results

**Cons:**
- ❌ No real money
- ❌ No actual STK Push to phone
- ❌ Can't test user cancellation
- ❌ Can't test timeout behavior

**Use for:**
- Integration testing
- API validation
- Flow verification
- CI/CD pipelines

### Production

**Pros:**
- ✅ Real payments
- ✅ Real user behavior
- ✅ Full flow testing

**Cons:**
- ❌ Costs money
- ❌ Requires production credentials
- ❌ Requires public HTTPS

**Use for:**
- Pre-launch testing
- Beta testing
- Final QA
- Live operations

---

## ✅ Sign-Off Checklist

Before marking integration as complete:

- [ ] Sandbox tests pass (successful payment)
- [ ] Sandbox tests pass (failed payment)
- [ ] Frontend shows correct status updates
- [ ] Payment history displays correctly
- [ ] Escrow balance updates correctly
- [ ] Milestones marked as funded
- [ ] Notifications sent
- [ ] Database records correct
- [ ] No console errors
- [ ] No backend errors
- [ ] Documentation reviewed
- [ ] Environment variables documented
- [ ] Migration runs successfully
- [ ] Code committed to git

---

## 🎓 Next Steps

After successful sandbox testing:

1. **Prepare for Production**
   - Get production credentials
   - Setup production callback URL (HTTPS)
   - Test with small amounts
   - Monitor closely

2. **Implement Payouts**
   - M-Pesa B2C API
   - Automated freelancer payments

3. **Add Monitoring**
   - Payment success rate tracking
   - Failed payment alerts
   - Callback monitoring

4. **Enhance UX**
   - Payment receipts
   - Email confirmations
   - SMS notifications

---

**Happy Testing! 🚀**
