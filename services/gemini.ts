import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

export const analyzeSpreadsheet = async (
  columns: string[],
  sampleData: any[]
): Promise<AnalysisResult> => {
  try {
    const ai = getClient();
    
    // Prepare a sample of the data (first 5 rows) to send to the model
    const dataPreview = JSON.stringify(sampleData.slice(0, 5));
    const columnList = columns.join(", ");

    const prompt = `
      You are a data analyst expert. 
      I have a spreadsheet with the following columns: ${columnList}.
      Here is a sample of the data:
      ${dataPreview}

      Please analyze this data and identify the 5 most important columns that would be useful for a summary report or general identification of the records.
      Also provide a brief 1-sentence summary of what this dataset appears to contain.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedColumns: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "The exact names of the 5 most important columns found in the input list."
            },
            summary: {
              type: Type.STRING,
              description: "A brief summary of the dataset content."
            }
          },
          required: ["suggestedColumns", "summary"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
