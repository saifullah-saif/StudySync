const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const QSANS_SYSTEM_PROMPT = `
You are an expert tutor who creates concise, accurate, and easy-to-understand flashcards.  
Your job is to read the following study material and generate useful question-answer pairs.  

Guidelines:
- Focus only on the most important concepts, definitions, and explanations.  
- Questions should be clear, unambiguous, and beginner-friendly.  
- Answers should be short (1–3 sentences max), but precise.  
- If the text has lists, processes, or steps, turn them into "What are the steps of X?" type questions.  
- Do not copy long sentences verbatim. Rephrase in simpler terms.  
- Skip irrelevant details.  
- Output the results in **JSON format** with this structure:  

[
  {
    "question": "What is ...?",
    "answer": "..."
  },
  {
    "question": "How does ... work?",
    "answer": "..."
  }
] 
`;

async function generateQsAnsFromOpenAI(pdfText) {
  try {
    console.log('🤖 Generating Q&A from OpenAI...');
    
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini", // Use a valid model name
      messages: [
        {
          role: "system",
          content: QSANS_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: `
            I am providing you with study material extracted from a PDF. 
            Your task is to create a set of high-quality flashcards in Q&A format. 

            Rules:
            - Focus on the most important concepts, definitions, and explanations.  
            - Make questions clear, concise, and student-friendly.  
            - Make answers accurate, but not overly long (1–3 sentences max).  
            - If the text contains lists, formulas, or examples, turn them into direct Q&A.  
            - Avoid trivial questions like "What is mentioned in paragraph 1".  
            - Provide the output as a JSON array of objects with "question" and "answer".  

            Here is the study material:
            """  
            ${pdfText}  
            """
          `,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const content = response.choices[0].message.content;
    console.log('✅ OpenAI response received');
    
    // Try to parse JSON response
    let qsAns;
    try {
      qsAns = JSON.parse(content);
    } catch (parseError) {
      console.log('⚠️ Failed to parse JSON, attempting to extract JSON from response...');
      // Try to extract JSON from response if it's wrapped in text
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        qsAns = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not extract valid JSON from OpenAI response');
      }
    }

    console.log(`🎯 Generated ${qsAns.length} Q&A pairs`);
    return qsAns;

  } catch (error) {
    console.error('❌ OpenAI API error:', error);
    
    if (error?.status === 429) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }
    if (error?.status === 401) {
      throw new Error('INVALID_API_KEY');
    }
    
    throw error;
  }
}

module.exports = {
  generateQsAnsFromOpenAI
};