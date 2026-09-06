# Washvix Backend Setup Guide

## 📋 Overview

The Washvix backend is a Node.js + Express server that handles:
- Booking management
- Time slot availability tracking
- Admin operations
- Data persistence (JSON file storage)

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)

### Step 1: Install Dependencies
```bash
cd washvix
npm install
```

This will install:
- **Express** - Web framework
- **CORS** - Enable cross-origin requests
- **nodemon** (optional) - Auto-reload during development

### Step 2: Start the Server
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

You should see:
```

### Email notification for new bookings

### Admin authentication

Copy `.env.example` to `.env` and set private values for `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `AUTH_SECRET`. Open `http://localhost:5000/admin.html` and sign in with those credentials. The admin session is stored in an HTTP-only cookie and expires after 8 hours. Never commit `.env` or use the example password in production.

Copy `.env.example` to `.env`, then configure `EMAIL_USER` and `EMAIL_PASS` with an SMTP account or Gmail app password. New bookings are sent to `ADMIN_EMAIL` (defaults to `washvix@gmail.com`).

When an admin changes a booking to `confirmed`, `completed`, `cancelled`, or `rescheduled` in `admin.html`, the backend sends a status email to the customer's email address saved with the booking. The status email includes the booking date, time, vehicle, services, and cost. Restart the backend after changing `.env`.

For Gmail, use a Google app password for `EMAIL_PASS`; do not use the regular Gmail password. Example:

```env
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASS=your-16-character-app-password
EMAIL_FROM=your-gmail-address@gmail.com
ADMIN_EMAIL=washvix@gmail.com
```

### EmailJS notifications without backend email

The booking page also supports EmailJS. In the EmailJS dashboard:

1. Create an Email Service and note its Service ID.
2. Create an Email Template and use the following settings:

**To email:** `{{to_email}}`

In the EmailJS template settings, set **To Email** to `{{to_email}}` so every new booking is delivered directly to the configured admin address (`washvix@gmail.com`). Set **Reply To** to `{{reply_to}}` so the admin can reply to the customer.

**Subject:** `New Washvix booking - {{booking_id}}`

**Message:**

```text
Hello Washvix Admin,

A new car wash booking has been received.

Booking ID: {{booking_id}}

Customer details
Name: {{customer_name}}
Phone: {{customer_phone}}
Email: {{customer_email}}

Booking details
Service: {{services}}
Vehicle: {{vehicle}}
Date: {{booking_date}}
Time: {{booking_time}}
Location: {{location}}
Estimated price: {{price}}
Special requests: {{requests}}

Please contact the customer to confirm the booking.

Washvix
```

3. Set **Reply To** to `{{reply_to}}` and ensure the template includes these variables: `to_email`, `to_name`, `reply_to`, `from_name`, `booking_id`, `customer_name`, `customer_phone`, `customer_email`, `booking_date`, `booking_time`, `services`, `vehicle`, `location`, `price`, and `requests`.
4. Copy the Public Key, Service ID, and Template ID into the three `EMAILJS_*` constants near the bottom of `book.html`.

The recipient is set to `washvix@gmail.com`. EmailJS sends the notification after the booking is successfully saved, so the backend still keeps the booking visible in `admin.html`.
╔════════════════════════════════════════════════════════╗
║     WASHVIX Backend Server                            ║
║     Running on http://localhost:5000                  ║
╚════════════════════════════════════════════════════════╝
```

## 📡 API Endpoints

### 1. **Get All Bookings**
```
GET http://localhost:5000/api/bookings
```
Returns all customer bookings.

**Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 5
}
```

---

### 2. **Filter Bookings**
```
GET http://localhost:5000/api/bookings/filter?date=2026-08-20&phone=98765
```
Filter bookings by date and/or phone number.

**Query Parameters:**
- `date` - Booking date (YYYY-MM-DD)
- `phone` - Customer phone number

---

### 3. **Create Booking**
```
POST http://localhost:5000/api/bookings
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "+91 98765 43210",
  "email": "john@example.com",
  "services": "basic, premium",
  "vehicleSize": "hatchback",
  "vehicleMake": "Honda City",
  "vehicleYear": 2022,
  "vehicleColor": "Black",
  "bookingDate": "2026-08-20",
  "bookingTime": "10:00",
  "location": "123 Main Street",
  "requests": "None",
  "price": "₹698"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": 1692547200000,
    "status": "pending",
    "timestamp": "2026-08-15T10:30:00.000Z",
    ...
  }
}
```

---

### 4. **Get Booked Slots**
```
GET http://localhost:5000/api/booked-slots
```
Returns all booked time slots.

---

### 5. **Get Booked Slots for Specific Date**
```
GET http://localhost:5000/api/booked-slots/2026-08-20
```
Returns slots booked on a specific date.

---

### 6. **Delete Booking**
```
DELETE http://localhost:5000/api/bookings/1692547200000
```
Delete a booking by ID.

---

### 7. **Delete All Bookings** (Admin)
```
DELETE http://localhost:5000/api/bookings
```
Clear all bookings (use with caution!).

---

### 8. **Get Statistics**
```
GET http://localhost:5000/api/statistics
```
Get booking statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBookings": 10,
    "upcomingBookings": 5,
    "totalRevenue": 7980,
    "averageRevenue": 798
  }
}
```

---

### 9. **Update Booking Status** (Admin)
```
PUT http://localhost:5000/api/bookings/1692547200000/status
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Valid Status Values:**
- `pending` - Newly created booking
- `confirmed` - Admin confirmed
- `completed` - Service completed
- `cancelled` - Booking cancelled

---

### 10. **Health Check**
```
GET http://localhost:5000/api/health
```
Check if the server is running.

---

## 📁 Database Files

The backend creates two JSON files to store data:

### `bookings.json`
Stores all booking information including:
- Customer details
- Service selections
- Vehicle information
- Date & time
- Cost
- Booking status
- Timestamp

### `booked-slots.json`
Stores booked time slots to prevent double bookings:
```json
[
  {
    "date": "2026-08-20",
    "time": "10:00",
    "bookingId": 1692547200000
  }
]
```

---

## 🔌 Integration with Frontend

### Update `book.html` to use Backend API

Replace the localStorage save with API call:

```javascript
// In book.html, in the form submission handler
const formData = {
  // ... form data ...
};

// Instead of: saveBooking(formData);
// Use API call:
fetch('http://localhost:5000/api/bookings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(formData)
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    alert('Booking confirmed! Booking ID: ' + data.data.id);
    // Reset form, etc.
  } else {
    alert('Error: ' + data.error);
  }
})
.catch(error => console.error('Error:', error));
```

### Update `admin.html` to use Backend API

Replace localStorage reads with API calls:

```javascript
// Fetch bookings from backend
async function displayBookings() {
  const response = await fetch('http://localhost:5000/api/bookings');
  const result = await response.json();
  
  if (result.success) {
    const bookings = result.data;
    // Render bookings...
  }
}

// Get booked slots
async function getBookedSlots(date) {
  const response = await fetch(`http://localhost:5000/api/booked-slots/${date}`);
  const result = await response.json();
  
  if (result.success) {
    // Use slots data...
  }
}

// Delete booking
async function deleteBooking(bookingId) {
  const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}`, {
    method: 'DELETE'
  });
  const result = await response.json();
  
  if (result.success) {
    alert('Booking deleted');
    displayBookings();
  }
}
```

---

## 🔒 Security Notes

For production, add:
- **Authentication** - Require API key or JWT token
- **Input Validation** - Sanitize all user inputs
- **Database** - Switch from JSON to MongoDB/PostgreSQL
- **HTTPS** - Use SSL/TLS encryption
- **Rate Limiting** - Prevent abuse
- **CORS** - Restrict to your domain only

---

## 🛠 Troubleshooting

### Port Already in Use
```bash
# Find and kill process using port 5000
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5000 | xargs kill -9
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### CORS Errors
Make sure the frontend is requesting from `http://localhost:5000`

---

## 📊 Example Usage

### Create a Booking (cURL)
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "+91 98765 43210",
    "email": "john@example.com",
    "services": "basic",
    "vehicleSize": "hatchback",
    "vehicleMake": "Honda City",
    "vehicleYear": 2022,
    "vehicleColor": "Black",
    "bookingDate": "2026-08-20",
    "bookingTime": "10:00",
    "location": "123 Main Street",
    "requests": "None",
    "price": "₹299"
  }'
```

### Get All Bookings (cURL)
```bash
curl http://localhost:5000/api/bookings
```

### Delete All Bookings (cURL)
```bash
curl -X DELETE http://localhost:5000/api/bookings
```

---

## 📝 License

MIT License - Free to use and modify

---

**Need help?** Check the error logs in the terminal for more details.
