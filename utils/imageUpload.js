const cloudinary = require('../backend/src/config/cloudinary');

const uploadToCloudinary = async (base64Image, folder = 'inventiease') => {
  try {
    console.log('Starting Cloudinary upload...');
    console.log('Folder:', folder);
    console.log('Image data length:', base64Image ? base64Image.length : 'No image data');

    if (!base64Image) {
      throw new Error('No image data provided');
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
      ],
    });

    console.log('Cloudinary upload successful:', result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      http_code: error.http_code
    });
    throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
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