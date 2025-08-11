const { PrismaClient } = require("@prisma/client");
const multer = require("multer");
const supabase = require("../lib/supabaseClient");
const { extractTextFromFile } = require("../lib/extractText");
const fileService = require("../services/fileService");

const prisma = new PrismaClient();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
  fileFilter: (req, file, cb) => {
    try {
      // Check if file exists
      if (!file) {
        return cb(new Error("No file provided"), false);
      }

      // Check file name
      if (!file.originalname || file.originalname.trim().length === 0) {
        return cb(new Error("File name cannot be empty"), false);
      }

      if (file.originalname.length > 255) {
        return cb(
          new Error("File name is too long (max 255 characters)"),
          false
        );
      }

      // Check for potentially dangerous file names
      const dangerousPatterns = [
        /\.\./, // Directory traversal
        /[<>:"|?*]/, // Invalid characters
        /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Reserved names
      ];

      if (
        dangerousPatterns.some((pattern) => pattern.test(file.originalname))
      ) {
        return cb(new Error("File name contains invalid characters"), false);
      }

      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/msword",
      ];
      const allowedExtensions = [
        ".pdf",
        ".docx",
        ".txt",
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".doc",
      ];

      const hasValidMimeType = allowedTypes.includes(file.mimetype);
      const hasValidExtension = allowedExtensions.some((ext) =>
        file.originalname.toLowerCase().endsWith(ext)
      );

      if (hasValidMimeType || hasValidExtension) {
        cb(null, true);
      } else {
        cb(
          new Error(
            "File type not supported. Allowed types: PDF, DOCX, TXT, DOC, JPG, PNG, GIF"
          ),
          false
        );
      }
    } catch (error) {
      cb(new Error("File validation error: " + error.message), false);
    }
  },
});

/**
 * Upload file to Supabase storage and create database record
 */
const uploadFile = async (req, res) => {
  try {
    const { title } = req.body;
    const file = req.file;
    const userId = req.user.id;

    // Comprehensive input validation
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    if (title.trim().length > 255) {
      return res.status(400).json({
        success: false,
        message: "Title is too long (max 255 characters)",
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // Additional file validation
    if (file.size === 0) {
      return res.status(400).json({
        success: false,
        message: "File is empty",
      });
    }

    if (file.size > 15 * 1024 * 1024) {
      return res.status(413).json({
        success: false,
        message: "File is too large (max 15MB)",
      });
    }

    // Upload to Supabase Storage
    const fileName = `${userId}/${Date.now()}_${file.originalname}`;
    const bucketName =
      process.env.SUPABASE_BUCKET_NAME || "study-sync-documents";

    // Create bucket if it doesn't exist
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((bucket) => bucket.name === bucketName);

    if (!bucketExists) {
      console.log(`Creating bucket: ${bucketName}`);
      const { error: createBucketError } = await supabase.storage.createBucket(
        bucketName,
        {
          public: true,
          allowedMimeTypes: [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
            "image/jpeg",
            "image/png",
            "image/gif",
            "application/msword",
          ],
          fileSizeLimit: 15728640, // 15MB
        }
      );

      if (createBucketError) {
        console.error("Error creating bucket:", createBucketError);
        return res.status(500).json({
          success: false,
          message: "Failed to create storage bucket",
        });
      }
    }

    // Upload file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        duplex: "half",
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return res.status(500).json({
        success: false,
        message: "Failed to upload file to storage",
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    // Create database record using notes table
    const document = await prisma.notes.create({
      data: {
        user_id: userId,
        title: title.trim(),
        description: `Uploaded file: ${file.originalname}`,
        file_name: file.originalname,
        file_path: fileName,
        file_type: getFileTypeEnum(file.originalname),
        file_size_bytes: BigInt(file.size),
        visibility: "private",
        tags: ["uploaded"],
        is_processed_by_ai: false,
      },
    });

    res.status(201).json({
      success: true,
      data: fileService.formatFileResponse(document),
      fileUrl: urlData.publicUrl,
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("Upload file error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload file",
    });
  }
};

/**
 * Get all files for the authenticated user
 */
const getUserFiles = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 10,
      search = "",
      fileType = "",
      sortBy = "upload_date",
      sortOrder = "desc",
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      fileType,
      sortBy,
      sortOrder,
    };

    const result = await fileService.getUserFiles(userId, options);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get user files error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get files",
    });
  }
};

/**
 * Get file details by ID
 */
const getFileDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const file = await fileService.getFileById(parseInt(id), userId);

    res.json({
      success: true,
      data: file,
    });
  } catch (error) {
    console.error("Get file details error:", error);
    const statusCode = error.message.includes("not found") ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to get file details",
    });
  }
};

/**
 * Delete file by ID
 */
const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await fileService.deleteFile(parseInt(id), userId);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Delete file error:", error);
    const statusCode = error.message.includes("not found") ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to delete file",
    });
  }
};

/**
 * Update file metadata
 */
const updateFile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const updatedFile = await fileService.updateFile(
      parseInt(id),
      userId,
      updateData
    );

    res.json({
      success: true,
      data: updatedFile,
      message: "File updated successfully",
    });
  } catch (error) {
    console.error("Update file error:", error);
    const statusCode = error.message.includes("not found") ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to update file",
    });
  }
};

/**
 * Download file
 */
const downloadFile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const downloadData = await fileService.getDownloadUrl(parseInt(id), userId);

    if (downloadData.type === "text") {
      // For pasted content, return as text file
      res.setHeader("Content-Type", "text/plain");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${downloadData.fileName}"`
      );
      res.send(downloadData.content);
    } else {
      // For uploaded files, redirect to signed URL
      res.json({
        success: true,
        data: {
          downloadUrl: downloadData.url,
          fileName: downloadData.fileName,
        },
      });
    }
  } catch (error) {
    console.error("Download file error:", error);
    const statusCode = error.message.includes("not found") ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to download file",
    });
  }
};

/**
 * Get file statistics
 */
const getFileStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await fileService.getFileStats(userId);

    res.json({
      success: true,
      data: {
        ...stats,
        totalSize: Number(stats.totalSize), // Convert BigInt to number for JSON
        fileTypes: stats.fileTypes.map((type) => ({
          ...type,
          size: Number(type.size), // Convert BigInt to number for JSON
        })),
      },
    });
  } catch (error) {
    console.error("Get file stats error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get file statistics",
    });
  }
};

/**
 * Helper function to convert file extension to enum value
 */
function getFileTypeEnum(fileName) {
  const ext = fileName.toLowerCase().split(".").pop();
  switch (ext) {
    case "pdf":
      return "pdf";
    case "docx":
    case "doc":
      return "docx";
    case "txt":
      return "txt";
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
      return "txt"; // Store images as txt type for now
    default:
      return "txt";
  }
}

module.exports = {
  upload,
  uploadFile,
  getUserFiles,
  getFileDetails,
  deleteFile,
  updateFile,
  downloadFile,
  getFileStats,
};
