# API Testing Guide for Washvix

## Quick Test Commands

### 1. Health Check
```bash
curl http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Washvix backend server is running",
  "timestamp": "2024-08-27T10:00:00.000Z"
}
```

---

## 2. Create a Test Booking

### Using PowerShell (Invoke-WebRequest)
```powershell
$booking = @{
    name = "Test Customer"
    phone = "+91 99999 88888"
    email = "test@example.com"
    services = "Basic Wash"
    vehicleSize = "sedan"
    vehicleMake = "Maruti Swift"
    vehicleYear = 2023
    vehicleColor = "White"
    bookingDate = "2026-09-10"
    bookingTime = "10:00"
    location = "123 Test Street"
    requests = "Test request"
    price = "₹499"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/bookings" `
  -Method POST `
  -ContentType "application/json" `
  -Body $booking `
  -UseBasicParsing

$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

### Using cURL (Git Bash or CMD with curl)
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "phone": "+91 99999 88888",
    "email": "test@example.com",
    "services": "Basic Wash",
    "vehicleSize": "sedan",
    "vehicleMake": "Maruti Swift",
    "vehicleYear": 2023,
    "vehicleColor": "White",
    "bookingDate": "2026-09-10",
    "bookingTime": "10:00",
    "location": "123 Test Street",
    "requests": "Test request",
    "price": "₹499"
  }'
```

---

## 3. Get All Bookings
```bash
curl http://localhost:5000/api/bookings
```

---

## 4. Get Available Slots for a Date
```bash
curl http://localhost:5000/api/available-slots/2026-09-10
```

---

## 5. Get Statistics
```bash
curl http://localhost:5000/api/statistics
```

---

## 6. Search Bookings
```bash
curl "http://localhost:5000/api/search?q=Test%20Customer"
```

---

## 7. Export Bookings as CSV
```bash
curl http://localhost:5000/api/export/csv > bookings.csv
```

---

## 8. Get Daily Revenue Report
```bash
curl http://localhost:5000/api/reports/daily
```

---

## Testing in Browser

You can test GET endpoints directly in your browser:

1. **Health Check**
   ```
   http://localhost:5000/api/health
   ```

2. **Get All Bookings**
   ```
   http://localhost:5000/api/bookings
   ```

3. **Get Bookings for Specific Date**
   ```
   http://localhost:5000/api/booked-slots/2026-09-10
   ```

4. **Get Available Slots**
   ```
   http://localhost:5000/api/available-slots/2026-09-10
   ```

5. **Get Statistics**
   ```
   http://localhost:5000/api/statistics
   ```

6. **Search**
   ```
   http://localhost:5000/api/search?q=John
   ```

7. **Export CSV**
   ```
   http://localhost:5000/api/export/csv
   ```

8. **Export JSON**
   ```
   http://localhost:5000/api/export/json
   ```

---

## Testing with Postman

1. Download Postman from https://www.postman.com/downloads/
2. Create a new collection "Washvix API"
3. Add requests for each endpoint
4. Set base URL to `http://localhost:5000`

### Sample Postman Tests

**Create Booking (POST):**
- URL: `http://localhost:5000/api/bookings`
- Method: POST
- Headers: `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "name": "John Smith",
  "phone": "+91 98765 43210",
  "email": "john@example.com",
  "services": "Premium Wash",
  "vehicleSize": "suv",
  "vehicleMake": "Toyota Innova",
  "vehicleYear": 2022,
  "vehicleColor": "Silver",
  "bookingDate": "2026-09-15",
  "bookingTime": "14:00",
  "location": "456 Main Road",
  "requests": "Extra care for windshield",
  "price": "₹899"
}
```

**Update Booking Status (PUT):**
- URL: `http://localhost:5000/api/bookings/{BOOKING_ID}/status`
- Method: PUT
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "status": "confirmed"
}
```

**Reschedule Booking (PUT):**
- URL: `http://localhost:5000/api/bookings/{BOOKING_ID}/reschedule`
- Method: PUT
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "bookingDate": "2026-09-20",
  "bookingTime": "16:00"
}
```

**Delete Booking (DELETE):**
- URL: `http://localhost:5000/api/bookings/{BOOKING_ID}`
- Method: DELETE

---

## Troubleshooting

### Server won't start
1. Check if port 5000 is already in use
2. Verify Node.js is installed: `node --version`
3. Verify npm packages are installed: Check for `node_modules` folder

### CORS errors on frontend
- Make sure backend is running with CORS enabled
- Check that frontend is making requests to `http://localhost:5000`

### Booking creation fails with "slot already booked"
- The time slot is already reserved
- Use `/api/available-slots/DATE` to check available times

### Email/SMS notifications not working
- Configure `.env` file with email and Twilio credentials
- See `.env.example` for required fields
- If not configured, notifications are logged to console

---

## API Response Examples

### Successful Booking Creation
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": 1693123200000,
    "name": "John Smith",
    "phone": "+91 98765 43210",
    "email": "john@example.com",
    "bookingDate": "2026-09-10",
    "bookingTime": "10:00",
    "services": "Basic Wash",
    "vehicleMake": "Maruti Swift",
    "status": "pending",
    "timestamp": "2024-08-27T10:00:00.000Z"
  }
}
```

### Available Slots Response
```json
{
  "success": true,
  "date": "2026-09-10",
  "available": [
    "08:00",
    "09:00",
    "11:00",
    "12:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00"
  ],
  "booked": ["10:00"],
  "count": 9
}
```

### Error Response
```json
{
  "success": false,
  "error": "Missing required fields"
}
```

---

## Performance Tips

1. Use `/api/available-slots/:date` before showing booking form
2. Cache availability data in frontend to reduce API calls
3. Use `/api/search` for filtering instead of getting all bookings
4. Implement pagination for large datasets
5. Use `/api/export/csv` for bulk data operations

---

## Next Steps

1. ✅ API is running and ready to use
2. ⬜ Integrate frontend files with API
3. ⬜ Test all endpoints thoroughly
4. ⬜ Configure email/SMS notifications (optional)
5. ⬜ Deploy to production server
