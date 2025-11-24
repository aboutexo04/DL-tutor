import { GoogleGenAI, Type } from "@google/genai";
import { Problem, Topic, Difficulty } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const MODEL_NAME = "gemini-2.5-flash";

export const generateProblem = async (topic: Topic, difficulty: Difficulty): Promise<Problem> => {
  try {
    const prompt = `
      Create a deep learning coding interview problem using PyTorch in Korean (한국어).
      Topic: ${topic}
      Difficulty: ${difficulty}
      
      The problem should focus on implementation details relevant to the topic.
      Ensure the description clearly states input/output shapes and expected behavior.
      Provide a starter code snippet that sets up imports and the class structure but leaves the logic empty (pass).
      Provide the full solution code.
      Provide 3 helpful hints in Korean.
      
      IMPORTANT: All text (Title, Description, Hints) must be in Korean. Variable names and code comments can be in English or Korean.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: "당신은 시니어 딥러닝 엔지니어 면접관입니다. 모든 응답은 한국어로 작성되어야 합니다.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            starterCode: { type: Type.STRING },
            solutionCode: { type: Type.STRING },
            hints: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["title", "description", "starterCode", "solutionCode", "hints"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    return JSON.parse(response.text) as Problem;
  } catch (error) {
    console.error("Error generating problem:", error);
    throw error;
  }
};

export const evaluateSubmission = async (problem: Problem, userCode: string): Promise<{ feedback: string, score: number, isCorrect: boolean }> => {
  try {
    const prompt = `
      Evaluate the following Deep Learning coding solution in Korean (한국어).
      
      Problem Title: ${problem.title}
      Problem Description: ${problem.description}
      
      Reference Solution:
      ${problem.solutionCode}
      
      User Submission:
      ${userCode}
      
      Provide a detailed code review in Korean.
      1. Check for correctness (shapes, logic, autograd usage).
      2. Check for efficiency/best practices in PyTorch.
      3. Give a score out of 100.
      4. State explicitly if it is functionally correct.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: "당신은 엄격하지만 도움이 되는 코드 리뷰어입니다. 피드백은 한국어로 마크다운 형식을 사용하여 제공하세요.",
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                feedback: { type: Type.STRING, description: "Markdown formatted detailed feedback in Korean" },
                score: { type: Type.INTEGER, description: "Score from 0 to 100" },
                isCorrect: { type: Type.BOOLEAN, description: "Whether the code functionally solves the problem" }
            },
            required: ["feedback", "score", "isCorrect"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error evaluating code:", error);
    throw error;
  }
};

export const getExplanation = async (topic: string, concept: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `"${topic}" (Deep Learning) 문맥에서 "${concept}" 개념을 한국어로 간결하고 명확하게 설명해주세요.`,
    });
    return response.text || "설명을 가져올 수 없습니다.";
}