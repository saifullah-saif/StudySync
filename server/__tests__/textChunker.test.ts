import {
  chunkText,
  generateChapterTitles,
  estimateReadingTime,
} from "../server/utils/textChunker";

describe("textChunker", () => {
  describe("chunkText", () => {
    test("should return empty array for empty text", () => {
      expect(chunkText("")).toEqual([]);
      expect(chunkText("   ")).toEqual([]);
    });

    test("should return single chunk for short text", () => {
      const text = "This is a short text.";
      const result = chunkText(text, 100);
      expect(result).toEqual([text]);
    });

    test("should split long text into multiple chunks", () => {
      const text = "A".repeat(3000);
      const result = chunkText(text, 1000);
      expect(result.length).toBeGreaterThan(1);
      expect(result.every((chunk) => chunk.length <= 1000)).toBe(true);
    });

    test("should preserve sentence boundaries", () => {
      const text = "First sentence. Second sentence. Third sentence.";
      const result = chunkText(text, 20, true);

      // Each chunk should end with proper punctuation or be complete sentences
      result.forEach((chunk) => {
        const trimmed = chunk.trim();
        expect(trimmed.length).toBeGreaterThan(0);
      });
    });

    test("should handle paragraphs correctly", () => {
      const text = "First paragraph.\n\nSecond paragraph.\n\nThird paragraph.";
      const result = chunkText(text, 25, true);
      expect(result.length).toBeGreaterThan(0);
    });

    test("should split very long sentences", () => {
      const longSentence = "Word ".repeat(500) + ".";
      const result = chunkText(longSentence, 100, true);
      expect(result.length).toBeGreaterThan(1);
      expect(result.every((chunk) => chunk.length <= 100)).toBe(true);
    });
  });

  describe("generateChapterTitles", () => {
    test("should generate titles from chunks", () => {
      const chunks = [
        "Introduction to the topic and overview of concepts",
        "Detailed explanation of the first principle",
        "Examples and use cases for practical application",
      ];

      const titles = generateChapterTitles(chunks);
      expect(titles).toHaveLength(3);
      expect(titles[0]).toBe("Introduction to the topic and overview of");
      expect(titles[1]).toBe("Detailed explanation of the first principle");
      expect(titles[2]).toBe(
        "Examples and use cases for practical application"
      );
    });

    test("should handle empty chunks", () => {
      const titles = generateChapterTitles([]);
      expect(titles).toEqual([]);
    });

    test("should clean up titles", () => {
      const chunks = ["...!@# This is a test sentence with punctuation!!!"];
      const titles = generateChapterTitles(chunks);
      expect(titles[0]).toBe("This is a test sentence with punctuation");
    });

    test("should provide fallback titles", () => {
      const chunks = ["", "   ", "!!!@@@"];
      const titles = generateChapterTitles(chunks);
      expect(titles).toEqual(["Chapter 1", "Chapter 2", "Chapter 3"]);
    });
  });

  describe("estimateReadingTime", () => {
    test("should estimate reading time correctly", () => {
      const text = "word ".repeat(150); // 150 words
      const time = estimateReadingTime(text, 150); // 150 WPM
      expect(time).toBe(60); // Should be 60 seconds (1 minute)
    });

    test("should handle empty text", () => {
      expect(estimateReadingTime("")).toBe(0);
    });

    test("should round up to nearest second", () => {
      const text = "word ".repeat(10); // 10 words
      const time = estimateReadingTime(text, 150); // 150 WPM
      expect(time).toBe(4); // Should round up (10/150 * 60 = 4)
    });
  });
});
