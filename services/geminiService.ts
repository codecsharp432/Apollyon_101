import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Question, Answer, PersonalityReport } from "../types";

// Helper to ensure API Key exists
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY not found in environment.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateAssessmentQuestions = async (count: number): Promise<Question[]> => {
  const ai = getAIClient();
  
  const systemInstruction = `
    You are PSYCHE-7, an advanced psychological assessment engine designed to generate a unique set of multiple-choice questions for a classified evaluation system.

    OBJECTIVES:
    1. Generate ${count} distinct, high-quality multiple-choice questions.
    2. Ensure balanced coverage across these dimensions: Emotional Stability, Empathy, Autonomy, Stress Resilience, Risk Tolerance, Social Dependence, Control/Dominance, Analytical vs Emotional Decision-Making, Moral Flexibility.
    3. Questions should be phrased formally, clinically, or slightly abstractly. The tone should be serious and investigative.
    4. Provide 4 options for each question. No answer should be objectively correct or incorrect.
    5. Ensure variety to avoid repetition.
    6. Ensure the questions feel like a "psychological test" or "security clearance evaluation".
  `;

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.INTEGER },
        text: { type: Type.STRING },
        dimension: { type: Type.STRING },
        options: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
      required: ["id", "text", "dimension", "options"],
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: `Generate ${count} psychological assessment questions.`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const rawText = response.text;
    if (!rawText) throw new Error("No data received from construct.");
    
    return JSON.parse(rawText) as Question[];
  } catch (error) {
    console.error("Generation Protocol Failed:", error);
    throw error;
  }
};

export const analyzePersonality = async (answers: Answer[], username: string): Promise<PersonalityReport> => {
  const ai = getAIClient();

  const systemInstruction = `
    You are PSYCHE-7, a classified psychological profiler and evaluation engine.

    YOUR TASK:
    Analyze the provided question/answer pairs to build a comprehensive personality dossier.
    
    EVALUATION PROTOCOLS:
    1. Evaluate user responses across hidden personality axes including: Emotional stability, Empathy, Autonomy, Stress resilience, Risk tolerance, Social dependence, Control/Dominance, Analytical vs Emotional decision-making, and Moral flexibility.
    2. Assign weighted values to each answer choice internally to derive traits.
    3. Track response behavior, including the 'timeTaken' (in milliseconds) for each answer. 
       - Very fast answers may indicate impulsivity or high certainty.
       - Slow answers may indicate hesitation, calculation, or dishonesty.
       - Inconsistent timing may suggest instability.
    4. Compute a final 'stability score' (1-100). 100 = Optimal Stability/Ideal Agent. 1 = Highly Volatile/Risk.
    5. Classify the user into an archetype derived from axis combinations.
    
    REPORT FORMAT:
    - Tone: Formal, Analytical, Clinical, "Classified Government Dossier".
    - Avoid casual language, humor, or emotional phrasing.
    - Present findings as analytical observations.
    
    OUTPUT SCHEMA REQUIREMENTS:
    - 'score': The stability score (1-100).
    - 'dominantTraits': List of 3-5 key observed traits.
    - 'strengths': List of psychological assets.
    - 'weaknesses': List of vulnerabilities.
    - 'behavioralTendencies': Observations on decision-making patterns.
    - 'riskIndicators': Cautionary notes based on volatile or concerning patterns.
    - 'confidenceScore': A metric (1-100) indicating how reliable this assessment is based on answer consistency and timing.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.INTEGER, description: "Psychological stability score 1-100" },
      dominantTraits: { type: Type.ARRAY, items: { type: Type.STRING } },
      strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
      weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
      behavioralTendencies: { type: Type.ARRAY, items: { type: Type.STRING } },
      riskIndicators: { type: Type.ARRAY, items: { type: Type.STRING } },
      confidenceScore: { type: Type.INTEGER, description: "Confidence in analysis 1-100" },
    },
    required: ["score", "dominantTraits", "strengths", "weaknesses", "behavioralTendencies", "riskIndicators", "confidenceScore"]
  };

  // Prepare data for the model
  // We include timeTaken to allow the model to analyze response behavior
  const inputData = JSON.stringify(answers.map(a => ({
    dimension: a.dimension,
    question: a.questionText,
    choice: a.selectedOption,
    timeTakenMs: a.timeTaken
  })));

  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest", // Use Flash Latest for stability
      contents: `Analyze this subject data: ${inputData}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const rawText = response.text;
    if (!rawText) throw new Error("Analysis Protocol Failed.");

    const analysis = JSON.parse(rawText);

    return {
      ...analysis,
      subjectName: username,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Analysis Protocol Failed:", error);
    throw error;
  }
};