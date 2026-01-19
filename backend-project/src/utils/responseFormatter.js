/**
 * Response formatter utilities
 * Standardizes API responses
 */

/**
 * Success response
 * @param {object} res - Express response object
 * @param {object} data - Data to send
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 */
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Error response
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {object} error - Error details
 */
const errorResponse = (res, message = 'Error', statusCode = 500, error = null) => {
  const response = {
    success: false,
    message
  };
  
  if (error && process.env.NODE_ENV !== 'production') {
    response.error = error;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Pagination helper
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 */
const paginationInfo = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};

module.exports = {
  successResponse,
  errorResponse,
  paginationInfo
};
