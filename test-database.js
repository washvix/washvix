#!/usr/bin/env node
/**
 * Test Script: Database Connection Verification
 * Tests SQLite database functionality
 */

const db = require('./database.js');

async function testDatabase() {
  try {
    console.log('🔄 Initializing SQLite database...');
    await db.initializeSQLiteDatabase();
    console.log('✅ Database initialized successfully\n');

    console.log('📊 Fetching all bookings...');
    const bookings = await db.getBookings();
    console.log(`✅ Total bookings found: ${bookings.length}\n`);

    if (bookings.length > 0) {
      console.log('📝 Sample booking:');
      console.log(JSON.stringify(bookings[0], null, 2));
    } else {
      console.log('ℹ️  No bookings found (database is empty)');
    }

    console.log('\n✨ Database connection test PASSED!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
  }
}

testDatabase();
