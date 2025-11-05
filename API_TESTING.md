# API Testing Collection - PDF Downloads & Email Services

## Base URL
```
http://localhost:5000/api/v1
```

---

## Step 1: Login to Get Token

### Request
```http
POST http://localhost:5000/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@hospital.com",
  "password": "Admin@123"
}
```

### Response (Save the token!)
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {...}
}
```

**💡 Copy the token value and use it in all subsequent requests!**

---

## Step 2: Get Sample IDs

### Get Prescriptions List
```http
GET http://localhost:5000/api/v1/prescriptions
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI0Yjk5MjVjLTU2YmQtNDk5MS04YjQ0LWI5MjMzYTQxMDA0ZSIsImVtYWlsIjoiYWRtaW5AaG9zcGl0YWwuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzYxNDU1Mzg3LCJleHAiOjE3NjIwNjAxODd9.zYt68IvG4y4LZZ9BK-u65eYZLjJup1o6ht5IgVUAQJY
```

**Response:** Copy an `id` from the results

---

### Get Medical Records List
```http
GET http://localhost:5000/api/v1/medical-records
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI0Yjk5MjVjLTU2YmQtNDk5MS04YjQ0LWI5MjMzYTQxMDA0ZSIsImVtYWlsIjoiYWRtaW5AaG9zcGl0YWwuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzYxNDU1Mzg3LCJleHAiOjE3NjIwNjAxODd9.zYt68IvG4y4LZZ9BK-u65eYZLjJup1o6ht5IgVUAQJY
```

**Response:** Copy an `id` from the results

---

### Get Invoices List
```http
GET http://localhost:5000/api/v1/invoices
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI0Yjk5MjVjLTU2YmQtNDk5MS04YjQ0LWI5MjMzYTQxMDA0ZSIsImVtYWlsIjoiYWRtaW5AaG9zcGl0YWwuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzYxNDU1Mzg3LCJleHAiOjE3NjIwNjAxODd9.zYt68IvG4y4LZZ9BK-u65eYZLjJup1o6ht5IgVUAQJY
```

**Response:** Copy an `id` from the results

---

## 📥 PDF DOWNLOAD TESTS

### 1. Download Prescription PDF
```http
GET http://localhost:5000/api/v1/prescriptions/08c6a81f-fbc5-481c-91c0-8a4a61199525/download
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI0Yjk5MjVjLTU2YmQtNDk5MS04YjQ0LWI5MjMzYTQxMDA0ZSIsImVtYWlsIjoiYWRtaW5AaG9zcGl0YWwuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzYxNDU1Mzg3LCJleHAiOjE3NjIwNjAxODd9.zYt68IvG4y4LZZ9BK-u65eYZLjJup1o6ht5IgVUAQJY
```

**Expected:** PDF file downloads automatically

---

### 2. Download Medical Record PDF
```http
GET http://localhost:5000/api/v1/medical-records/9d823de9-4df3-4a00-b022-24d585f0d090/download
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI0Yjk5MjVjLTU2YmQtNDk5MS04YjQ0LWI5MjMzYTQxMDA0ZSIsImVtYWlsIjoiYWRtaW5AaG9zcGl0YWwuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzYxNDU1Mzg3LCJleHAiOjE3NjIwNjAxODd9.zYt68IvG4y4LZZ9BK-u65eYZLjJup1o6ht5IgVUAQJY
```

**Expected:** PDF file downloads automatically

---

### 3. Download Invoice PDF
```http
GET http://localhost:5000/api/v1/invoices/6fb99cf5-bde4-44e4-9dfa-4b4d38162dc5/download
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI0Yjk5MjVjLTU2YmQtNDk5MS04YjQ0LWI5MjMzYTQxMDA0ZSIsImVtYWlsIjoiYWRtaW5AaG9zcGl0YWwuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzYxNDU1Mzg3LCJleHAiOjE3NjIwNjAxODd9.zYt68IvG4y4LZZ9BK-u65eYZLjJup1o6ht5IgVUAQJY
```

**Expected:** PDF file downloads automatically

---

## 📧 EMAIL SERVICE TESTS

### 1. Email Prescription
```http
POST http://localhost:5000/api/v1/prescriptions/08c6a81f-fbc5-481c-91c0-8a4a61199525/email
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI0Yjk5MjVjLTU2YmQtNDk5MS04YjQ0LWI5MjMzYTQxMDA0ZSIsImVtYWlsIjoiYWRtaW5AaG9zcGl0YWwuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzYxNDU1Mzg3LCJleHAiOjE3NjIwNjAxODd9.zYt68IvG4y4LZZ9BK-u65eYZLjJup1o6ht5IgVUAQJY
Content-Type: application/json

{
  "email": "harshangpatelh@gmail.com"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Prescription sent successfully to harshangpatelh@gmail.com"
}
```

**Check Email For:**
- ✅ Professional purple-themed email
- ✅ Prescription details in email body
- ✅ PDF attachment named `prescription-{number}.pdf`
- ✅ Medication list with dosages
- ✅ Important instructions

---

### 2. Email Medical Record
```http
POST http://localhost:5000/api/v1/medical-records/{RECORD_ID}/email
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "email": "haspatel2006@gmail.com"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Medical record sent successfully to haspatel2006@gmail.com"
}
```

**Check Email For:**
- ✅ Professional green-themed email
- ✅ Confidential information warning
- ✅ PDF attachment with medical record
- ✅ Patient and doctor information
- ✅ Diagnosis and treatment details

---

### 3. Email Invoice
```http
POST http://localhost:5000/api/v1/invoices/{INVOICE_ID}/email
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "email": "haspatel2006@gmail.com"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Invoice sent successfully to haspatel2006@gmail.com"
}
```

**Check Email For:**
- ✅ Professional blue-themed email
- ✅ Invoice summary with total amount
- ✅ PDF attachment named `invoice-{number}.pdf`
- ✅ Payment status and methods
- ✅ Balance due information (if applicable)

---

## 🧪 Complete Test Sequence

### Quick Copy-Paste Test (Replace placeholders)

```bash
# 1. Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hospital.com","password":"Admin@123"}'

# 2. Get Prescriptions (use token from step 1)
curl -X GET http://localhost:5000/api/v1/prescriptions \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Download Prescription PDF
curl -X GET "http://localhost:5000/api/v1/prescriptions/PRESCRIPTION_ID/download" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output prescription.pdf

# 4. Email Prescription
curl -X POST "http://localhost:5000/api/v1/prescriptions/PRESCRIPTION_ID/email" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"haspatel2006@gmail.com"}'

# Repeat for medical-records and invoices
```

---

## 📋 Test Checklist

### PDF Download Tests
- [ ] Prescription PDF downloads
- [ ] Medical Record PDF downloads
- [ ] Invoice PDF downloads
- [ ] All PDFs open correctly
- [ ] Professional formatting visible
- [ ] All data populated

### Email Tests
- [ ] Prescription email sent
- [ ] Medical Record email sent
- [ ] Invoice email sent
- [ ] All emails received
- [ ] PDF attachments present
- [ ] HTML formatting correct
- [ ] Branding visible

### Error Handling Tests
- [ ] Invalid ID returns 404
- [ ] Missing email returns 400
- [ ] Invalid token returns 401
- [ ] Proper error messages

---

## 🔧 Troubleshooting

### "Authentication required"
- Make sure you're including the Bearer token
- Check if token is expired (login again)

### "Not found" errors
- Verify the ID exists in database
- Use IDs from the list endpoints

### "Email not sent"
- Check backend console for SMTP errors
- Verify email credentials in .env
- Check internet connection

### PDFs not generating
- Check backend console for pdfkit errors
- Verify all required fields are in database

---

## 🎯 Success Indicators

When everything works correctly, you should see:

**Backend Console:**
```
✅ PDF generated for prescription: RX-001
✅ Email sent successfully to: haspatel2006@gmail.com
```

**API Responses:**
```json
{
  "success": true,
  "message": "Operation completed successfully"
}
```

**Email Inbox:**
- 3 beautiful professionally designed emails
- Each with relevant PDF attachment
- Clear branding and formatting
- Appropriate icons and colors

---

## 📊 Testing Status

| Feature | Status | Time | Notes |
|---------|--------|------|-------|
| Prescription PDF | ⏳ | | |
| Prescription Email | ⏳ | | |
| Medical Record PDF | ⏳ | | |
| Medical Record Email | ⏳ | | |
| Invoice PDF | ⏳ | | |
| Invoice Email | ⏳ | | |

Legend: ✅ Passed | ❌ Failed | ⏳ Pending | 🔄 In Progress

---

## 💡 Tips

1. **Use Thunder Client Extension** in VS Code for easy API testing
2. **Keep Gmail open** to see emails arrive in real-time
3. **Check spam folder** if emails don't appear immediately
4. **Use your own email** (haspatel2006@gmail.com) for testing
5. **Save successful IDs** for repeated testing

---

## 🚀 Ready to Test!

1. ✅ Backend running on port 5000
2. ✅ Frontend running on port 3000
3. ✅ Email configured (haspatel2006@gmail.com)
4. ✅ All endpoints ready

**Start testing and enjoy your new features!** 🎉
