const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { uploadToCloudinary } = require('../../../utils/imageUpload');

// Ensure uploads directory exists - FIX: Use correct path that matches server static serving
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware to handle payload too large errors
router.use((error, req, res, next) => {
  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Image is too large. Please choose a smaller image (max 10MB).',
      error: 'PAYLOAD_TOO_LARGE'
    });
  }
  next(error);
});

router.post('/image', async (req, res) => {
  try {
    console.log('Upload request received');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Content-Length:', req.headers['content-length']);

    const { image, folder } = req.body;

    if (!image) {
      console.log('No image data provided');
      return res.status(400).json({
        success: false,
        message: 'No image data provided',
      });
    }

    console.log('Image data type:', typeof image);
    console.log('Image data length:', image.length);
    console.log('Folder:', folder);

    // Validate image size (base64 encoded)
    const estimatedSize = (image.length * 3) / 4; // Convert base64 length to bytes
    console.log('Estimated image size:', estimatedSize, 'bytes');
    
    if (estimatedSize > 15 * 1024 * 1024) { // 15MB limit
      return res.status(413).json({
        success: false,
        message: 'Image is too large. Please choose a smaller image (max 10MB).',
        error: 'IMAGE_TOO_LARGE'
      });
    }

    // Check if Cloudinary is properly configured
    const hasCloudinaryConfig = process.env.CLOUDINARY_CLOUD_NAME && 
                               process.env.CLOUDINARY_API_KEY && 
                               process.env.CLOUDINARY_API_SECRET &&
                               process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name_here' &&
                               process.env.CLOUDINARY_API_KEY !== 'your_api_key_here' &&
                               process.env.CLOUDINARY_API_SECRET !== 'your_api_secret_here';

    console.log('Cloudinary config check:', {
      hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
      hasApiKey: !!process.env.CLOUDINARY_API_KEY,
      hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
      isConfigured: hasCloudinaryConfig,
      environment: process.env.NODE_ENV
    });

    // In production, REQUIRE Cloudinary (no local storage fallback)
    if (process.env.NODE_ENV === 'production' && !hasCloudinaryConfig) {
      return res.status(500).json({
        success: false,
        message: 'Cloudinary configuration required in production environment',
        error: 'CLOUDINARY_NOT_CONFIGURED'
      });
    }

    if (hasCloudinaryConfig) {
      // Use Cloudinary if properly configured
      try {
        console.log('Attempting Cloudinary upload...');
        const imageUrl = await uploadToCloudinary(image, folder || 'inventiease');
        console.log('Cloudinary upload successful:', imageUrl);

        return res.status(200).json({
          success: true,
          message: 'Image uploaded successfully to Cloudinary',
          imageUrl,
          storage: 'cloudinary'
        });
      } catch (cloudinaryError) {
        console.error('Cloudinary upload failed:', cloudinaryError.message);
        
        // In production, don't fall back to local storage
        if (process.env.NODE_ENV === 'production') {
          return res.status(500).json({
            success: false,
            message: 'Image upload failed. Cloudinary error in production.',
            error: cloudinaryError.message
          });
        }
        
        console.log('Falling back to local storage (development only)');
      }
    } else {
      console.log('Cloudinary not configured, using local storage (development only)');
    }

    // Fallback to local storage
    console.log('Using local storage fallback');
    
    // Extract base64 data
    let base64Data = image;
    if (image.startsWith('data:')) {
      base64Data = image.split(',')[1];
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `product_${timestamp}.jpg`;
    const filepath = path.join(uploadsDir, filename);

    // Save to local file system
    fs.writeFileSync(filepath, base64Data, 'base64');

    // Return local URL (you'll need to serve static files)
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;

    console.log('Local upload successful:', imageUrl);

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully to local storage',
      imageUrl,
      storage: 'local',
      warning: 'Using local storage. Set up Cloudinary for persistent image hosting.'
    });

  } catch (error) {
    console.error('Image upload error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Handle specific error types
    if (error.message.includes('too large') || error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'Image is too large. Please choose a smaller image (max 10MB).',
        error: 'IMAGE_TOO_LARGE'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;