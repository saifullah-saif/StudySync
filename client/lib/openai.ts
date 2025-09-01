import { QSANS_SYSTEM_PROMPT } from "@/utils/prompts";
import OpenAI from "openai";

const client = new OpenAI(
    {
        apiKey: process.env.OPENAI_API_KEY,
    }
);

export async function generateQsAnsFromOpenAI(pdfText: string){
    try{
        const response = await client.responses.create({
        model: "gpt-5",
        reasoning: { effort: "low" },
        input: [
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
        temperature: 0.7
        });
        return response.output_text
    } catch(error: any){
        if (error?.status === 429){
            throw new Error('RATE_LIMIT_EXCEEDED');
        }
        throw error;
    }
}

