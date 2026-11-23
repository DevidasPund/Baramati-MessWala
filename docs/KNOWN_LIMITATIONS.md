# MessMate – Known Limitations & Future Roadmap

**Business**: Baramati Messwala (बारामती मेसवाला)  
**Version**: 1.0.0 Production Release  

---

## 1. Current System Limitations & Workarounds

### 1.1 WhatsApp Cloud API Delivery (Disabled by Default)
- **Status**: The WhatsApp notification integration is architected in `backend/src/integrations/whatsapp.js`, but is intentionally disabled (`WHATSAPP_ENABLED=false`).
- **Reason**: Requires a verified Meta Business Account, registered phone number certificate, and pre-approved template namespaces.
- **Client Impact**: In-app notifications and dashboard announcements operate without interruption. When the client provisions Meta credentials, WhatsApp delivery can be toggled on without codebase modifications.

### 1.2 Free/Starter Hosting Cold Starts
- **Status**: Backend is deployed on Render Starter tier.
- **Behavior**: If inactive for more than 15 minutes, initial API requests may experience a 30–50 second wake-up latency before returning responses in $<600\text{ms}$.
- **Workaround / Upgrade**: An inexpensive Render standard tier or uptime monitoring ping (e.g., UptimeRobot) eliminates idle sleeping.

### 1.3 Offline Camera Scanning
- **Status**: PWA caches customer QR dining passes so customers can show their QR code without active internet.
- **Limitation**: The owner's scanner device requires an active internet connection (Wi-Fi or cellular data) to post the scan token to the backend and query real-time database eligibility.

### 1.4 Automatic Payment Gateway Webhooks
- **Status**: Payment submission operates via UPI Reference (UTR) submission + owner manual verification.
- **Reason**: Standard UPI QR codes (BHIM/GPay/PhonePe) do not support automatic server webhooks without an aggregator merchant account (Razorpay/Cashfree/PayU).
- **Client Benefit**: Eliminates $2\% - 3\%$ payment gateway transaction fees for the mess owner while preventing fraudulent payment claims through the mandatory "Confirm Paid" rule.

---

## 2. Future Feature Roadmap (Post-Handover)

1. **Automated WhatsApp Attendance Ping**: Send automated daily SMS/WhatsApp confirmations to parents/guardians when a student takes dinner.
2. **Biometric Fingerprint Integration**: Optional USB biometric sensor fallback for students without smartphones.
3. **Multi-Branch Expansion**: Support for additional mess branches under the Baramati Messwala franchise banner.
