import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';

interface UseImageUploadReturn {
  image: string | null;
  isUploading: boolean;
  uploadError: string | null;
  pickImage: () => Promise<void>;
  uploadImage: () => Promise<string | null>;
  clearImage: () => void;
  setImage: (uri: string | null) => void;
}

export const useImageUpload = (apiUrl: string): UseImageUploadReturn => {
  const [image, setImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        setUploadError('Permission to access gallery is required');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
        setUploadError(null);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setUploadError('Failed to pick image');
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!image) return null;

    setIsUploading(true);
    setUploadError(null);

    try {
      // Convert image to base64
      const base64 = await FileSystem.readAsStringAsync(image, {
        encoding: 'base64',
      });

      // Upload to backend
      const response = await axios.post(`${apiUrl}/upload/image`, {
        image: `data:image/jpeg;base64,${base64}`,
        folder: 'inventiease',
      });

      if (response.data.success) {
        setIsUploading(false);
        return response.data.imageUrl;
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setUploadError(error.message || 'Failed to upload image');
      setIsUploading(false);
      return null;
    }
  };

  const clearImage = () => {
    setImage(null);
    setUploadError(null);
  };

  return {
    image,
    isUploading,
    uploadError,
    pickImage,
    uploadImage,
    clearImage,
    setImage,
  };
};