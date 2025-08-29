class SimpleQAService {
  /**
   * Generate Q&A pairs from text using simple rule-based extraction
   */
  generateQAPairs(text, maxPairs = 8) {
    console.log("🧠 Generating Q&A using rule-based extraction...");

    try {
      const sentences = this.extractSentences(text);
      const definitions = this.extractDefinitions(sentences);
      const importantFacts = this.extractImportantFacts(sentences);
      const processes = this.extractProcesses(sentences);

      let qaPairs = [];

      // Generate definition questions
      qaPairs = qaPairs.concat(this.createDefinitionQuestions(definitions));

      // Generate fact-based questions
      qaPairs = qaPairs.concat(this.createFactQuestions(importantFacts));

      // Generate process questions
      qaPairs = qaPairs.concat(this.createProcessQuestions(processes));

      // Limit to requested number
      const result = qaPairs.slice(0, maxPairs);

      console.log(
        `✅ Generated ${result.length} Q&A pairs using rule-based method`
      );
      return result;
    } catch (error) {
      console.error("❌ Rule-based Q&A generation error:", error);
      return [];
    }
  }

  extractSentences(text) {
    // Simple sentence splitting
    return text
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10); // Only meaningful sentences
  }

  extractDefinitions(sentences) {
    const definitions = [];
    const definitionPatterns = [
      /(.+?)\s+is\s+(.+)/i,
      /(.+?)\s+are\s+(.+)/i,
      /(.+?)\s+means\s+(.+)/i,
      /(.+?)\s+refers to\s+(.+)/i,
      /(.+?):\s+(.+)/i,
    ];

    sentences.forEach((sentence) => {
      definitionPatterns.forEach((pattern) => {
        const match = sentence.match(pattern);
        if (match && match[1].length < 50) {
          definitions.push({
            term: match[1].trim(),
            definition: match[2].trim(),
            source: sentence,
          });
        }
      });
    });

    return definitions.slice(0, 3); // Top 3 definitions
  }

  extractImportantFacts(sentences) {
    const facts = [];
    const factPatterns = [
      /(.+?)\s+(contains?|includes?|consists of)\s+(.+)/i,
      /(.+?)\s+(has|have)\s+(.+)/i,
      /(.+?)\s+(provides?|offers?)\s+(.+)/i,
      /(\d+.*?)\s+(.+)/i, // Sentences starting with numbers
    ];

    sentences.forEach((sentence) => {
      if (sentence.length > 20 && sentence.length < 150) {
        factPatterns.forEach((pattern) => {
          const match = sentence.match(pattern);
          if (match) {
            facts.push({
              fact: sentence,
              subject: match[1] ? match[1].trim() : "",
              details: match[2] ? match[2].trim() : "",
            });
          }
        });
      }
    });

    return facts.slice(0, 3); // Top 3 facts
  }

  extractProcesses(sentences) {
    const processes = [];
    const processKeywords = [
      "first",
      "then",
      "next",
      "finally",
      "step",
      "process",
      "procedure",
      "method",
    ];

    sentences.forEach((sentence) => {
      const hasProcessKeyword = processKeywords.some((keyword) =>
        sentence.toLowerCase().includes(keyword)
      );

      if (hasProcessKeyword && sentence.length > 30) {
        processes.push({
          process: sentence,
          type: "process",
        });
      }
    });

    return processes.slice(0, 2); // Top 2 processes
  }

  createDefinitionQuestions(definitions) {
    return definitions.map((def) => ({
      question: `What is ${def.term}?`,
      answer: def.definition,
      type: "definition",
    }));
  }

  createFactQuestions(facts) {
    return facts.map((fact, index) => {
      // Try to create meaningful questions from facts
      let question = `What can you tell me about ${fact.subject}?`;

      // Try to create more specific questions
      if (fact.fact.toLowerCase().includes("contain")) {
        question = `What does ${fact.subject} contain?`;
      } else if (fact.fact.toLowerCase().includes("include")) {
        question = `What does ${fact.subject} include?`;
      } else if (fact.fact.toLowerCase().includes("provide")) {
        question = `What does ${fact.subject} provide?`;
      }

      return {
        question: question,
        answer: fact.fact,
        type: "fact",
      };
    });
  }

  createProcessQuestions(processes) {
    return processes.map((proc, index) => ({
      question: `Describe the process mentioned in the text.`,
      answer: proc.process,
      type: "process",
    }));
  }
}

module.exports = new SimpleQAService();
