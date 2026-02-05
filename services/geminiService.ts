import { GoogleGenAI, Type } from "@google/genai";
import { DesignSystem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeDesignSystem = async (htmlSnippet: string): Promise<DesignSystem> => {
  const prompt = `
    Analyze the following HTML content. 
    1. Extract a palette of up to 6 dominant hex colors used (or implied).
    2. Extract up to 3 font-family names used (or implied).
    3. Identify the main semantic sections (e.g., Hero, Features, Footer).
    
    HTML Snippet (truncated if too long):
    ${htmlSnippet.substring(0, 15000)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            colors: { type: Type.ARRAY, items: { type: Type.STRING } },
            fonts: { type: Type.ARRAY, items: { type: Type.STRING } },
            sections: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return { colors: [], fonts: [], sections: [], variables: {} };
    const parsed = JSON.parse(text);
    return { ...parsed, variables: {} } as DesignSystem;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      colors: ["#ffffff", "#000000", "#3b82f6"],
      fonts: ["sans-serif"],
      sections: ["Unknown"],
      variables: {}
    };
  }
};

export const aiRefactorElement = async (elementHtml: string, instruction: string): Promise<string> => {
  const prompt = `
    You are an expert web developer and UI designer.
    Refactor the following HTML element based on this instruction: "${instruction}".
    
    Rules:
    1. Return ONLY the valid HTML code for the modified element.
    2. Do not include markdown backticks or explanations.
    3. Maintain accessibility and valid syntax.
    4. Use inline styles or Tailwind classes if present in the input.
    
    Input HTML:
    ${elementHtml}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    let result = response.text || elementHtml;
    // Cleanup markdown if gemini adds it despite instructions
    result = result.replace(/```html/g, '').replace(/```/g, '').trim();
    return result;
  } catch (error) {
    console.error("Gemini Refactor Error:", error);
    return elementHtml;
  }
};