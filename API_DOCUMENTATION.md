# Washvix API Documentation

**Base URL:** `http://localhost:5000`

---

## 📋 Table of Contents

1. [Booking Management](#booking-management)
2. [Time Slots Management](#time-slots-management)
3. [Statistics & Reports](#statistics--reports)
4. [Search & Export](#search--export)
5. [Error Handling](#error-handling)
6. [Response Format](#response-format)

---

## Booking Management

### 1. Get All Bookings
**Endpoint:** `GET /api/bookings`

**Description:** Retrieve all bookings from the system.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1693123200000,
      "name": "John Doe",
      "phone": "+91 98765 43210",
      "email": "john@example.com",
      "services": "Basic Wash, Premium Interior",
      "vehicleSize": "hatchback",
      "vehicleMake": "Honda City",
      "vehicleYear": 2022,
      "vehicleColor": "Black",
      "bookingDate": "2026-09-05",
      "bookingTime": "10:00",
      "location": "123 Main Street",
      "requests": "Please be careful with the paint",
      "price": "₹698",
      "status": "pending",
      "timestamp": "2024-08-27T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 2. Get Single Booking
**Endpoint:** `GET /api/bookings/:id`

**Description:** Retrieve a specific booking by ID.

**Parameters:**
- `id` (path) - Booking ID (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1693123200000,
    "name": "John Doe",
    ...
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Booking not found"
}
```

---

### 3. Create Booking
**Endpoint:** `POST /api/bookings`

**Description:** Create a new booking.

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "+91 98765 43210",
  "email": "john@example.com",
  "services": "Basic Wash, Premium Interior",
  "vehicleSize": "hatchback",
  "vehicleMake": "Honda City",
  "vehicleYear": 2022,
  "vehicleColor": "Black",
  "bookingDate": "2026-09-05",
  "bookingTime": "10:00",
  "location": "123 Main Street",
  "requests": "Please be careful with the paint",
  "price": "₹698"
}
```

**Required Fields:**
- `name` - Customer name
- `phone` - Customer phone number
- `bookingDate` - Date in YYYY-MM-DD format
- `bookingTime` - Time in HH:MM format

**Response (201):**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": 1693123200000,
    "name": "John Doe",
    ...
    "status": "pending",
    "timestamp": "2024-08-27T10:00:00.000Z"
  }
}
```

**Error Response (400 - Missing Fields):**
```json
{
  "success": false,
  "error": "Missing required fields"
}
```

**Error Response (409 - Slot Booked):**
```json
{
  "success": false,
  "error": "This time slot is already booked"
}
```

---

### 4. Update Booking Status
**Endpoint:** `PUT /api/bookings/:id/status`

**Description:** Update the status of a booking (Admin only).

**Parameters:**
- `id` (path) - Booking ID (required)

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Valid Statuses:** `pending`, `confirmed`, `completed`, `cancelled`

**Response:**
```json
{
  "success": true,
  "message": "Booking status updated",
  "data": {
    "id": 1693123200000,
    ...
    "status": "confirmed"
  }
}
```

---

### 5. Reschedule Booking
**Endpoint:** `PUT /api/bookings/:id/reschedule`

**Description:** Reschedule an existing booking to a different date/time.

**Parameters:**
- `id` (path) - Booking ID (required)

**Request Body:**
```json
{
  "bookingDate": "2026-09-10",
  "bookingTime": "14:00"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking rescheduled successfully",
  "data": {
    "id": 1693123200000,
    ...
    "bookingDate": "2026-09-10",
    "bookingTime": "14:00"
  }
}
```

---

### 6. Delete Booking
**Endpoint:** `DELETE /api/bookings/:id`

**Description:** Cancel/delete a specific booking.

**Parameters:**
- `id` (path) - Booking ID (required)

**Response:**
```json
{
  "success": true,
  "message": "Booking deleted successfully"
}
```

---

### 7. Delete All Bookings
**Endpoint:** `DELETE /api/bookings` ⚠️ **Admin Only**

**Description:** Delete all bookings from the system.

**Response:**
```json
{
  "success": true,
  "message": "All bookings cleared"
}
```

---

## Time Slots Management

### 1. Get All Booked Slots
**Endpoint:** `GET /api/booked-slots`

**Description:** Get all booked time slots.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2026-09-05",
      "time": "10:00",
      "bookingId": 1693123200000
    }
  ],
  "count": 1
}
```

---

### 2. Get Booked Slots for Specific Date
**Endpoint:** `GET /api/booked-slots/:date`

**Description:** Get all booked slots for a specific date.

**Parameters:**
- `date` (path) - Date in YYYY-MM-DD format (required)

**Response:**
```json
{
  "success": true,
  "date": "2026-09-05",
  "data": [
    {
      "date": "2026-09-05",
      "time": "10:00",
      "bookingId": 1693123200000
    }
  ],
  "count": 1
}
```

---

### 3. Get Available Slots for Specific Date
**Endpoint:** `GET /api/available-slots/:date`

**Description:** Get all available time slots for a specific date.

**Parameters:**
- `date` (path) - Date in YYYY-MM-DD format (required)

**Response:**
```json
{
  "success": true,
  "date": "2026-09-05",
  "available": ["08:00", "09:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"],
  "booked": ["10:00"],
  "count": 9
}
```

---

## Statistics & Reports

### 1. Get Statistics
**Endpoint:** `GET /api/statistics`

**Description:** Get overall booking statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBookings": 42,
    "upcomingBookings": 15,
    "totalRevenue": 29316,
    "averageRevenue": 698
  }
}
```

---

### 2. Get Filter Bookings
**Endpoint:** `GET /api/bookings/filter?date=2026-09-05&phone=98765`

**Description:** Filter bookings by date and/or phone number.

**Query Parameters:**
- `date` (optional) - Filter by booking date (YYYY-MM-DD)
- `phone` (optional) - Filter by phone number (partial match)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1693123200000,
      "name": "John Doe",
      "phone": "+91 98765 43210",
      ...
    }
  ],
  "count": 1
}
```

---

### 3. Get Daily Revenue Report
**Endpoint:** `GET /api/reports/daily?date=2026-09-05`

**Description:** Get revenue report for a specific day or all days.

**Query Parameters:**
- `date` (optional) - Filter by specific date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "2026-09-05": 2094,
    "2026-09-06": 1396,
    "2026-09-07": 698
  },
  "totalRevenue": 4188
}
```

---

## Search & Export

### 1. Search Bookings
**Endpoint:** `GET /api/search?q=John`

**Description:** Search bookings by customer name, phone, email, vehicle, or services.

**Query Parameters:**
- `q` (required) - Search query

**Response:**
```json
{
  "success": true,
  "query": "John",
  "data": [
    {
      "id": 1693123200000,
      "name": "John Doe",
      ...
    }
  ],
  "count": 1
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Search query is required"
}
```

---

### 2. Export Bookings as JSON
**Endpoint:** `GET /api/export/json`

**Description:** Download all bookings as a JSON file.

**Response:** Downloads `bookings.json` file

---

### 3. Export Bookings as CSV
**Endpoint:** `GET /api/export/csv`

**Description:** Download all bookings as a CSV file.

**Response:** Downloads `bookings.csv` file

**CSV Format:**
```
ID,Name,Phone,Email,Date,Time,Vehicle Make,Vehicle Size,Services,Status,Price
1693123200000,"John Doe","+91 98765 43210","john@example.com",2026-09-05,10:00,"Honda City","hatchback","Basic Wash, Premium Interior",pending,"₹698"
```

---

## Health Check

**Endpoint:** `GET /api/health`

**Description:** Check if the API is running.

**Response:**
```json
{
  "success": true,
  "message": "Washvix backend server is running",
  "timestamp": "2024-08-27T10:00:00.000Z"
}
```

---

## Error Handling

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Description of what went wrong"
}
```

**HTTP Status Codes:**
- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request or missing required fields
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., slot already booked)
- `500 Internal Server Error` - Server-side error

---

## Response Format

All responses are in JSON format with the following structure:

```json
{
  "success": true|false,
  "data": {},
  "message": "Optional message",
  "error": "Optional error message",
  "count": "Optional count for array responses"
}
```

---

## Setup & Running

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Server
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

### 4. Test the API
```bash
# Health check
curl http://localhost:5000/api/health

# Get all bookings
curl http://localhost:5000/api/bookings

# Create a booking
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "phone": "+91 91234 56789",
    "email": "jane@example.com",
    "bookingDate": "2026-09-15",
    "bookingTime": "14:00",
    "services": "Premium Wash",
    "vehicleMake": "Toyota Innova",
    "vehicleSize": "suv",
    "price": "₹898"
  }'
```

---

## Features

✅ **Booking Management** - Create, read, update, delete bookings
✅ **Time Slot Management** - Track booked and available slots
✅ **Status Tracking** - Update booking status (pending, confirmed, completed, cancelled)
✅ **Rescheduling** - Allow customers to reschedule appointments
✅ **Search** - Search bookings by customer details or vehicle info
✅ **Reports** - Generate revenue reports
✅ **Data Export** - Export bookings as JSON or CSV
✅ **Email/SMS Notifications** - Send booking confirmations (optional)
✅ **Statistics** - Track total bookings, revenue, and metrics
✅ **Error Handling** - Comprehensive error messages
✅ **CORS Support** - Access from frontend applications
✅ **JSON File Storage** - No database setup required (can upgrade to MongoDB/PostgreSQL)

---

## Future Enhancements

- [ ] Database upgrade (MongoDB/PostgreSQL)
- [ ] User authentication & authorization
- [ ] Payment integration (Razorpay, PayPal)
- [ ] Admin dashboard API
- [ ] Customer login & booking history
- [ ] Rating & review system
- [ ] Promotional codes/discounts
- [ ] Multi-location support
- [ ] Advance booking confirmation
- [ ] Service package management

---

## Support

For issues or questions, contact: support@washvix.com

**API Version:** 1.0.0
**Last Updated:** September 2024
