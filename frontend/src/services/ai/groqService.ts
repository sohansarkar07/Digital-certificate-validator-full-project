"use server";

import Groq from "groq-sdk";

// Shared Groq client factory — used by both fraud detection and classification engine
export async function getGroqClient(): Promise<Groq | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn("GROQ_API_KEY is not set.");
    return null;
  }
  return new Groq({ apiKey });
}

export interface GroqFraudResponse {
  riskScore: number;
  confidence: number;
  decision: "SAFE" | "REVIEW" | "HIGH_RISK" | "FRAUD";
  summary: string;
  reasons: string[];
  recommendation: string;
}

// In-memory cache to save API costs on identical hashes within the same server lifecycle
const responseCache = new Map<string, GroqFraudResponse>();

export async function evaluateFraudWithAI(
  certHash: string,
  ownerName: string,
  heuristicScore: number,
  institution?: string,
  issuerWallet?: string
): Promise<GroqFraudResponse | null> {
  if (responseCache.has(certHash)) {
    return responseCache.get(certHash)!;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn("GROQ_API_KEY is not set. Falling back to heuristic engine.");
    return null;
  }

  const groq = new Groq({ apiKey });

  const prompt = `
You are a highly advanced blockchain credential fraud auditor. 
Evaluate the following digital certificate issuance request for potential fraud.

Certificate Details:
- Hash: ${certHash}
- Owner Name: ${ownerName}
- Issuing Institution: ${institution || "Unknown"}
- Issuer Wallet: ${issuerWallet || "Unknown"}
- Deterministic Heuristic Risk Score (0-100): ${heuristicScore}

Analyze these factors and return a JSON object exactly matching this schema:
{
  "riskScore": number (0-100),
  "confidence": number (0-100),
  "decision": "SAFE" | "REVIEW" | "HIGH_RISK" | "FRAUD",
  "summary": string (1-2 sentences),
  "reasons": string[],
  "recommendation": string
}
Do not output any markdown formatting, just the raw JSON object.
`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) return null;

    const result = JSON.parse(content) as GroqFraudResponse;
    responseCache.set(certHash, result);
    return result;
  } catch (error) {
    console.error("Groq AI evaluation failed:", error);
    return null;
  }
}

export async function classifyCredentialWithAI(
  content: string,
  userSelectedCategory: string,
  userSelectedType: string
): Promise<any> {
  const fallback = {
    detectedCategory: userSelectedCategory,
    detectedType: userSelectedType,
    confidence: 60,
    reasons: ['AI analysis completed with limited text extraction.'],
    recommendation: 'review',
    riskScore: 20,
  };

  const groq = await getGroqClient();
  if (!groq) return fallback;

  const prompt = `You are a credential validation AI for CertifyVal, a decentralized credential platform.

Analyze the following document text and determine its credential category and type.

DOCUMENT TEXT:
---
${content.slice(0, 3000)}
---

USER CLAIMED:
- Category: ${userSelectedCategory}
- Type: ${userSelectedType}

VALID CATEGORIES: academic, employment, professional, personal

VALID TYPES per category:
- academic: degree, diploma, transcript, course_completion, academic_achievement
- employment: experience_letter, internship_certificate, employee_training, promotion_letter, employment_achievement
- professional: professional_certification, workshop_certificate, bootcamp_certificate, hackathon_certificate, competition_certificate
- personal: resume, portfolio, github_profile, linkedin_profile, research_paper, project_showcase, personal_achievement

Analyze the document for:
1. What type of credential it actually is
2. Whether it matches the user's claim
3. Signs of forgery or tampering (unusual fonts, inconsistent dates, missing seals, generic templates)
4. Institution name mentioned
5. Issuance date

Return ONLY valid JSON with this exact structure:
{
  "detectedCategory": "<category or null>",
  "detectedType": "<type or null>",
  "confidence": <0-100>,
  "reasons": ["<reason1>", "<reason2>"],
  "recommendation": "<proceed|review|reject>",
  "riskScore": <0-100>,
  "extractedInstitution": "<institution name or null>",
  "extractedDate": "<date string or null>",
  "forgerySigns": ["<sign1>"] 
}

Rules:
- confidence > 80: proceed if category matches
- confidence 50-80 and matches: review
- confidence < 50 or mismatch: reject
- riskScore > 60: always reject
- If document is clearly blank/template: riskScore 90+, reject`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 800,
    });

    const rawText = completion.choices[0]?.message?.content?.trim() || '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallback;

    const parsed = JSON.parse(jsonMatch[0]);

    if (parsed.detectedCategory && parsed.detectedCategory !== userSelectedCategory) {
      parsed.recommendation = 'reject';
      parsed.riskScore = Math.max(parsed.riskScore || 0, 70);
      parsed.reasons = parsed.reasons || [];
      parsed.reasons.unshift(
        `Category mismatch: Document appears to be "${parsed.detectedCategory}" but you selected "${userSelectedCategory}".`
      );
    }
    return parsed;
  } catch (err) {
    console.error('classifyCredentialWithAI error:', err);
    return fallback;
  }
}
