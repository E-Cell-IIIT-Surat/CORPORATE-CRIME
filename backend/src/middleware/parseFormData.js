// Middleware to parse multipart/form-data on Vercel (where multer is bypassed)
// This extracts only the text fields from multipart forms

export const parseFormData = (req, res, next) => {
  // Only parse if it's multipart/form-data and on Vercel
  if (!process.env.VERCEL || !req.headers['content-type']?.includes('multipart/form-data')) {
    return next();
  }

  let body = '';
  
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      // Extract boundary from content-type header
      const boundary = req.headers['content-type'].split('boundary=')[1];
      if (!boundary) {
        return next();
      }

      // Parse multipart form data
      const parts = body.split(`--${boundary}`);
      const formData = {};

      for (const part of parts) {
        // Match field name and value
        const nameMatch = part.match(/name="([^"]+)"/);
        if (!nameMatch) continue;

        const fieldName = nameMatch[1];
        
        // Extract value (after headers, before next boundary)
        const valueMatch = part.split('\r\n\r\n')[1];
        if (valueMatch) {
          const value = valueMatch.split('\r\n')[0];
          if (value && !value.includes('Content-Type:')) {
            formData[fieldName] = value;
          }
        }
      }

      req.body = formData;
      next();
    } catch (error) {
      console.error('Form parsing error:', error);
      next();
    }
  });

  req.on('error', (error) => {
    console.error('Request error:', error);
    next(error);
  });
};
