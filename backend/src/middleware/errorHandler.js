// Async handler wrapper to catch promise rejections
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error("Async error caught:", error);
    res.status(500).json({ 
      message: error?.message || "Internal server error",
      ...(process.env.NODE_ENV === 'development' && { stack: error?.stack })
    });
  });
};

// Global error handler
export const errorHandler = (err, req, res, next) => {
  console.error("Global error handler:", err);
  
  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json({
    message: err?.message || "Internal Server Error",
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err?.stack,
      error: err
    })
  });
};
