/**
 * Date utilities
 * Helper functions for date operations
 */

/**
 * Format date to ISO string in local timezone
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
const formatDateLocal = (date) => {
  if (!date) return null;
  
  const d = new Date(date);
  return d.toISOString();
};

/**
 * Get current timestamp
 * @returns {Date} Current date
 */
const getCurrentTimestamp = () => {
  return new Date();
};

/**
 * Check if date is valid
 * @param {Date} date - Date to validate
 * @returns {boolean} True if valid
 */
const isValidDate = (date) => {
  return date instanceof Date && !isNaN(date);
};

/**
 * Calculate days between two dates
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} Number of days
 */
const daysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

module.exports = {
  formatDateLocal,
  getCurrentTimestamp,
  isValidDate,
  daysBetween
};
