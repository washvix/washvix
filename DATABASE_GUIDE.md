# Database Connection Guide for Washvix

## ✅ What's Been Set Up

Your backend is now configured with **SQLite database** integration:

### Features
- ✅ **SQLite3** - File-based SQL database (no server needed)
- ✅ **Automatic fallback** - Uses JSON if SQLite fails
- ✅ **Same API** - All endpoints work exactly the same
- ✅ **Better performance** - Real database queries
- ✅ **Data persistence** - Automatic table creation
- ✅ **Prepared statements** - SQL injection protection

---

## 🚀 Getting Started

### Step 1: Install Dependencies

```bash
cd c:\Users\SANTOSHINI SETHI\OneDrive\Documents\washvix
npm install
```

This will install:
- `sqlite3` - Database driver
- `dotenv` - Environment configuration

### Step 2: Start the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

### Step 3: Verify Database Connection

The server will show:
```
[Database] SQLite connected successfully
[Database] Bookings table initialized
[Database] Booked slots table initialized
[Database] ✅ SQLite database ready
```

---

## 📁 Database Files

The database is stored as a **single file**:

```
washvix/
├── washvix.db          ← SQLite database file (auto-created)
├── bookings.json       ← Legacy JSON (fallback)
├── booked-slots.json   ← Legacy JSON (fallback)
└── backend.js
```

**washvix.db** contains all your data in proper database tables.

---

## 🔄 Database Schema

### Bookings Table
```sql
CREATE TABLE bookings (
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
  timestamp DATETIME,
  created_at DATETIME,
  updated_at DATETIME
);
```

### Booked Slots Table
```sql
CREATE TABLE booked_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  bookingId INTEGER NOT NULL,
  created_at DATETIME,
  UNIQUE(date, time),
  FOREIGN KEY(bookingId) REFERENCES bookings(id)
);
```

---

## 🔧 Configuration

### Use SQLite (Default)
Database is enabled by default. The server will automatically create `washvix.db` on first run.

### Disable SQLite (Fallback to JSON)
If you want to use JSON storage instead, set environment variable:

```bash
set USE_SQLITE=false
npm start
```

Or in `.env` file:
```
USE_SQLITE=false
```

---

## 📊 Database Operations

### All operations are the same:

```javascript
// Create booking
POST /api/bookings
Body: { name, phone, email, ... }

// Get bookings
GET /api/bookings

// Update status
PUT /api/bookings/:id/status
Body: { status: "confirmed" }

// Delete booking
DELETE /api/bookings/:id
```

---

## 🚀 Future Database Upgrades

When you're ready to upgrade, you can connect to:

### Option 1: MongoDB Atlas (Cloud)
```bash
npm install mongoose
```

Connection string:
```
mongodb+srv://username:password@cluster.mongodb.net/washvix
```

### Option 2: PostgreSQL
```bash
npm install pg
```

Connection string:
```
postgresql://user:password@localhost:5432/washvix
```

### Option 3: MySQL
```bash
npm install mysql2
```

Connection string:
```
mysql://user:password@localhost:3306/washvix
```

---

## 📈 Performance Comparison

| Aspect | JSON | SQLite | MongoDB | PostgreSQL |
|--------|------|--------|---------|------------|
| **Setup** | ✅ None | ✅ Auto | ⚠️ Complex | ⚠️ Complex |
| **Performance** | Slow | Fast | Very Fast | Very Fast |
| **Scalability** | Limited | Good | Excellent | Excellent |
| **Complex Queries** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| **Backup** | Manual | Auto | Auto | Auto |
| **Production Ready** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |

**Current: SQLite** ← Best balance for your needs!

---

## 🐛 Troubleshooting

### Issue: "sqlite3 is not installed"
```bash
npm install sqlite3
```

### Issue: "Cannot create database file"
- Check folder permissions
- Ensure `c:\Users\SANTOSHINI SETHI\OneDrive\Documents\washvix` is writable

### Issue: "Database is locked"
- Close other instances of the app
- Delete `washvix.db` and restart

### Issue: "Falling back to JSON storage"
- SQLite failed to connect
- Check npm installation: `npm list sqlite3`
- Reinstall: `npm install --save sqlite3`

---

## ✨ Benefits of SQLite

1. **No Setup Required** - Just works!
2. **Single File** - Easy to backup and transfer
3. **ACID Compliant** - Data consistency guaranteed
4. **Concurrent Reads** - Multiple users can read
5. **UNIQUE Constraints** - Prevents duplicate slots
6. **Foreign Keys** - Data integrity
7. **Fast Queries** - Indexed searches
8. **Portable** - Works on Windows, Mac, Linux

---

## 📊 Data Import/Export

### Export from SQLite to JSON
```bash
# Already available via API
curl http://localhost:5000/api/export/json > backup.json
```

### Export from SQLite to CSV
```bash
# Already available via API
curl http://localhost:5000/api/export/csv > bookings.csv
```

### Backup Database
```bash
# Copy the database file
cp washvix.db washvix.db.backup
```

---

## 🔐 Security Features

- ✅ **Prepared Statements** - No SQL injection
- ✅ **UNIQUE Constraints** - Prevents duplicate bookings
- ✅ **Foreign Keys** - Data consistency
- ✅ **Default Values** - Auto-timestamps
- ✅ **Validation** - Server-side input check

---

## 📞 Support

For issues or questions:

1. Check database file exists: `washvix.db`
2. Check console for error messages
3. Try clearing data: `DELETE FROM bookings;`
4. Restart server: `npm start`

---

## 🎉 You're Ready!

Your Washvix application now has:
- ✅ SQLite database
- ✅ Automatic schema creation
- ✅ All API endpoints working
- ✅ Data persistence
- ✅ JSON fallback

**Start the server:**
```bash
npm start
```

**Your database is ready to use!** 🚀
