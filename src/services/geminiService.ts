import { Problem, Topic, Difficulty } from "../types";

type Evaluation = { feedback: string; score: number; isCorrect: boolean };

async function callGemini<T>(action: string, params: unknown): Promise<T> {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, params }),
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof (payload as { error: unknown }).error === "string"
        ? (payload as { error: string }).error
        : `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload as T;
}

export const generateProblem = async (topic: Topic, difficulty: Difficulty): Promise<Problem> => {
  try {
    return await callGemini<Problem>("generateProblem", { topic, difficulty });
  } catch (error) {
    console.error("Error generating problem:", error);
    throw error;
  }
};

export const evaluateSubmission = async (
  problem: Problem,
  userCode: string,
): Promise<Evaluation> => {
  try {
    return await callGemini<Evaluation>("evaluateSubmission", { problem, userCode });
  } catch (error) {
    console.error("Error evaluating code:", error);
    throw error;
  }
};

export const getExplanation = async (topic: string, concept: string): Promise<string> => {
  const text = await callGemini<string>("getExplanation", { topic, concept });
  return text || "설명을 가져올 수 없습니다.";
};
