// Simple test script to verify podcast API
const testPodcastAPI = async () => {
  try {
    const response = await fetch(
      "http://localhost:3000/api/podcasts/generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: "Welcome to StudySync. This is a test podcast generation. We are testing the PDF to podcast pipeline. The system uses Google Text-to-Speech API to convert text into natural-sounding audio.",
          title: "StudySync Demo Podcast",
        }),
      }
    );

    const data = await response.json();
    console.log("API Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("API Test Error:", error);
  }
};

// Run the test if this script is executed directly
if (typeof window === "undefined") {
  testPodcastAPI();
}

module.exports = { testPodcastAPI };