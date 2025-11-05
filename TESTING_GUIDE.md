# Testing Guide - PDF Download & Email Services

## 🎯 What We're Testing

1. **PDF Download Functionality** (3 endpoints)
2. **Email Services with PDF Attachments** (3 endpoints)

---

## 🚀 Prerequisites

- ✅ Backend running on http://localhost:5000
- ✅ Frontend running on http://localhost:3000
- ✅ Email credentials configured in `.env` file

---

## 📧 Email Configuration

Before testing emails, update `server/.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**Note:** For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833).

---

## 🧪 Test Cases

### 1. PRESCRIPTION PDF DOWNLOAD

**Endpoint:** `GET /api/v1/prescriptions/:id/download`

**Steps:**
1. Login to http://localhost:3000
2. Navigate to Prescriptions section
3. Click on any prescription to view details
4. Look for "Download PDF" button (or test via API)
5. **Expected Result:** PDF file downloads with prescription details

**API Test (using Thunder Client/Postman):**
```
GET http://localhost:5000/api/v1/prescriptions/{prescription-id}/download
Authorization: Bearer {your-token}
```

---

### 2. PRESCRIPTION EMAIL SERVICE

**Endpoint:** `POST /api/v1/prescriptions/:id/email`

**Request Body:**
```json
{
  "email": "recipient@example.com"
}
```

**Steps:**
1. Use API client (Thunder Client/Postman)
2. Send POST request with prescription ID and email
3. Check recipient email inbox
4. **Expected Result:** 
   - Beautiful HTML email with prescription details
   - PDF attachment named `prescription-{number}.pdf`
   - Professional medical formatting

**API Test:**
```
POST http://localhost:5000/api/v1/prescriptions/{prescription-id}/email
Authorization: Bearer {your-token}
Content-Type: application/json

{
  "email": "test@example.com"
}
```

---

### 3. MEDICAL RECORD PDF DOWNLOAD

**Endpoint:** `GET /api/v1/medical-records/:id/download`

**Steps:**
1. Navigate to Medical Records section
2. Select a medical record
3. Click "Download PDF" button
4. **Expected Result:** PDF with complete medical record including:
   - Patient info
   - Vital signs
   - Diagnoses
   - Treatment plan

**API Test:**
```
GET http://localhost:5000/api/v1/medical-records/{record-id}/download
Authorization: Bearer {your-token}
```

---

### 4. MEDICAL RECORD EMAIL SERVICE

**Endpoint:** `POST /api/v1/medical-records/:id/email`

**Request Body:**
```json
{
  "email": "recipient@example.com"
}
```

**Steps:**
1. Use API client
2. Send POST request with medical record ID
3. Check email
4. **Expected Result:**
   - Professional email with confidentiality notice
   - PDF attachment with full medical record
   - Secure formatting with warnings

**API Test:**
```
POST http://localhost:5000/api/v1/medical-records/{record-id}/email
Authorization: Bearer {your-token}
Content-Type: application/json

{
  "email": "test@example.com"
}
```

---

### 5. INVOICE PDF DOWNLOAD

**Endpoint:** `GET /api/v1/invoices/:id/download`

**Steps:**
1. Navigate to Billing > Invoices
2. Click on any invoice
3. Click "Download PDF" button
4. **Expected Result:** PDF invoice with:
   - Invoice details
   - Item breakdown
   - Tax and discount calculations
   - Payment status
   - Balance due (if applicable)

**API Test:**
```
GET http://localhost:5000/api/v1/invoices/{invoice-id}/download
Authorization: Bearer {your-token}
```

---

### 6. INVOICE EMAIL SERVICE

**Endpoint:** `POST /api/v1/invoices/:id/email`

**Request Body:**
```json
{
  "email": "recipient@example.com"
}
```

**Steps:**
1. Use API client
2. Send POST request with invoice ID
3. Check email
4. **Expected Result:**
   - Professional billing email
   - Payment instructions
   - PDF invoice attachment
   - Total amount highlighted

**API Test:**
```
POST http://localhost:5000/api/v1/invoices/{invoice-id}/email
Authorization: Bearer {your-token}
Content-Type: application/json

{
  "email": "test@example.com"
}
```

---

## 🔍 How to Get IDs for Testing

### Method 1: Through Frontend
1. Login and navigate to respective sections
2. View any item - ID will be in the URL
3. Example: `/dashboard/prescriptions/abc-123-def` → ID is `abc-123-def`

### Method 2: Through API
```bash
# Get Prescriptions
GET http://localhost:5000/api/v1/prescriptions
Authorization: Bearer {token}

# Get Medical Records
GET http://localhost:5000/api/v1/medical-records
Authorization: Bearer {token}

# Get Invoices
GET http://localhost:5000/api/v1/invoices
Authorization: Bearer {token}
```

---

## ✅ Success Criteria

### PDF Downloads:
- ✅ File downloads successfully
- ✅ Correct filename format
- ✅ Professional formatting with header/footer
- ✅ All data populated correctly
- ✅ No TypeScript/runtime errors

### Email Services:
- ✅ Email received within 30 seconds
- ✅ HTML rendering correctly
- ✅ PDF attachment present and openable
- ✅ Professional design with branding
- ✅ Correct recipient
- ✅ Success response from API

---

## 🐛 Troubleshooting

### PDF Downloads Not Working:
1. Check backend console for errors
2. Verify authentication token is valid
3. Ensure ID exists in database
4. Check if pdfkit is installed: `npm list pdfkit`

### Emails Not Sending:
1. Verify EMAIL_* environment variables
2. Check Gmail App Password (not regular password)
3. Enable "Less secure app access" if needed
4. Check backend console for SMTP errors
5. Test with a simple test endpoint first

### Common Errors:

**"Prescription not found"**
- Solution: Use a valid prescription ID from database

**"SMTP connection failed"**
- Solution: Check email credentials and internet connection

**"Authentication required"**
- Solution: Include valid JWT token in Authorization header

---

## 📊 Test Results Template

| Test Case | Status | Notes |
|-----------|--------|-------|
| Prescription PDF Download | ⏳ | |
| Prescription Email | ⏳ | |
| Medical Record PDF Download | ⏳ | |
| Medical Record Email | ⏳ | |
| Invoice PDF Download | ⏳ | |
| Invoice Email | ⏳ | |

Update status: ✅ Pass | ❌ Fail | ⏳ Pending

---

## 🎨 Email Template Preview

### Prescription Email Features:
- Purple gradient header with Rx symbol
- Patient and doctor information
- Medication list with dosages
- Important instructions
- Professional footer

### Medical Record Email Features:
- Green gradient header
- Confidential warning banner
- Record details with diagnosis
- Security reminders
- Medical disclaimer

### Invoice Email Features:
- Blue gradient header
- Invoice summary box
- Large total amount display
- Payment methods list
- Balance due highlighting

---

## 📝 Quick Test Commands

```bash
# Login and get token
POST http://localhost:5000/api/v1/auth/login
{
  "email": "admin@hospital.com",
  "password": "your-password"
}

# Copy the token from response

# Test Prescription PDF
GET http://localhost:5000/api/v1/prescriptions/{id}/download
Authorization: Bearer {token}

# Test Prescription Email
POST http://localhost:5000/api/v1/prescriptions/{id}/email
Authorization: Bearer {token}
{
  "email": "your-test-email@gmail.com"
}

# Repeat for medical-records and invoices
```

---

## 🎉 Feature Summary

**Total New Features Added:**
- 3 PDF generation templates
- 3 Download endpoints
- 3 Email service functions
- 3 Professional email templates
- Nodemailer integration
- PDFKit integration

**Total Feature Count:** ~95-105 new features in Phase 2A!

---

Happy Testing! 🚀
