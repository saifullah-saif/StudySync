const supabase = require("./supabaseClient");
const multer = require("multer");

/**
 * Centralized upload service for handling file uploads to Supabase storage
 * Supports both public and private buckets with signed URL generation
 */
class UploadService {
  constructor() {
    this.defaultBucketName = process.env.SUPABASE_BUCKET_NAME || "study-sync-documents";
    this.maxFileSize = 15 * 1024 * 1024; // 15MB
  }

  /**
   * Configure multer for file uploads with validation
   * @param {Object} options - Upload configuration options
   * @param {Array} options.allowedTypes - Array of allowed MIME types
   * @param {Array} options.allowedExtensions - Array of allowed file extensions
   * @param {number} options.maxFileSize - Maximum file size in bytes
   * @param {boolean} options.validateFileName - Whether to validate file names
   * @returns {multer.Multer} Configured multer instance
   */
  createMulterConfig(options = {}) {
    const {
      allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/msword",
      ],
      allowedExtensions = [".pdf", ".docx", ".txt", ".jpg", ".jpeg", ".png", ".gif", ".doc"],
      maxFileSize = this.maxFileSize,
      validateFileName = true,
    } = options;

    return multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: maxFileSize,
      },
      fileFilter: (req, file, cb) => {
        try {
          // Check if file exists
          if (!file) {
            return cb(new Error("No file provided"), false);
          }

          // Validate file name if enabled
          if (validateFileName) {
            if (!file.originalname || file.originalname.trim().length === 0) {
              return cb(new Error("File name cannot be empty"), false);
            }

            if (file.originalname.length > 255) {
              return cb(new Error("File name is too long (max 255 characters)"), false);
            }

            // Check for potentially dangerous file names
            const dangerousPatterns = [
              /\.\./, // Directory traversal
              /[<>:"|?*]/, // Invalid characters
              /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Reserved names
            ];

            if (dangerousPatterns.some((pattern) => pattern.test(file.originalname))) {
              return cb(new Error("File name contains invalid characters"), false);
            }
          }

          // Check MIME type and extension
          const hasValidMimeType = allowedTypes.includes(file.mimetype);
          const hasValidExtension = allowedExtensions.some((ext) =>
            file.originalname.toLowerCase().endsWith(ext.toLowerCase())
          );

          if (hasValidMimeType || hasValidExtension) {
            cb(null, true);
          } else {
            cb(
              new Error(
                `File type not allowed. Allowed types: ${allowedExtensions.join(", ")}`
              ),
              false
            );
          }
        } catch (error) {
          cb(error, false);
        }
      },
    });
  }

  /**
   * Ensure bucket exists and create it if it doesn't
   * @param {string} bucketName - Name of the bucket
   * @param {Object} bucketOptions - Bucket configuration options
   * @returns {Promise<void>}
   */
  async ensureBucketExists(bucketName, bucketOptions = {}) {
    const {
      isPublic = false,
      allowedMimeTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/msword",
      ],
      fileSizeLimit = this.maxFileSize,
    } = bucketOptions;

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`);
    }

    const bucketExists = buckets?.some((bucket) => bucket.name === bucketName);

    if (!bucketExists) {
      console.log(`Creating bucket: ${bucketName} (public: ${isPublic})`);
      
      const { error: createBucketError } = await supabase.storage.createBucket(
        bucketName,
        {
          public: isPublic,
          allowedMimeTypes,
          fileSizeLimit,
        }
      );

      if (createBucketError) {
        throw new Error(`Failed to create bucket: ${createBucketError.message}`);
      }
    }
  }

  /**
   * Upload file to Supabase storage
   * @param {Object} file - File object from multer
   * @param {number} userId - User ID for folder organization
   * @param {Object} options - Upload options
   * @param {string} options.bucketName - Custom bucket name
   * @param {boolean} options.isPublic - Whether bucket should be public
   * @param {string} options.folderPath - Custom folder path (overrides userId folder)
   * @param {boolean} options.upsert - Whether to overwrite existing files
   * @returns {Promise<Object>} Upload result with file info and URLs
   */
  async uploadFile(file, userId, options = {}) {
    const {
      bucketName = this.defaultBucketName,
      isPublic = false,
      folderPath = `${userId}`,
      upsert = false,
    } = options;

    try {
      // Ensure bucket exists
      await this.ensureBucketExists(bucketName, { isPublic });

      // Generate unique file name
      const timestamp = Date.now();
      const fileName = `${folderPath}/${timestamp}_${file.originalname}`;

      console.log(`Uploading file: ${fileName} to bucket: ${bucketName} (public: ${isPublic})`);

      // Upload file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Generate URLs based on bucket type
      let publicUrl = null;
      let signedUrl = null;

      if (isPublic) {
        // For public buckets, get public URL
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName);
        publicUrl = urlData.publicUrl;
      } else {
        // For private buckets, generate signed URL (valid for 1 hour by default)
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(fileName, 3600); // 1 hour expiry

        if (signedUrlError) {
          console.warn(`Failed to create signed URL: ${signedUrlError.message}`);
          // Continue without signed URL - it can be generated later if needed
        } else {
          signedUrl = signedUrlData.signedUrl;
        }
      }

      return {
        success: true,
        data: {
          fileName,
          filePath: uploadData.path,
          fullPath: uploadData.fullPath,
          bucketName,
          isPublic,
          publicUrl,
          signedUrl,
          fileSize: file.size,
          mimeType: file.mimetype,
          originalName: file.originalname,
        },
      };
    } catch (error) {
      console.error("Upload service error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate a signed URL for private files
   * @param {string} bucketName - Bucket name
   * @param {string} fileName - File name/path
   * @param {number} expiresIn - Expiry time in seconds (default: 1 hour)
   * @returns {Promise<Object>} Signed URL result
   */
  async createSignedUrl(bucketName, fileName, expiresIn = 3600) {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(fileName, expiresIn);

      if (error) {
        throw new Error(`Failed to create signed URL: ${error.message}`);
      }

      return {
        success: true,
        signedUrl: data.signedUrl,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      };
    } catch (error) {
      console.error("Signed URL creation error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete file from storage
   * @param {string} bucketName - Bucket name
   * @param {string} fileName - File name/path
   * @returns {Promise<Object>} Delete result
   */
  async deleteFile(bucketName, fileName) {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .remove([fileName]);

      if (error) {
        throw new Error(`Failed to delete file: ${error.message}`);
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("File deletion error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Download file from storage
   * @param {string} bucketName - Bucket name
   * @param {string} fileName - File name/path
   * @returns {Promise<Object>} Download result with file buffer
   */
  async downloadFile(bucketName, fileName) {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(fileName);

      if (error) {
        throw new Error(`Failed to download file: ${error.message}`);
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("File download error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Export singleton instance
module.exports = new UploadService();
