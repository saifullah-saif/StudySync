const { PrismaClient } = require("@prisma/client");
const supabase = require("../lib/supabaseClient");
const uploadService = require("../lib/uploadService");

const prisma = new PrismaClient();

class FileService {
  static instance = null;

  static getInstance() {
    if (!FileService.instance) {
      FileService.instance = new FileService();
    }
    return FileService.instance;
  }

  /**
   * Get all files for a user with pagination and filtering
   */
  async getUserFiles(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        fileType = "",
        sortBy = "upload_date",
        sortOrder = "desc",
      } = options;

      const skip = (page - 1) * limit;

      // Build where clause
      const where = {
        user_id: userId,
      };

      // Add search filter
      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { file_name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      // Add file type filter
      if (fileType) {
        where.file_type = fileType;
      }

      // Get total count for pagination
      const totalCount = await prisma.notes.count({ where });

      // Get files with pagination
      const files = await prisma.notes.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          file_name: true,
          file_path: true,
          file_type: true,
          file_size_bytes: true,
          visibility: true,
          tags: true,
          upload_date: true,
          last_modified: true,
          download_count: true,
          is_processed_by_ai: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      });

      // Calculate pagination info
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        files: files.map(this.formatFileResponse),
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit,
        },
      };
    } catch (error) {
      console.error("Get user files error:", error);
      throw error;
    }
  }

  /**
   * Get file details by ID
   */
  async getFileById(fileId, userId) {
    try {
      const file = await prisma.notes.findFirst({
        where: {
          id: fileId,
          user_id: userId,
        },
        include: {
          document_chunks: {
            select: {
              id: true,
              chunk_text: true,
              chunk_order: true,
              chunk_type: true,
              word_count: true,
              processed: true,
            },
            orderBy: {
              chunk_order: "asc",
            },
          },
        },
      });

      if (!file) {
        throw new Error("File not found or access denied");
      }

      return this.formatFileResponse(file);
    } catch (error) {
      console.error("Get file by ID error:", error);
      throw error;
    }
  }

  /**
   * Delete file by ID
   */
  async deleteFile(fileId, userId) {
    try {
      // First, get the file to check ownership and get file path
      const file = await prisma.notes.findFirst({
        where: {
          id: fileId,
          user_id: userId,
        },
      });

      if (!file) {
        throw new Error("File not found or access denied");
      }

      // Delete from Supabase storage if it's an uploaded file
      if (file.file_path && !file.file_path.startsWith("pasted_")) {
        const bucketName =
          process.env.SUPABASE_BUCKET_NAME || "study-sync-documents";

        const { error: deleteError } = await supabase.storage
          .from(bucketName)
          .remove([file.file_path]);

        if (deleteError) {
          console.warn("Failed to delete file from storage:", deleteError);
          // Continue with database deletion even if storage deletion fails
        }
      }

      // Delete from database (this will cascade delete document_chunks)
      await prisma.notes.delete({
        where: {
          id: fileId,
        },
      });

      return {
        success: true,
        message: "File deleted successfully",
      };
    } catch (error) {
      console.error("Delete file error:", error);
      throw error;
    }
  }

  /**
   * Update file metadata
   */
  async updateFile(fileId, userId, updateData) {
    try {
      const { title, description, tags, visibility } = updateData;

      // Check if file exists and user has access
      const existingFile = await prisma.notes.findFirst({
        where: {
          id: fileId,
          user_id: userId,
        },
      });

      if (!existingFile) {
        throw new Error("File not found or access denied");
      }

      // Update file
      const updatedFile = await prisma.notes.update({
        where: {
          id: fileId,
        },
        data: {
          ...(title && { title: title.trim() }),
          ...(description !== undefined && { description }),
          ...(tags && { tags }),
          ...(visibility && { visibility }),
          last_modified: new Date(),
        },
      });

      return this.formatFileResponse(updatedFile);
    } catch (error) {
      console.error("Update file error:", error);
      throw error;
    }
  }

  /**
   * Get file statistics for a user
   */
  async getFileStats(userId) {
    try {
      const stats = await prisma.notes.groupBy({
        by: ["file_type"],
        where: {
          user_id: userId,
        },
        _count: {
          id: true,
        },
        _sum: {
          file_size_bytes: true,
        },
      });

      const totalFiles = await prisma.notes.count({
        where: { user_id: userId },
      });

      const totalSize = await prisma.notes.aggregate({
        where: { user_id: userId },
        _sum: {
          file_size_bytes: true,
        },
      });

      return {
        totalFiles,
        totalSize: totalSize._sum.file_size_bytes || BigInt(0),
        fileTypes: stats.map((stat) => ({
          type: stat.file_type,
          count: stat._count.id,
          size: stat._sum.file_size_bytes || BigInt(0),
        })),
      };
    } catch (error) {
      console.error("Get file stats error:", error);
      throw error;
    }
  }

  /**
   * Get download URL for a file
   */
  async getDownloadUrl(fileId, userId) {
    try {
      const file = await prisma.notes.findFirst({
        where: {
          id: fileId,
          user_id: userId,
        },
      });

      if (!file) {
        throw new Error("File not found or access denied");
      }

      // For pasted content, return the text content
      if (file.file_path.startsWith("pasted_")) {
        const chunks = await prisma.document_chunks.findMany({
          where: { document_id: fileId },
          orderBy: { chunk_order: "asc" },
        });

        return {
          type: "text",
          content: chunks.map((chunk) => chunk.chunk_text).join("\n\n"),
          fileName: file.file_name,
        };
      }

      // For uploaded files, get signed URL using uploadService
      const signedUrl = await uploadService.createSignedUrl(file.file_path);

      // Increment download count
      await prisma.notes.update({
        where: { id: fileId },
        data: {
          download_count: {
            increment: 1,
          },
        },
      });

      return {
        type: "url",
        url: signedUrl,
        fileName: file.file_name,
      };
    } catch (error) {
      console.error("Get download URL error:", error);
      throw error;
    }
  }

  /**
   * Format file response for API
   */
  formatFileResponse(file) {
    return {
      id: file.id,
      title: file.title,
      description: file.description,
      fileName: file.file_name,
      filePath: file.file_path,
      fileType: file.file_type,
      fileSize: file.file_size_bytes ? Number(file.file_size_bytes) : 0,
      visibility: file.visibility,
      tags: file.tags || [],
      uploadDate: file.upload_date,
      lastModified: file.last_modified,
      downloadCount: file.download_count || 0,
      isProcessedByAi: file.is_processed_by_ai,
      ...(file.document_chunks && { chunks: file.document_chunks }),
    };
  }
}

module.exports = FileService.getInstance();
