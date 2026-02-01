const cloudinary = require('../backend/src/config/cloudinary');

const uploadToCloudinary = async (base64Image, folder = 'inventiease') => {
  try {
    console.log('Starting Cloudinary upload...');
    console.log('Folder:', folder);
    console.log('Image data length:', base64Image ? base64Image.length : 'No image data');

    if (!base64Image) {
      throw new Error('No image data provided');
    }

    // Validate Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary credentials not configured');
    }

    // Ensure proper data URI format
    let dataURI = base64Image;
    if (!base64Image.startsWith('data:')) {
      dataURI = `data:image/jpeg;base64,${base64Image}`;
    }

    console.log('Data URI format:', dataURI.substring(0, 50) + '...');

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: folder,
      resource_type: 'auto',
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto:good' },
        { format: 'auto' } // Automatically choose best format (WebP, JPEG, etc.)
      ],
      // Add unique filename to prevent conflicts
      public_id: `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });

    console.log('Cloudinary upload successful:', result.secure_url);
    console.log('Image optimized:', {
      originalSize: base64Image.length,
      cloudinaryUrl: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height
    });
    
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      http_code: error.http_code
    });
    
    // Provide more specific error messages
    if (error.message.includes('credentials')) {
      throw new Error('Cloudinary credentials not properly configured. Please check your .env file.');
    } else if (error.http_code === 401) {
      throw new Error('Invalid Cloudinary credentials. Please verify your API key and secret.');
    } else if (error.http_code === 400) {
      throw new Error('Invalid image data. Please try a different image.');
    } else {
      throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
    }
  }
};

const deleteFromCloudinary = async (imageUrl) => {
  try {
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    const publicId = `inventiease/${filename.split('.')[0]}`;
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };