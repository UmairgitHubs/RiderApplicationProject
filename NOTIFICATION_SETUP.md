# 🔔 Notification System - Complete Setup Guide

## ✅ What's Been Implemented

### 1. **Database Schema** ✅
- Added 5 notification preference fields to User model
- Fields: `notif_order_updates`, `notif_delivery_alerts`, `notif_payments`, `notif_promotions`, `notif_system_updates`

### 2. **Backend Services** ✅
- **NotificationService**: Complete notification handling
  - Push notifications via Firebase Cloud Messaging
  - Email notifications via Nodemailer
  - Database storage for in-app notifications
  - User preference checking before sending

### 3. **Notification Triggers** ✅
- Integrated into shipment status updates
- Sends notifications when:
  - Order is assigned to rider
  - Order is picked up
  - Order is in transit
  - Order is delivered
  - Order is cancelled

### 4. **Frontend Integration** ✅
- Notification settings screen fully functional
- All toggles save to database
- Settings persist across sessions

---

## 🔧 Configuration Required

### **Step 1: Firebase Setup (For Push Notifications)**

1. **Create Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use existing one
   - Enable Cloud Messaging

2. **Get Service Account Key:**
   ```bash
   # In Firebase Console:
   # Project Settings → Service Accounts → Generate New Private Key
   # Download the JSON file
   ```

3. **Add to Environment Variables:**
   ```env
   # In backend/.env
   FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"your-project",...}'
   ```

   **OR** (Recommended for production):
   ```env
   # Store the JSON file securely and reference it
   FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccountKey.json
   ```

### **Step 2: Email Setup (For Email Notifications)**

Add these to your `backend/.env` file:

```env
# SMTP Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Use App Password, not regular password
SMTP_FROM="Zimli Delivery <noreply@zimli.com>"

# App URL for email links
APP_URL=https://your-app-url.com
```

**For Gmail:**
1. Enable 2-Factor Authentication
2. Generate App Password: [Google Account → Security → App Passwords](https://myaccount.google.com/apppasswords)
3. Use the generated 16-character password

**For Other Email Providers:**
- **SendGrid**: Use API key
- **AWS SES**: Configure AWS credentials
- **Mailgun**: Use SMTP credentials

### **Step 3: Frontend Firebase Setup**

1. **Install Expo Notifications:**
   ```bash
   cd RiderApp
   npx expo install expo-notifications expo-device expo-constants
   ```

2. **Add Firebase Config to app.json:**
   ```json
   {
     "expo": {
       "android": {
         "googleServicesFile": "./google-services.json"
       },
       "ios": {
         "googleServicesFile": "./GoogleService-Info.plist"
       },
       "plugins": [
         [
           "expo-notifications",
           {
             "icon": "./assets/notification-icon.png",
             "color": "#FF6B00"
           }
         ]
       ]
     }
   }
   ```

3. **Download Config Files:**
   - **Android**: Download `google-services.json` from Firebase
   - **iOS**: Download `GoogleService-Info.plist` from Firebase
   - Place them in the RiderApp root directory

---

## 🚀 How It Works Now

### **When Shipment Status Changes:**

```typescript
// Example: Merchant creates shipment
POST /api/shipments

// System automatically:
1. Creates shipment in database ✅
2. Checks merchant's notification preferences ✅
3. If "Order Updates" is enabled:
   - Sends push notification (if push_notifications = true) ✅
   - Sends email (if email_notifications = true) ✅
   - Stores in-app notification ✅
4. If disabled, skips notification ✅
```

### **Notification Flow:**

```
Shipment Status Update
        ↓
Check User Preferences
        ↓
┌───────┴───────┐
│               │
Push Enabled?   Email Enabled?
│               │
Yes → Send      Yes → Send
No → Skip       No → Skip
        ↓
Store in Database
(for in-app display)
```

---

## 📱 Testing the System

### **Test 1: Order Update Notification**

1. **Enable "Order Updates" in app**
2. **Create a shipment**
3. **Update shipment status**
4. **Expected Result:**
   - Push notification appears (if configured)
   - Email sent (if configured)
   - Notification stored in database

### **Test 2: Disabled Notifications**

1. **Disable "Order Updates" in app**
2. **Update shipment status**
3. **Expected Result:**
   - NO push notification
   - NO email
   - Still stored in database (for in-app view)

### **Test 3: Selective Notifications**

1. **Enable push, disable email**
2. **Update shipment**
3. **Expected Result:**
   - Push notification sent
   - NO email sent

---

## 🔍 Troubleshooting

### **Push Notifications Not Working:**

1. **Check Firebase initialization:**
   ```bash
   # Look for this in backend logs:
   "Firebase Admin initialized successfully"
   ```

2. **Verify FCM token:**
   ```sql
   SELECT fcm_token FROM users WHERE id = 'user-id';
   -- Should not be null
   ```

3. **Check user preferences:**
   ```sql
   SELECT push_notifications, notif_order_updates 
   FROM users WHERE id = 'user-id';
   -- Both should be true
   ```

### **Email Notifications Not Working:**

1. **Check SMTP configuration:**
   ```bash
   # In backend logs, look for:
   "Email notification sent to user@example.com"
   # OR
   "Email not configured - skipping email notification"
   ```

2. **Test SMTP connection:**
   ```typescript
   // Add to backend/src/services/notification.service.ts temporarily:
   emailTransporter.verify((error, success) => {
     if (error) {
       console.log('SMTP Error:', error);
     } else {
       console.log('SMTP Server is ready');
     }
   });
   ```

### **Notifications Sent But User Doesn't Receive:**

1. **Check notification preferences in database**
2. **Verify FCM token is valid**
3. **Check spam folder for emails**
4. **Ensure app has notification permissions**

---

## 📊 Current Status

| Feature | Status | Notes |
|---------|--------|-------|
| **Preference Storage** | ✅ Fully Working | All settings save to database |
| **Preference Retrieval** | ✅ Fully Working | Settings load on screen open |
| **Order Update Triggers** | ✅ Fully Working | Fires on status change |
| **Delivery Alert Triggers** | ✅ Fully Working | Fires on delivery events |
| **Push Notifications** | ⚙️ Needs Config | Requires Firebase setup |
| **Email Notifications** | ⚙️ Needs Config | Requires SMTP setup |
| **In-App Notifications** | ✅ Fully Working | Stored in database |
| **User Preference Checking** | ✅ Fully Working | Respects user choices |

---

## 🎯 Next Steps

### **For Development/Testing (Without Firebase/Email):**
The system works! Notifications are:
- ✅ Stored in database
- ✅ User preferences respected
- ✅ Triggers fire correctly
- ⚠️ Push/Email skipped (but logged)

### **For Production:**
1. Set up Firebase (30 minutes)
2. Configure SMTP (15 minutes)
3. Test on real devices
4. Monitor logs for errors

---

## 💡 Pro Tips

1. **Start with Email Only**: Easier to set up and test
2. **Use Gmail App Passwords**: Most reliable for testing
3. **Check Logs**: All notifications are logged
4. **Test Incrementally**: Enable one notification type at a time
5. **Monitor Database**: Check `notifications` table for stored notifications

---

## 📝 Summary

**What You Have:**
- ✅ Complete notification infrastructure
- ✅ User preference management
- ✅ Smart notification triggers
- ✅ Database storage
- ✅ Error handling
- ✅ Production-ready code

**What You Need:**
- Firebase credentials (optional, for push)
- SMTP credentials (optional, for email)

**The system is fully functional** and will work perfectly once you add the credentials!
