// WASHVIX BACKEND SERVER
// Node.js + Express Backend for handling bookings and admin operations
// Database: SQLite with JSON fallback

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const crypto = require('crypto');
const path = require('path');
const db = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const AUTH_SECRET = process.env.AUTH_SECRET;
const AUTH_COOKIE = 'washvix_admin_session';

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.static(__dirname));

// Friendly routes for the main customer and admin pages.
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/book', (req, res) => res.sendFile(path.join(__dirname, 'book.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map(cookie => {
    const separator = cookie.indexOf('=');
    return [cookie.slice(0, separator).trim(), decodeURIComponent(cookie.slice(separator + 1))];
  }));
}

function createAdminSession() {
  const payload = Buffer.from(JSON.stringify({ username: ADMIN_USERNAME, expiresAt: Date.now() + 8 * 60 * 60 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left || '');
  const rightBuffer = Buffer.from(right || '');
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function isValidAdminSession(req) {
  if (!AUTH_SECRET) return false;
  const token = parseCookies(req)[AUTH_COOKIE];
  if (!token) return false;

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;

  const expectedSignature = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');
  if (signature.length !== expectedSignature.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return false;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return session.username === ADMIN_USERNAME && session.expiresAt > Date.now();
  } catch {
    return false;
  }
}

function requireAdmin(req, res, next) {
  if (!isValidAdminSession(req)) {
    return res.status(401).json({ success: false, error: 'Admin authentication required' });
  }
  next();
}

function formatPhoneForSms(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('+') ? digits : `+${digits}`;
}

async function sendBookingNotification(booking, action) {
  const statusLabels = {
    confirmed: 'confirmed',
    cancelled: 'cancelled',
    rescheduled: 'rescheduled',
    completed: 'completed',
    pending: 'pending'
  };

  const label = statusLabels[action] || 'updated';
  const emailBody = `Hello ${booking.name || 'Customer'},\n\nYour Washvix booking has been ${label}.\n\nBooking details:\nDate: ${booking.bookingDate}\nTime: ${booking.bookingTime}\nVehicle: ${booking.vehicleMake || 'N/A'}\nServices: ${booking.services || 'N/A'}\nCost: ${booking.price || 'N/A'}\n\nThank you for choosing Washvix.`;

  const smsBody = `Washvix booking ${label}. Date: ${booking.bookingDate} at ${booking.bookingTime}. ${booking.price ? 'Total: ' + booking.price : ''}`;

  const notificationResults = { email: null, sms: null, configured: false };

  if (booking.email && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: Number(process.env.EMAIL_PORT || 587),
        secure: Boolean(process.env.EMAIL_SECURE === 'true'),
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: booking.email,
        subject: `Washvix booking ${label}`,
        text: emailBody
      });

      notificationResults.email = info.messageId;
      notificationResults.configured = true;
    } catch (error) {
      console.error('Email notification failed:', error.message);
    }
  }

  if (booking.phone && process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM) {
    try {
      const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
      const message = await client.messages.create({
        body: smsBody,
        from: process.env.TWILIO_FROM,
        to: formatPhoneForSms(booking.phone)
      });

      notificationResults.sms = message.sid;
      notificationResults.configured = true;
    } catch (error) {
      console.error('SMS notification failed:', error.message);
    }
  }

  if (!notificationResults.configured) {
    console.log(`[Washvix Notification] ${label.toUpperCase()} message for ${booking.name || 'customer'}: ${booking.email || booking.phone || 'No contact details saved'}`);
    console.log(`[Washvix Notification] Email and SMS are not configured. Add EMAIL_USER/EMAIL_PASS or TWILIO_SID/TWILIO_AUTH_TOKEN/TWILIO_FROM to enable sending.`);
  }

  return notificationResults;
}

async function sendAdminBookingNotification(booking) {
  const adminEmail = process.env.ADMIN_EMAIL || 'washvix@gmail.com';
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[Washvix Notification] Admin booking email not sent. Configure EMAIL_USER and EMAIL_PASS to notify ${adminEmail}.`);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT || 587),
      secure: Boolean(process.env.EMAIL_SECURE === 'true'),
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: adminEmail,
      subject: `New Washvix booking from ${booking.name}`,
      text: `A new Washvix booking has been received.\n\nCustomer: ${booking.name}\nPhone: ${booking.phone}\nEmail: ${booking.email || 'Not provided'}\nDate: ${booking.bookingDate}\nTime: ${booking.bookingTime}\nVehicle: ${booking.vehicleMake || 'N/A'} (${booking.vehicleSize || 'N/A'})\nServices: ${booking.services || 'N/A'}\nLocation: ${booking.location || 'N/A'}\nPrice: ${booking.price || 'N/A'}\nSpecial requests: ${booking.requests || 'None'}`
    });
    console.log(`[Washvix Notification] New booking email sent to ${adminEmail}.`);
  } catch (error) {
    console.error('Admin booking email failed:', error.message);
  }
}

// ROUTES

// ADMIN AUTHENTICATION
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!ADMIN_PASSWORD || !AUTH_SECRET) {
    return res.status(503).json({ success: false, error: 'Admin authentication is not configured' });
  }

  const validUsername = typeof username === 'string' && safeEqual(username, ADMIN_USERNAME);
  const validPassword = typeof password === 'string' && safeEqual(password, ADMIN_PASSWORD);
  if (!validUsername || !validPassword) {
    return res.status(401).json({ success: false, error: 'Invalid admin credentials' });
  }

  res.setHeader('Set-Cookie', `${AUTH_COOKIE}=${encodeURIComponent(createAdminSession())}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
  res.json({ success: true, message: 'Admin login successful' });
});

app.post('/api/auth/logout', (req, res) => {
  res.setHeader('Set-Cookie', `${AUTH_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
  res.json({ success: true, message: 'Admin logged out' });
});

app.get('/api/auth/session', (req, res) => {
  res.json({ success: true, authenticated: isValidAdminSession(req) });
});

// GET all bookings
app.get('/api/bookings', requireAdmin, async (req, res) => {
  try {
    const bookings = await db.getBookings();
    res.json({
      success: true,
      data: bookings,
      count: bookings.length
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings'
    });
  }
});

// GET single booking by ID
app.get('/api/bookings/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await db.getBookingById(parseInt(id));

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking'
    });
  }
});

// GET bookings by filter (date, phone)
app.get('/api/bookings/filter', requireAdmin, async (req, res) => {
  try {
    const { date, phone } = req.query;
    let bookings = await db.getBookings();

    if (date) {
      bookings = bookings.filter(b => b.bookingDate === date);
    }

    if (phone) {
      bookings = bookings.filter(b => 
        b.phone.toLowerCase().includes(phone.toLowerCase())
      );
    }

    res.json({
      success: true,
      data: bookings,
      count: bookings.length
    });
  } catch (error) {
    console.error('Error filtering bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to filter bookings'
    });
  }
});

// POST new booking
app.post('/api/bookings', async (req, res) => {
  try {
    const booking = req.body;

    // Validation
    if (!booking.name || !booking.phone || !booking.bookingDate || !booking.bookingTime) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Check if slot is already booked
    const slots = await db.getBookedSlotsForDate(booking.bookingDate);
    const isBooked = slots.some(s => s.time === booking.bookingTime);

    if (isBooked) {
      return res.status(409).json({
        success: false,
        error: 'This time slot is already booked'
      });
    }

    // Create the booking and reserve its slot. The unique slot constraint
    // prevents two simultaneous requests from claiming the same time.
    const savedBooking = await db.createBooking(booking);
    try {
      await db.addBookedSlot(booking.bookingDate, booking.bookingTime, savedBooking.id);
    } catch (slotError) {
      await db.deleteBooking(savedBooking.id).catch(() => {});
      if (slotError.message && slotError.message.includes('UNIQUE')) {
        return res.status(409).json({
          success: false,
          error: 'This time slot is already booked'
        });
      }
      throw slotError;
    }

    await sendAdminBookingNotification(savedBooking);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: savedBooking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create booking'
    });
  }
});

// GET booked slots
app.get('/api/booked-slots', async (req, res) => {
  try {
    const slots = await db.getBookedSlots();
    res.json({
      success: true,
      data: slots,
      count: slots.length
    });
  } catch (error) {
    console.error('Error fetching booked slots:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booked slots'
    });
  }
});

// GET booked slots for a specific date
app.get('/api/booked-slots/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const slots = await db.getBookedSlotsForDate(date);
    
    res.json({
      success: true,
      date: date,
      data: slots,
      count: slots.length
    });
  } catch (error) {
    console.error('Error fetching booked slots:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booked slots'
    });
  }
});

// GET available time slots for a specific date
app.get('/api/available-slots/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const timeSlots = [
      '08:00', '09:00', '10:00', '11:00', '12:00',
      '14:00', '15:00', '16:00', '17:00', '18:00'
    ];
    
    const bookedSlots = await db.getBookedSlotsForDate(date);
    const bookedTimes = bookedSlots.map(s => s.time);
    
    const availableSlots = timeSlots.filter(time => !bookedTimes.includes(time));
    
    res.json({
      success: true,
      date: date,
      available: availableSlots,
      booked: bookedTimes,
      count: availableSlots.length
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available slots'
    });
  }
});

// DELETE booking by ID
app.delete('/api/bookings/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const bookingId = parseInt(id);

    // Get booking first to ensure it exists
    const booking = await db.getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Delete booking
    await db.deleteBooking(bookingId);

    // Remove booked slot
    await db.removeBookedSlot(bookingId);

    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete booking'
    });
  }
});

// DELETE all bookings (admin only)
app.delete('/api/bookings', requireAdmin, async (req, res) => {
  try {
    await db.deleteAllBookings();

    res.json({
      success: true,
      message: 'All bookings cleared'
    });
  } catch (error) {
    console.error('Error clearing bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear bookings'
    });
  }
});

// GET booking statistics
app.get('/api/statistics', requireAdmin, async (req, res) => {
  try {
    const bookings = await db.getBookings();
    const today = new Date().toISOString().split('T')[0];
    const upcomingBookings = bookings.filter(b => b.bookingDate >= today).length;
    
    const totalRevenue = bookings.reduce((sum, b) => {
      const price = parseInt(b.price?.replace('₹', '').replace(/,/g, '') || 0);
      return sum + price;
    }, 0);

    res.json({
      success: true,
      data: {
        totalBookings: bookings.length,
        upcomingBookings: upcomingBookings,
        totalRevenue: totalRevenue,
        averageRevenue: bookings.length > 0 ? Math.round(totalRevenue / bookings.length) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

// UPDATE booking status (admin)
app.put('/api/bookings/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const bookingId = parseInt(id);

    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const booking = await db.updateBookingStatus(bookingId, status);

    await sendBookingNotification(booking, status);

    res.json({
      success: true,
      message: 'Booking status updated',
      data: booking
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking status'
    });
  }
});

// RESCHEDULE booking
app.put('/api/bookings/:id/reschedule', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { bookingDate, bookingTime } = req.body;
    const bookingId = parseInt(id);

    if (!bookingDate || !bookingTime) {
      return res.status(400).json({
        success: false,
        error: 'bookingDate and bookingTime are required'
      });
    }

    // Check if new slot is available
    const slots = await db.getBookedSlotsForDate(bookingDate);
    const hasConflict = slots.some(slot =>
      slot.time === bookingTime &&
      slot.bookingId !== bookingId
    );

    if (hasConflict) {
      return res.status(409).json({
        success: false,
        error: 'This time slot is already booked by another customer'
      });
    }

    // Remove old slot
    await db.removeBookedSlot(bookingId);

    // Add new slot
    await db.addBookedSlot(bookingDate, bookingTime, bookingId);

    // Update booking
    const booking = await db.rescheduleBooking(bookingId, bookingDate, bookingTime);

    await sendBookingNotification(booking, 'rescheduled');

    res.json({
      success: true,
      message: 'Booking rescheduled successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error rescheduling booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reschedule booking'
    });
  }
});

// GET all reviews
app.get('/api/reviews', async (req, res) => {
  try {
    const reviews = await db.getReviews();
    res.json({
      success: true,
      data: reviews,
      count: reviews.length
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reviews'
    });
  }
});

// POST new review
app.post('/api/reviews', async (req, res) => {
  try {
    const { name, rating, comment, service, vehicle, location } = req.body;
    
    if (!name || !comment) {
      return res.status(400).json({
        success: false,
        error: 'Name and review text are required'
      });
    }

    const savedReview = await db.createReview({
      name,
      rating: Number(rating) || 5,
      comment,
      service: service || 'Car Wash',
      vehicle: vehicle || 'Car Owner',
      location: location || 'Rourkela'
    });

    res.status(201).json({
      success: true,
      message: 'Review posted successfully',
      data: savedReview
    });
  } catch (error) {
    console.error('Error saving review:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save review'
    });
  }
});

// DELETE review by ID
app.delete('/api/reviews/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteReview(parseInt(id));
    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete review'
    });
  }
});

// DELETE all reviews (admin)
app.delete('/api/reviews', requireAdmin, async (req, res) => {
  try {
    await db.deleteAllReviews();
    res.json({
      success: true,
      message: 'All reviews cleared'
    });
  } catch (error) {
    console.error('Error clearing reviews:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear reviews'
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Washvix backend server is running',
    timestamp: new Date().toISOString()
  });
});

// SEARCH bookings by customer name or vehicle details
app.get('/api/search', requireAdmin, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const query = q.toLowerCase();
    const bookings = await db.getBookings();
    
    const results = bookings.filter(b =>
      b.name.toLowerCase().includes(query) ||
      b.phone.toLowerCase().includes(query) ||
      (b.email && b.email.toLowerCase().includes(query)) ||
      (b.vehicleMake && b.vehicleMake.toLowerCase().includes(query)) ||
      (b.services && b.services.toLowerCase().includes(query))
    );

    res.json({
      success: true,
      query: q,
      data: results,
      count: results.length
    });
  } catch (error) {
    console.error('Error searching bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
});

// EXPORT bookings as JSON
app.get('/api/export/json', requireAdmin, async (req, res) => {
  try {
    const bookings = await db.getBookings();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="bookings.json"');
    res.send(JSON.stringify(bookings, null, 2));
  } catch (error) {
    console.error('Error exporting JSON:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export bookings'
    });
  }
});

// EXPORT bookings as CSV
app.get('/api/export/csv', requireAdmin, async (req, res) => {
  try {
    const bookings = await db.getBookings();
    
    if (bookings.length === 0) {
      return res.json({
        success: false,
        error: 'No bookings to export'
      });
    }

    const headers = [
      'ID', 'Name', 'Phone', 'Email', 'Date', 'Time', 
      'Vehicle Make', 'Vehicle Size', 'Services', 'Status', 'Price'
    ];

    const csvData = bookings.map(b => [
      b.id,
      `"${b.name}"`,
      `"${b.phone}"`,
      `"${b.email || ''}"`,
      b.bookingDate,
      b.bookingTime,
      `"${b.vehicleMake || ''}"`,
      `"${b.vehicleSize || ''}"`,
      `"${b.services || ''}"`,
      b.status,
      `"${b.price || ''}"`
    ].join(','));

    const csv = headers.join(',') + '\n' + csvData.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="bookings.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export bookings'
    });
  }
});

// GET daily revenue report
app.get('/api/reports/daily', requireAdmin, async (req, res) => {
  try {
    const { date } = req.query;
    const bookings = await db.getBookings();
    
    const filteredBookings = date 
      ? bookings.filter(b => b.bookingDate === date)
      : bookings;

    const dayRevenue = {};
    filteredBookings.forEach(b => {
      const day = b.bookingDate;
      const price = parseInt(b.price?.replace('₹', '').replace(/,/g, '') || 0);
      dayRevenue[day] = (dayRevenue[day] || 0) + price;
    });

    res.json({
      success: true,
      data: dayRevenue,
      totalRevenue: Object.values(dayRevenue).reduce((sum, v) => sum + v, 0)
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report'
    });
  }
});

// Initialize database and start server
db.initializeSQLiteDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════╗
║     WASHVIX Backend Server                            ║
║     Running on http://localhost:${PORT}                     ║
║                                                        ║
║     📋 BOOKING ENDPOINTS:                             ║
║     GET    /api/bookings                             ║
║     GET    /api/bookings/:id                         ║
║     POST   /api/bookings                             ║
║     PUT    /api/bookings/:id/status                  ║
║     PUT    /api/bookings/:id/reschedule              ║
║     DELETE /api/bookings/:id                         ║
║     DELETE /api/bookings (admin)                     ║
║                                                        ║
║     🕐 TIME SLOTS:                                    ║
║     GET    /api/booked-slots                         ║
║     GET    /api/booked-slots/:date                   ║
║     GET    /api/available-slots/:date                ║
║                                                        ║
║     📊 STATISTICS & REPORTS:                          ║
║     GET    /api/statistics                           ║
║     GET    /api/reports/daily                        ║
║     GET    /api/search?q=query                       ║
║                                                        ║
║     💾 DATA EXPORT:                                   ║
║     GET    /api/export/json                          ║
║     GET    /api/export/csv                           ║
║                                                        ║
║     💚 HEALTH:                                        ║
║     GET    /api/health                               ║
╚════════════════════════════════════════════════════════╝
    `);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

module.exports = app;
