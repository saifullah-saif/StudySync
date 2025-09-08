const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY; // or SERVICE_ROLE_KEY for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ROLE_KEY
);

// Configure multer for file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
    }
  }
});

class FileUploadService {
  static instance = null;

  static getInstance() {
    if (!FileUploadService.instance) {
      FileUploadService.instance = new FileUploadService();
    }
    return FileUploadService.instance;
  }

  // Upload profile picture to Supabase storage
  async uploadProfilePicture(userId, file) {
    try {
      if (!file) {
        throw new Error('No file provided');
      }

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const fileName = `profile-${userId}-${Date.now()}${fileExtension}`;
      const filePath = `profile-pictures/${fileName}`;

      // Upload file to Supabase storage
      const { data, error } = await supabase.storage
        .from('study-sync-documents')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false // Don't overwrite existing files
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(`Failed to upload file: ${error.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('study-sync-documents')
        .getPublicUrl(filePath);

      return {
        path: filePath,
        publicUrl: publicUrl,
        fileName: fileName
      };
    } catch (error) {
      console.error('Upload profile picture error:', error);
      throw error;
    }
  }

  // Delete old profile picture from Supabase storage
  async deleteProfilePicture(filePath) {
    try {
      if (!filePath) {
        return; // No file to delete
      }

      // Extract relative path from URL if needed
      let pathToDelete = filePath;
      if (filePath.includes('supabase')) {
        // Extract path from full URL
        const urlParts = filePath.split('/storage/v1/object/public/study-sync-documents/');
        if (urlParts.length > 1) {
          pathToDelete = urlParts[1];
        }
      }

      const { error } = await supabase.storage
        .from('study-sync-documents')
        .remove([pathToDelete]);

      if (error) {
        console.error('Failed to delete old profile picture:', error);
        // Don't throw error for deletion failures, just log it
      }
    } catch (error) {
      console.error('Delete profile picture error:', error);
      // Don't throw error for deletion failures
    }
  }

  // Get multer upload middleware
  getUploadMiddleware() {
    return upload.single('profilePicture');
  }
}

module.exports = FileUploadService;
