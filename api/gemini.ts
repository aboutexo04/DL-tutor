import { GoogleGenAI, Type, type Schema } from "@google/genai";
import { Difficulty, Topic, type Problem } from "../src/types";

/**
 * Stable GA Flash model.
 * gemini-2.5-flash is deprecated (routes to gemini-3.5-flash-lite on 2026-12-01).
 * Override with the server env var GEMINI_MODEL.
 */
const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";

export const MAX_BODY_BYTES = 512 * 1024;

const ACTIONS = ["generateProblem", "evaluateSubmission", "getExplanation"] as const;
type Action = (typeof ACTIONS)[number];

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

interface ApiRequest {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
  status(code: number): ApiResponse;
  json(body: unknown): void;
}

export const config = {
  runtime: "nodejs",
  maxDuration: 60,
};

function resolveModel(): string {
  const override = process.env.GEMINI_MODEL?.trim();
  return override || DEFAULT_GEMINI_MODEL;
}

function requireApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new HttpError(500, "서버에 GEMINI_API_KEY가 설정되어 있지 않습니다.");
  }
  return apiKey;
}

function redact(message: string): string {
  return message.replace(/AIza[0-9A-Za-z_-]+/g, "[redacted]");
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function isNonEmptyString(value: unknown, max: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}

function isStringWithin(value: unknown, max: number): value is string {
  return typeof value === "string" && value.length <= max;
}

function isTopic(value: unknown): value is Topic {
  return typeof value === "string" && (Object.values(Topic) as string[]).includes(value);
}

function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === "string" && (Object.values(Difficulty) as string[]).includes(value);
}

function assertBodyWithinLimit(body: unknown): void {
  const serialized = typeof body === "string" ? body : JSON.stringify(body ?? null);
  if (serialized && Buffer.byteLength(serialized) > MAX_BODY_BYTES) {
    throw new HttpError(413, "요청 본문이 너무 큽니다.");
  }
}

function headerValue(headers: ApiRequest["headers"], name: string): string | undefined {
  const value = headers?.[name];
  if (Array.isArray(value)) return value[0];
  return value;
}

async function generateContent(options: {
  contents: string;
  systemInstruction?: string;
  responseSchema?: Schema;
}): Promise<string | undefined> {
  const ai = new GoogleGenAI({ apiKey: requireApiKey() });
  try {
    const response = await ai.models.generateContent({
      model: resolveModel(),
      contents: options.contents,
      config: {
        systemInstruction: options.systemInstruction,
        responseMimeType: options.responseSchema ? "application/json" : undefined,
        responseSchema: options.responseSchema,
      },
    });
    return response.text;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Gemini request failed:", redact(message));
    throw new HttpError(502, "Gemini 요청에 실패했습니다.");
  }
}

function parseModelJson(text: string | undefined): unknown {
  if (!text) {
    throw new HttpError(502, "모델 응답이 비어 있습니다.");
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new HttpError(502, "모델 응답을 해석할 수 없습니다.");
  }
}

function parseProblem(
  value: unknown,
  invalidStatus = 502,
  invalidMessage = "모델이 올바른 문제 형식을 반환하지 않았습니다.",
): Problem {
  const record = asRecord(value);
  const title = record?.title;
  const description = record?.description;
  const starterCode = record?.starterCode;
  const solutionCode = record?.solutionCode;
  const hints = record?.hints;

  if (
    !isNonEmptyString(title, 500) ||
    !isNonEmptyString(description, 30_000) ||
    !isNonEmptyString(starterCode, 100_000) ||
    !isNonEmptyString(solutionCode, 100_000) ||
    !Array.isArray(hints) ||
    hints.length > 10 ||
    hints.some((hint) => !isNonEmptyString(hint, 4_000))
  ) {
    throw new HttpError(invalidStatus, invalidMessage);
  }

  return { title, description, starterCode, solutionCode, hints };
}

function parseEvaluation(value: unknown): { feedback: string; score: number; isCorrect: boolean } {
  const record = asRecord(value);
  const feedback = record?.feedback;
  const score = record?.score;
  const isCorrect = record?.isCorrect;

  if (!isNonEmptyString(feedback, 50_000) || typeof score !== "number" || !Number.isFinite(score) || typeof isCorrect !== "boolean") {
    throw new HttpError(502, "모델이 올바른 채점 형식을 반환하지 않았습니다.");
  }

  return {
    feedback,
    score: Math.max(0, Math.min(100, Math.round(score))),
    isCorrect,
  };
}

async function generateProblem(params: unknown): Promise<Problem> {
  const record = asRecord(params);
  if (!record) throw new HttpError(400, "params 형식이 올바르지 않습니다.");

  const topic = record.topic;
  const difficulty = record.difficulty;
  if (!isTopic(topic)) throw new HttpError(400, "topic이 올바르지 않습니다.");
  if (!isDifficulty(difficulty)) throw new HttpError(400, "difficulty가 올바르지 않습니다.");

  const prompt = `
      Create a deep learning coding interview problem using PyTorch in Korean (한국어).
      Topic: ${topic}
      Difficulty: ${difficulty}

      Difficulty Guidelines:
      - 입문 (Beginner): Very basic concepts. Simple tensor operations, basic neural network concepts. No complex math. Heavily guided with comments. Suitable for someone just starting to learn PyTorch.
      - 초급 (Junior): Basic implementation. Simple layers, forward pass. Some guidance provided.
      - 중급 (Mid): Moderate complexity. Custom implementations, understanding of gradients.
      - 고급 (Senior): Advanced topics. Complex architectures, optimization tricks, edge cases.

      The problem should focus on implementation details relevant to the topic.
      Ensure the description clearly states input/output shapes and expected behavior.
      Provide a starter code snippet that sets up imports and the class structure but leaves the logic empty (pass).
      Provide the full solution code.
      Provide 3 helpful hints in Korean.

      IMPORTANT: All text (Title, Description, Hints) must be in Korean. Variable names and code comments can be in English or Korean.
    `;

  const text = await generateContent({
    contents: prompt,
    systemInstruction: "당신은 시니어 딥러닝 엔지니어 면접관입니다. 모든 응답은 한국어로 작성되어야 합니다.",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        starterCode: { type: Type.STRING },
        solutionCode: { type: Type.STRING },
        hints: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: ["title", "description", "starterCode", "solutionCode", "hints"],
    },
  });

  return parseProblem(parseModelJson(text));
}

async function evaluateSubmission(params: unknown): Promise<{ feedback: string; score: number; isCorrect: boolean }> {
  const record = asRecord(params);
  if (!record) throw new HttpError(400, "params 형식이 올바르지 않습니다.");

  const problem = parseProblem(record.problem, 400, "problem 형식이 올바르지 않습니다.");
  const userCode = record.userCode;
  if (!isStringWithin(userCode, 100_000)) {
    throw new HttpError(400, "userCode가 올바르지 않습니다.");
  }

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

  const text = await generateContent({
    contents: prompt,
    systemInstruction: "당신은 엄격하지만 도움이 되는 코드 리뷰어입니다. 피드백은 한국어로 마크다운 형식을 사용하여 제공하세요.",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        feedback: { type: Type.STRING, description: "Markdown formatted detailed feedback in Korean" },
        score: { type: Type.INTEGER, description: "Score from 0 to 100" },
        isCorrect: { type: Type.BOOLEAN, description: "Whether the code functionally solves the problem" },
      },
      required: ["feedback", "score", "isCorrect"],
    },
  });

  return parseEvaluation(parseModelJson(text));
}

async function getExplanation(params: unknown): Promise<string> {
  const record = asRecord(params);
  if (!record) throw new HttpError(400, "params 형식이 올바르지 않습니다.");

  const topic = record.topic;
  const concept = record.concept;
  if (!isNonEmptyString(topic, 200)) throw new HttpError(400, "topic이 올바르지 않습니다.");
  if (!isNonEmptyString(concept, 500)) throw new HttpError(400, "concept이 올바르지 않습니다.");

  const text = await generateContent({
    contents: `"${topic}" (Deep Learning) 문맥에서 "${concept}" 개념을 한국어로 간결하고 명확하게 설명해주세요.`,
  });

  return text || "설명을 가져올 수 없습니다.";
}

export async function runGemini(body: unknown): Promise<unknown> {
  assertBodyWithinLimit(body);
  const record = asRecord(body);
  if (!record) throw new HttpError(400, "JSON 객체 본문이 필요합니다.");

  const action = record.action;
  if (typeof action !== "string" || !(ACTIONS as readonly string[]).includes(action)) {
    throw new HttpError(400, "action은 generateProblem, evaluateSubmission, getExplanation 중 하나여야 합니다.");
  }

  switch (action as Action) {
    case "generateProblem":
      return generateProblem(record.params);
    case "evaluateSubmission":
      return evaluateSubmission(record.params);
    case "getExplanation":
      return getExplanation(record.params);
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const contentLength = Number(headerValue(req.headers, "content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    res.status(413).json({ error: "요청 본문이 너무 큽니다." });
    return;
  }

  try {
    const result = await runGemini(req.body);
    res.status(200).json(result);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof HttpError ? error.message : "서버 오류가 발생했습니다.";
    if (!(error instanceof HttpError)) {
      console.error("Unhandled gemini api error:", error instanceof Error ? redact(error.message) : error);
    }
    res.status(status).json({ error: redact(message) });
  }
}
