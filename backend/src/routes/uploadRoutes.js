const express = require('express');
const router = express.Router();
const { uploadToCloudinary } = require('../../../utils/imageUpload');

router.post('/image', async (req, res) => {
  try {
    const { image, folder } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'No image data provided',
      });
    }

    const imageUrl = await uploadToCloudinary(image, folder || 'StockQ');

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message,
    });
  }
});

module.exports = router;