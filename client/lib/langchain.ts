// This file will now just call the server API instead of processing directly

export async function extractPDFText(fileUrl: string, fileName: string) {
  try {
    const response = await fetch('/api/langchain/process-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify({
        fileUrl,
        fileName
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to extract PDF text');
    }

    return data.data;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw error;
  }
}