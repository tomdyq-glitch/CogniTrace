import { GoogleGenAI, Type } from "@google/genai";
import { Subject, Question } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAdaptiveQuestion = async (
  subject: Subject,
  currentMastery: number,
  targetDifficulty: number
): Promise<Question> => {
  const model = "gemini-2.5-flash";

  const prompt = `
    请为正在学习 "${subject}" 的学生生成一道单项选择题。
    
    上下文信息:
    - 学生对该知识点的当前估计掌握度为 ${(currentMastery * 100).toFixed(1)}%。
    - 本题的目标难度等级应为 ${targetDifficulty} (范围 1-10)。
    
    生成要求:
    1. 题目内容必须符合该知识点且难度适宜（1为最基础概念，10为高难度综合应用）。
    2. 提供 4 个选项。
    3. 提供正确答案的索引 (0-3)。
    4. 提供简短的教育性"解析" (explanation)，解释解题思路。
    5. 提供 "reasoningForSelection" (推荐理由)：用一句话解释为什么根据学生的当前状态（掌握度 ${(currentMastery * 100).toFixed(1)}%）选择了这个难度的题目（例如：“因掌握度较低，侧重基础概念巩固” 或 “掌握度较高，提供进阶挑战以探测能力边界”）。
    6. 输出语言必须为简体中文。
  `;

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "题目文本" },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "4个选项的数组",
          },
          correctIndex: { type: Type.INTEGER, description: "正确选项的索引 (0-3)" },
          explanation: { type: Type.STRING, description: "答案解析" },
          reasoningForSelection: { type: Type.STRING, description: "选择此难度题目的教学理由" },
        },
        required: ["text", "options", "correctIndex", "explanation", "reasoningForSelection"],
      },
    },
  });

  if (!response.text) {
    throw new Error("Failed to generate question");
  }

  const data = JSON.parse(response.text);

  return {
    id: crypto.randomUUID(),
    subject,
    difficulty: targetDifficulty,
    ...data,
  };
};