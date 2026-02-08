// Middleware to parse multipart/form-data on Vercel (where multer is bypassed)
// Extracts text fields AND converts image files to base64

export const parseFormData = (req, res, next) => {
  // Only parse if it's multipart/form-data and on Vercel
  if (!process.env.VERCEL || !req.headers['content-type']?.includes('multipart/form-data')) {
    return next();
  }

  const chunks = [];
  
  req.on('data', chunk => {
    chunks.push(chunk);
  });

  req.on('end', () => {
    try {
      const body = Buffer.concat(chunks).toString('latin1');

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
        
        // Check if this is a file field
        const filenameMatch = part.match(/filename="([^"]+)"/);
        if (filenameMatch) {
          // Handle file upload - convert to base64
          const mimeTypeMatch = part.match(/Content-Type: (.+?)\r?\n/);
          const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'application/octet-stream';
          
          // Extract file content (after headers, before next boundary)
          const headerEndIndex = part.indexOf('\r\n\r\n');
          if (headerEndIndex !== -1) {
            const contentStart = headerEndIndex + 4; // Skip \r\n\r\n
            const contentEnd = part.lastIndexOf('\r\n');
            const fileContent = part.substring(contentStart, contentEnd);
            
            if (fileContent && mimeType.startsWith('image/')) {
              const base64 = Buffer.from(fileContent, 'latin1').toString('base64');
              formData[fieldName] = `data:${mimeType};base64,${base64}`;
            }
          }
        } else {
          // Handle text field (preserve multi-line values)
          const headerEndIndex = part.indexOf('\r\n\r\n');
          if (headerEndIndex !== -1) {
            const contentStart = headerEndIndex + 4;
            const contentEnd = part.lastIndexOf('\r\n');
            const value = part.substring(contentStart, contentEnd !== -1 ? contentEnd : part.length);
            if (value && !value.includes('Content-Type:')) {
              formData[fieldName] = value;
            }
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
