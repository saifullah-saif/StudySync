'use server'

import { extractPDFText } from "@/lib/langchain";

export async function generateQsAns(uploadResponse: any) {
  console.log('📥 Processing upload response:', uploadResponse);
  
  if (!uploadResponse) {
    return {
      success: false,
      message: 'File upload failed - no response',
      data: null,
    };
  }

  try {
    // Handle different response structures
    let fileUrl: string;
    let fileName: string;
    
    if (Array.isArray(uploadResponse) && uploadResponse.length > 0) {
      // Handle array response
      const firstFile = uploadResponse[0];
      if (firstFile?.serverData?.file) {
        fileUrl = firstFile.serverData.file.url;
        fileName = firstFile.serverData.file.name;
      } else {
        throw new Error('Invalid upload response structure - missing file data');
      }
    } else if (uploadResponse?.file) {
      // Handle direct object response
      fileUrl = uploadResponse.file.url;
      fileName = uploadResponse.file.name;
    } else {
      throw new Error('Invalid upload response structure');
    }

    if (!fileUrl || !fileName) {
      return {
        success: false,
        message: 'Missing file URL or name in upload response',
        data: null,
      };
    }

    console.log(`🔄 Extracting text from: ${fileName}`);
    console.log(`📍 File URL: ${fileUrl}`);

    // Extract text using our server-side API
    const extractionResult = await extractPDFText(fileUrl, fileName);
    
    console.log(`✅ Successfully extracted ${extractionResult.wordCount} words from PDF`);
    
    return {
      success: true,
      message: `Successfully extracted text from ${fileName}`,
      data: {
        extractedText: extractionResult.extractedText,
        pageCount: extractionResult.pageCount,
        wordCount: extractionResult.wordCount,
        fileName,
        fileUrl
      }
    };

  } catch (error) {
    console.error('❌ PDF processing error:', error);
    return {
      success: false,
      message: `Failed to process PDF: ${error.message}`,
      data: null,
    };
  }
}