// src/services/ai/classificationEngine.ts
// AI Credential Classification Engine — Pre-upload document analysis
// Uses Groq AI to classify documents and validate against user selection

import { getGroqClient } from './groqService';
import type {
  AIClassificationResult,
  CredentialCategory,
  CredentialType,
} from '@/lib/types';

// ── Prompt template ──────────────────────────────────────────────────────────
function buildClassificationPrompt(
  extractedText: string,
  userSelectedCategory: CredentialCategory,
  userSelectedType: CredentialType
): string {
  return `You are a credential validation AI for CertifyVal, a decentralized credential platform.

Analyze the following document text and determine its credential category and type.

DOCUMENT TEXT:
---
${extractedText.slice(0, 3000)}
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
}

// ── Text extraction from file ─────────────────────────────────────────────────
export async function extractTextFromFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    if (file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || '');
      reader.readAsText(file);
      return;
    }

    if (file.type.startsWith('image/')) {
      resolve(`[IMAGE FILE: ${file.name}] — Image credential document. Size: ${Math.round(file.size / 1024)}KB`);
      return;
    }

    if (file.type === 'application/pdf') {
      resolve(`[PDF FILE: ${file.name}] — PDF credential document. Size: ${Math.round(file.size / 1024)}KB`);
      return;
    }

    if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
      resolve(`[WORD FILE: ${file.name}] — Word document credential. Size: ${Math.round(file.size / 1024)}KB`);
      return;
    }

    resolve(`[FILE: ${file.name}] — Document type: ${file.type}. Size: ${Math.round(file.size / 1024)}KB`);
  });
}

// ── URL-based credential analysis ─────────────────────────────────────────────
export function extractTextFromUrl(url: string, credentialType: CredentialType): string {
  const domain = (() => {
    try { return new URL(url).hostname; } catch { return url; }
  })();

  return `[URL CREDENTIAL: ${url}]
Domain: ${domain}
Credential Type: ${credentialType}
Platform detected: ${
    domain.includes('github') ? 'GitHub' :
    domain.includes('linkedin') ? 'LinkedIn' :
    domain.includes('coursera') ? 'Coursera' :
    domain.includes('udemy') ? 'Udemy' :
    domain.includes('google') ? 'Google' :
    domain.includes('microsoft') ? 'Microsoft' :
    'External Platform'
  }`;
}

// ── Main classification function ──────────────────────────────────────────────
import { classifyCredentialWithAI } from './groqService';

export async function classifyCredential(
  content: string,
  userSelectedCategory: CredentialCategory,
  userSelectedType: CredentialType
): Promise<AIClassificationResult> {
  return classifyCredentialWithAI(content, userSelectedCategory, userSelectedType);
}

// ── Heuristic pre-checks (before calling AI) ──────────────────────────────────
export function runHeuristicCheck(file: File): {
  passed: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // File size check
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > 50) {
    warnings.push('File is unusually large (> 50MB). Please verify this is the correct document.');
  }
  if (file.size < 1000) {
    warnings.push('File is extremely small. This may be an empty or template document.');
  }

  // Suspicious names
  const suspiciousNames = ['template', 'sample', 'fake', 'test', 'demo', 'example'];
  if (suspiciousNames.some(s => file.name.toLowerCase().includes(s))) {
    warnings.push(`File name contains suspicious keyword: "${file.name}"`);
  }

  return { passed: warnings.length === 0, warnings };
}
