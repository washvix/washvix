// WASHVIX API Integration Guide
// Use these functions to integrate the backend API with frontend files

// ============================================
// API Configuration
// ============================================
const API_BASE_URL = window.location.protocol === 'file:'
  ? 'http://localhost:5000/api'
  : `${window.location.origin}/api`;

function apiFetch(url, options = {}) {
  return fetch(url, { ...options, credentials: 'include' });
}

// ============================================
// BOOKING FUNCTIONS (for book.html)
// ============================================

// Get booked slots for a specific date
async function getBookedSlotsFromAPI(date) {
  try {
    const response = await apiFetch(`${API_BASE_URL}/booked-slots/${date}`);
    const result = await response.json();
    
    if (result.success) {
      return result.data; // Array of booked slots
    } else {
      console.error('Error fetching booked slots:', result.error);
      return [];
    }
  } catch (error) {
    console.error('API Error:', error);
    return [];
  }
}

// Check if a slot is booked
async function isSlotBookedAPI(date, time) {
  try {
    const slots = await getBookedSlotsFromAPI(date);
    return slots.some(slot => slot.time === time);
  } catch (error) {
    console.error('Error checking slot:', error);
    return false;
  }
}

// Update available time slots based on API data
async function updateTimeSlotsFromAPI() {
  const dateInput = document.getElementById('bookingDate').value;
  const timeSelect = document.getElementById('bookingTime');
  
  if (!dateInput) return;
  
  // Get booked slots from API
  const bookedSlots = await getBookedSlotsFromAPI(dateInput);
  const bookedTimes = bookedSlots.map(slot => slot.time);
  
  // Update dropdown options
  const options = timeSelect.querySelectorAll('option');
  options.forEach((option, index) => {
    if (index === 0) return; // Keep placeholder
    
    const time = option.value;
    if (bookedTimes.includes(time)) {
      option.disabled = true;
      if (!option.textContent.includes('(Booked)')) {
        option.textContent = option.textContent + ' (Booked)';
      }
    } else {
      option.disabled = false;
      option.textContent = option.textContent.replace(' (Booked)', '');
    }
  });
  
  timeSelect.value = '';
}

// Submit booking to API
async function submitBookingToAPI(formData) {
  try {
    const response = await apiFetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      return {
        success: true,
        bookingId: result.data.id,
        message: 'Booking created successfully'
      };
    } else {
      return {
        success: false,
        error: result.error
      };
    }
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: 'Network error. Please check if backend is running.'
    };
  }
}

// ============================================
// ADMIN FUNCTIONS (for admin.html)
// ============================================

// Fetch all bookings from API
async function fetchAllBookingsFromAPI() {
  try {
    const response = await apiFetch(`${API_BASE_URL}/bookings`);
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      console.error('Error fetching bookings:', result.error);
      return [];
    }
  } catch (error) {
    console.error('API Error:', error);
    return [];
  }
}

// Filter bookings by date and/or phone
async function filterBookingsFromAPI(date = '', phone = '') {
  try {
    let url = `${API_BASE_URL}/bookings/filter`;
    const params = new URLSearchParams();
    
    if (date) params.append('date', date);
    if (phone) params.append('phone', phone);
    
    if (params.toString()) {
      url += '?' + params.toString();
    }
    
    const response = await apiFetch(url);
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      console.error('Error filtering bookings:', result.error);
      return [];
    }
  } catch (error) {
    console.error('API Error:', error);
    return [];
  }
}

// Get statistics
async function getStatisticsFromAPI() {
  try {
    const response = await apiFetch(`${API_BASE_URL}/statistics`);
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      console.error('Error fetching statistics:', result.error);
      return {};
    }
  } catch (error) {
    console.error('API Error:', error);
    return {};
  }
}

// Delete a booking by ID
async function deleteBookingFromAPI(bookingId) {
  try {
    const response = await apiFetch(`${API_BASE_URL}/bookings/${bookingId}`, {
      method: 'DELETE'
    });
    
    const result = await response.json();
    
    if (result.success) {
      return {
        success: true,
        message: 'Booking deleted successfully'
      };
    } else {
      return {
        success: false,
        error: result.error
      };
    }
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: 'Failed to delete booking'
    };
  }
}

// Delete all bookings (admin only)
async function deleteAllBookingsFromAPI() {
  try {
    const response = await apiFetch(`${API_BASE_URL}/bookings`, {
      method: 'DELETE'
    });
    
    const result = await response.json();
    
    if (result.success) {
      return {
        success: true,
        message: 'All bookings cleared'
      };
    } else {
      return {
        success: false,
        error: result.error
      };
    }
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: 'Failed to clear bookings'
    };
  }
}

// Update booking status
async function updateBookingStatusFromAPI(bookingId, status) {
  try {
    const response = await apiFetch(`${API_BASE_URL}/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    
    const result = await response.json();
    
    if (result.success) {
      return {
        success: true,
        message: 'Status updated successfully',
        booking: result.data
      };
    } else {
      return {
        success: false,
        error: result.error
      };
    }
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: 'Failed to update status'
    };
  }
}

// Check backend health
async function checkBackendHealth() {
  try {
    const response = await apiFetch(`${API_BASE_URL}/health`);
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Backend is not running:', error);
    return false;
  }
}

// ============================================
// EXAMPLE USAGE IN book.html
// ============================================

/*
// Replace the existing form submission handler with:

document.getElementById('bookingForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const bookingDate = document.getElementById('bookingDate').value;
  const bookingTime = document.getElementById('bookingTime').value;

  // Check if slot is already booked
  if (await isSlotBookedAPI(bookingDate, bookingTime)) {
    alert('Sorry! This time slot has just been booked. Please select another time.');
    await updateTimeSlotsFromAPI();
    return;
  }
  
  // Collect form data
  const formData = {
    services: Array.from(document.querySelectorAll('input[name="service"]:checked')).map(cb => cb.value).join(', '),
    vehicleSize: document.getElementById('vehicleSize').value,
    name: document.getElementById('name').value,
    phone: document.getElementById('phone').value,
    email: document.getElementById('email').value,
    vehicleMake: document.getElementById('vehicleMake').value,
    vehicleYear: document.getElementById('vehicleYear').value,
    vehicleColor: document.getElementById('vehicleColor').value,
    bookingDate: bookingDate,
    bookingTime: bookingTime,
    location: document.getElementById('location').value,
    requests: document.getElementById('requests').value,
    price: document.getElementById('summaryPrice').textContent
  };

  // Submit to API
  const result = await submitBookingToAPI(formData);
  
  if (result.success) {
    alert('Booking confirmed! Booking ID: ' + result.bookingId);
    this.reset();
    // ... reset UI elements
  } else {
    alert('Error: ' + result.error);
  }
});

// Update time slots on date change
document.getElementById('bookingDate').addEventListener('change', updateTimeSlotsFromAPI);
*/

// ============================================
// EXAMPLE USAGE IN admin.html
// ============================================

/*
// Replace displayBookings function with:

async function displayBookingsFromAPI(bookingsToDisplay = null) {
  let bookings = bookingsToDisplay;
  
  if (!bookings) {
    bookings = await fetchAllBookingsFromAPI();
  }
  
  const bookingsList = document.getElementById('bookingsList');

  if (bookings.length === 0) {
    bookingsList.innerHTML = `<div class="empty-state">No bookings found</div>`;
    return;
  }

  // Render bookings
  bookingsList.innerHTML = bookings.map((booking) => `
    <div class="booking-card">
      <div class="booking-header">
        <div class="booking-info">
          <h3>${booking.name}</h3>
          <p>${booking.phone}</p>
        </div>
        <div class="booking-date">
          <span class="date">${booking.bookingDate}</span>
          <span class="time">${booking.bookingTime}</span>
        </div>
        <div class="booking-status">
          <span class="status-badge">${booking.status}</span>
        </div>
        <button onclick="deleteBookingAPI(${booking.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

// Delete booking from admin
async function deleteBookingAPI(bookingId) {
  if (confirm('Delete this booking?')) {
    const result = await deleteBookingFromAPI(bookingId);
    if (result.success) {
      displayBookingsFromAPI();
    } else {
      alert('Error: ' + result.error);
    }
  }
}

// Filter bookings
async function applyFiltersFromAPI() {
  const filterDate = document.getElementById('filterDate').value;
  const filterPhone = document.getElementById('filterPhone').value;
  const bookings = await filterBookingsFromAPI(filterDate, filterPhone);
  displayBookingsFromAPI(bookings);
}
*/

// Fetch all reviews from API
async function getReviewsFromAPI() {
  try {
    const response = await apiFetch(`${API_BASE_URL}/reviews`);
    const result = await response.json();
    if (result.success) {
      return result.data;
    }
    return [];
  } catch (error) {
    console.error('API Error fetching reviews:', error);
    return [];
  }
}

// Submit a new review to API
async function submitReviewToAPI(reviewData) {
  try {
    const response = await apiFetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData)
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('API Error submitting review:', error);
    return { success: false, error: 'Network error submitting review' };
  }
}

// Delete a review by ID
async function deleteReviewFromAPI(reviewId) {
  try {
    const response = await apiFetch(`${API_BASE_URL}/reviews/${reviewId}`, {
      method: 'DELETE'
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('API Error deleting review:', error);
    return { success: false, error: 'Failed to delete review' };
  }
}

// Delete all reviews (admin)
async function deleteAllReviewsFromAPI() {
  try {
    const response = await apiFetch(`${API_BASE_URL}/reviews`, {
      method: 'DELETE'
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('API Error clearing reviews:', error);
    return { success: false, error: 'Failed to clear reviews' };
  }
}

// ============================================
// Export functions for use in HTML files
// ============================================

// For browser console access
window.API = {
  // Booking functions
  getBookedSlots: getBookedSlotsFromAPI,
  isSlotBooked: isSlotBookedAPI,
  updateTimeSlots: updateTimeSlotsFromAPI,
  submitBooking: submitBookingToAPI,
  
  // Review functions
  getReviews: getReviewsFromAPI,
  submitReview: submitReviewToAPI,
  deleteReview: deleteReviewFromAPI,
  deleteAllReviews: deleteAllReviewsFromAPI,

  // Admin functions
  fetchBookings: fetchAllBookingsFromAPI,
  filterBookings: filterBookingsFromAPI,
  getStats: getStatisticsFromAPI,
  deleteBooking: deleteBookingFromAPI,
  deleteAllBookings: deleteAllBookingsFromAPI,
  updateStatus: updateBookingStatusFromAPI,
  checkHealth: checkBackendHealth
};
