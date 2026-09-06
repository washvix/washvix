// Database Module for Washvix
// Supports SQLite with JSON fallback

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'washvix.db');
const USE_SQLITE = process.env.USE_SQLITE !== 'false';

let db = null;
let useJsonFallback = false;

// JSON file paths (fallback)
const BOOKINGS_JSON = path.join(__dirname, 'bookings.json');
const SLOTS_JSON = path.join(__dirname, 'booked-slots.json');
const REVIEWS_JSON = path.join(__dirname, 'reviews.json');

// Initialize SQLite Database
function initializeSQLiteDatabase() {
  return new Promise((resolve, reject) => {
    if (!USE_SQLITE) {
      console.log('[Database] Using JSON file storage (SQLite disabled)');
      initializeJsonDatabase();
      resolve();
      return;
    }

    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('[Database] SQLite connection error:', err.message);
        console.log('[Database] Falling back to JSON storage...');
        useJsonFallback = true;
        initializeJsonDatabase();
        resolve();
        return;
      }

      console.log('[Database] SQLite connected successfully');
      
      // Create tables
      db.serialize(() => {
        // Bookings table
        db.run(`
          CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT,
            services TEXT,
            vehicleSize TEXT,
            vehicleMake TEXT,
            vehicleYear INTEGER,
            vehicleColor TEXT,
            bookingDate TEXT NOT NULL,
            bookingTime TEXT NOT NULL,
            location TEXT,
            requests TEXT,
            price TEXT,
            status TEXT DEFAULT 'pending',
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) {
            console.error('[Database] Error creating bookings table:', err.message);
          } else {
            console.log('[Database] Bookings table initialized');
          }
        });

        // Booked slots table
        db.run(`
          CREATE TABLE IF NOT EXISTS booked_slots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            bookingId INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(date, time),
            FOREIGN KEY(bookingId) REFERENCES bookings(id)
          )
        `, (err) => {
          if (err) {
            console.error('[Database] Error creating booked_slots table:', err.message);
          } else {
            console.log('[Database] Booked slots table initialized');
          }
        });

        // Reviews table
        db.run(`
          CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            rating INTEGER NOT NULL,
            service TEXT,
            vehicle TEXT,
            location TEXT,
            comment TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) {
            console.error('[Database] Error creating reviews table:', err.message);
          } else {
            console.log('[Database] Reviews table initialized');
          }
        });

        console.log('[Database] ✅ SQLite database ready');
        resolve();
      });
    });
  });
}

// Initialize JSON Database (fallback)
function initializeJsonDatabase() {
  if (!fs.existsSync(BOOKINGS_JSON)) {
    fs.writeFileSync(BOOKINGS_JSON, JSON.stringify([]));
  }
  if (!fs.existsSync(SLOTS_JSON)) {
    fs.writeFileSync(SLOTS_JSON, JSON.stringify([]));
  }
  if (!fs.existsSync(REVIEWS_JSON)) {
    fs.writeFileSync(REVIEWS_JSON, JSON.stringify([]));
  }
  console.log('[Database] ✅ JSON fallback database ready');
}

// ============ BOOKINGS OPERATIONS ============

function getBookings() {
  return new Promise((resolve, reject) => {
    if (useJsonFallback) {
      try {
        const data = fs.readFileSync(BOOKINGS_JSON, 'utf8');
        resolve(JSON.parse(data));
      } catch (error) {
        reject(error);
      }
      return;
    }

    db.all('SELECT * FROM bookings ORDER BY timestamp DESC', (err, rows) => {
      if (err) {
        console.error('[Database] Error fetching bookings:', err.message);
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
}

function getBookingById(id) {
  return new Promise((resolve, reject) => {
    if (useJsonFallback) {
      try {
        const data = JSON.parse(fs.readFileSync(BOOKINGS_JSON, 'utf8'));
        const booking = data.find(b => b.id === parseInt(id));
        resolve(booking || null);
      } catch (error) {
        reject(error);
      }
      return;
    }

    db.get('SELECT * FROM bookings WHERE id = ?', [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row || null);
      }
    });
  });
}

function createBooking(bookingData) {
  return new Promise((resolve, reject) => {
    if (useJsonFallback) {
      try {
        const data = JSON.parse(fs.readFileSync(BOOKINGS_JSON, 'utf8'));
        const booking = {
          id: Date.now(),
          ...bookingData,
          timestamp: new Date().toISOString(),
          status: 'pending'
        };
        data.push(booking);
        fs.writeFileSync(BOOKINGS_JSON, JSON.stringify(data, null, 2));
        resolve(booking);
      } catch (error) {
        reject(error);
      }
      return;
    }

    const { name, phone, email, services, vehicleSize, vehicleMake, vehicleYear, vehicleColor, bookingDate, bookingTime, location, requests, price } = bookingData;
    
    db.run(
      `INSERT INTO bookings (name, phone, email, services, vehicleSize, vehicleMake, vehicleYear, vehicleColor, bookingDate, bookingTime, location, requests, price)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, phone, email, services, vehicleSize, vehicleMake, vehicleYear, vehicleColor, bookingDate, bookingTime, location, requests, price],
      function(err) {
        if (err) {
          reject(err);
        } else {
          const booking = {
            id: this.lastID,
            ...bookingData,
            timestamp: new Date().toISOString(),
            status: 'pending'
          };
          resolve(booking);
        }
      }
    );
  });
}

function updateBookingStatus(id, status) {
  return new Promise((resolve, reject) => {
    if (useJsonFallback) {
      try {
        const data = JSON.parse(fs.readFileSync(BOOKINGS_JSON, 'utf8'));
        const booking = data.find(b => b.id === parseInt(id));
        if (!booking) {
          reject(new Error('Booking not found'));
          return;
        }
        booking.status = status;
        fs.writeFileSync(BOOKINGS_JSON, JSON.stringify(data, null, 2));
        resolve(booking);
      } catch (error) {
        reject(error);
      }
      return;
    }

    db.run(
      'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id],
      function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Booking not found'));
        } else {
          getBookingById(id).then(resolve).catch(reject);
        }
      }
    );
  });
}

function rescheduleBooking(id, bookingDate, bookingTime) {
  return new Promise((resolve, reject) => {
    if (useJsonFallback) {
      try {
        const data = JSON.parse(fs.readFileSync(BOOKINGS_JSON, 'utf8'));
        const booking = data.find(b => b.id === parseInt(id));
        if (!booking) {
          reject(new Error('Booking not found'));
          return;
        }
        booking.bookingDate = bookingDate;
        booking.bookingTime = bookingTime;
        fs.writeFileSync(BOOKINGS_JSON, JSON.stringify(data, null, 2));
        resolve(booking);
      } catch (error) {
        reject(error);
      }
      return;
    }

    db.run(
      'UPDATE bookings SET bookingDate = ?, bookingTime = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [bookingDate, bookingTime, id],
      function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Booking not found'));
        } else {
          getBookingById(id).then(resolve).catch(reject);
        }
      }
    );
  });
}

function deleteBooking(id) {
  return new Promise((resolve, reject) => {
    if (useJsonFallback) {
      try {
        const data = JSON.parse(fs.readFileSync(BOOKINGS_JSON, 'utf8'));
        const index = data.findIndex(b => b.id === parseInt(id));
        if (index === -1) {
          reject(new Error('Booking not found'));
          return;
        }
        data.splice(index, 1);
        fs.writeFileSync(BOOKINGS_JSON, JSON.stringify(data, null, 2));
        resolve({ id });
      } catch (error) {
        reject(error);
      }
      return;
    }

    db.run('DELETE FROM bookings WHERE id = ?', [id], function(err) {
      if (err) {
        reject(err);
      } else if (this.changes === 0) {
        reject(new Error('Booking not found'));
      } else {
        resolve({ id });
      }
    });
  });
}

function deleteAllBookings() {
  return new Promise((resolve, reject) => {
    if (useJsonFallback) {
      try {
        fs.writeFileSync(BOOKINGS_JSON, JSON.stringify([]));
        fs.writeFileSync(SLOTS_JSON, JSON.stringify([]));
        resolve({ deleted: true });
      } catch (error) {
        reject(error);
      }
      return;
    }

    db.serialize(() => {
      db.run('DELETE FROM booked_slots', (err) => {
        if (err) reject(err);
      });
      db.run('DELETE FROM bookings', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve({ deleted: true });
        }
      });
    });
  });
}

// ============ BOOKED SLOTS OPERATIONS ============

function getBookedSlots() {
  return new Promise((resolve, reject) => {
    if (useJsonFallback) {
      try {
        const data = fs.readFileSync(SLOTS_JSON, 'utf8');
        resolve(JSON.parse(data));
      } catch (error) {
        reject(error);
      }
      return;
    }

    db.all('SELECT * FROM booked_slots', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
}

function getBookedSlotsForDate(date) {
  return new Promise((resolve, reject) => {
    if (useJsonFallback) {
      try {
        const data = JSON.parse(fs.readFileSync(SLOTS_JSON, 'utf8'));
        const slots = data.filter(s => s.date === date);
        resolve(slots);
      } catch (error) {
        reject(error);
      }
      return;
    }

    db.all('SELECT * FROM booked_slots WHERE date = ?', [date], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
}

function addBookedSlot(date, time, bookingId) {
  return new Promise((resolve, reject) => {
    if (useJsonFallback) {
      try {
        const data = JSON.parse(fs.readFileSync(SLOTS_JSON, 'utf8'));
        const slot = { date, time, bookingId };
        data.push(slot);
        fs.writeFileSync(SLOTS_JSON, JSON.stringify(data, null, 2));
        resolve(slot);
      } catch (error) {
        reject(error);
      }
      return;
    }

    db.run(
      'INSERT INTO booked_slots (date, time, bookingId) VALUES (?, ?, ?)',
      [date, time, bookingId],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ date, time, bookingId });
        }
      }
    );
  });
}

function removeBookedSlot(bookingId) {
  return new Promise((resolve, reject) => {
    if (useJsonFallback) {
      try {
        const data = JSON.parse(fs.readFileSync(SLOTS_JSON, 'utf8'));
        const index = data.findIndex(s => s.bookingId === bookingId);
        if (index !== -1) {
          data.splice(index, 1);
          fs.writeFileSync(SLOTS_JSON, JSON.stringify(data, null, 2));
        }
        resolve({ bookingId });
      } catch (error) {
        reject(error);
      }
      return;
    }

    db.run('DELETE FROM booked_slots WHERE bookingId = ?', [bookingId], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve({ bookingId });
      }
    });
  });
}

// ============ REVIEWS OPERATIONS ============

function getReviews() {
  return new Promise((resolve, reject) => {
    if (useJsonFallback) {
      try {
        const data = fs.readFileSync(REVIEWS_JSON, 'utf8');
        resolve(JSON.parse(data));
      } catch (error) {
        reject(error);
      }
      return;
    }

    db.all('SELECT * FROM reviews ORDER BY timestamp DESC', (err, rows) => {
      if (err) {
        console.error('[Database] Error fetching reviews:', err.message);
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
}

function createReview(reviewData) {
  return new Promise((resolve, reject) => {
    if (useJsonFallback) {
      try {
        const data = JSON.parse(fs.readFileSync(REVIEWS_JSON, 'utf8'));
        const review = {
          id: Date.now(),
          ...reviewData,
          rating: Number(reviewData.rating) || 5,
          timestamp: new Date().toISOString()
        };
        data.unshift(review);
        fs.writeFileSync(REVIEWS_JSON, JSON.stringify(data, null, 2));
        resolve(review);
      } catch (error) {
        reject(error);
      }
      return;
    }

    const { name, rating, service, vehicle, location, comment } = reviewData;
    
    db.run(
      `INSERT INTO reviews (name, rating, service, vehicle, location, comment)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, Number(rating) || 5, service || '', vehicle || '', location || '', comment],
      function(err) {
        if (err) {
          reject(err);
        } else {
          const review = {
            id: this.lastID,
            ...reviewData,
            rating: Number(rating) || 5,
            timestamp: new Date().toISOString()
          };
          resolve(review);
        }
      }
    );
  });
}

function deleteReview(id) {
  return new Promise((resolve, reject) => {
    if (useJsonFallback) {
      try {
        const data = JSON.parse(fs.readFileSync(REVIEWS_JSON, 'utf8'));
        const index = data.findIndex(r => r.id === parseInt(id));
        if (index === -1) {
          reject(new Error('Review not found'));
          return;
        }
        data.splice(index, 1);
        fs.writeFileSync(REVIEWS_JSON, JSON.stringify(data, null, 2));
        resolve({ id });
      } catch (error) {
        reject(error);
      }
      return;
    }

    db.run('DELETE FROM reviews WHERE id = ?', [id], function(err) {
      if (err) {
        reject(err);
      } else if (this.changes === 0) {
        reject(new Error('Review not found'));
      } else {
        resolve({ id });
      }
    });
  });
}

function deleteAllReviews() {
  return new Promise((resolve, reject) => {
    if (useJsonFallback) {
      try {
        fs.writeFileSync(REVIEWS_JSON, JSON.stringify([]));
        resolve({ deleted: true });
      } catch (error) {
        reject(error);
      }
      return;
    }

    db.run('DELETE FROM reviews', (err) => {
      if (err) {
        reject(err);
      } else {
        resolve({ deleted: true });
      }
    });
  });
}

// Close database connection
function closeDatabase() {
  if (db && !useJsonFallback) {
    db.close((err) => {
      if (err) {
        console.error('[Database] Error closing database:', err.message);
      } else {
        console.log('[Database] Connection closed');
      }
    });
  }
}

module.exports = {
  initializeSQLiteDatabase,
  getBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  rescheduleBooking,
  deleteBooking,
  deleteAllBookings,
  getBookedSlots,
  getBookedSlotsForDate,
  addBookedSlot,
  removeBookedSlot,
  getReviews,
  createReview,
  deleteReview,
  deleteAllReviews,
  closeDatabase
};
