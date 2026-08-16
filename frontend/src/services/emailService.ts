// src/services/emailService.ts
// Handles OTP emails (institution verification) and credential delivery emails.
// When no email API key is configured, all emails are logged to the browser console.
// To enable real emails: set NEXT_PUBLIC_RESEND_API_KEY in .env.local
// and create a Supabase Edge Function or Next.js API route.

export interface OTPPayload {
  email: string;
  otp: string;
  institutionName: string;
}

export interface CredentialEmailPayload {
  studentEmail: string;
  studentName: string;
  institutionName: string;
  credentialTitle: string;
  credentialType: string;
  issueDate: string;
  txHash: string;
  explorerLink?: string;
  verifyLink: string;
}

/** Generates a cryptographically random 6-digit OTP */
export function generateOTP(): string {
  const array = new Uint8Array(3);
  crypto.getRandomValues(array);
  const num = ((array[0] << 16) | (array[1] << 8) | array[2]) % 1000000;
  return num.toString().padStart(6, "0");
}

/** Sends OTP to institution's official email for ownership verification */
export async function sendOTPEmail(payload: OTPPayload): Promise<boolean> {
  const subject = `[CertifyVal] Verify your institution email — OTP: ${payload.otp}`;
  const body = `
Hello,

You are registering "${payload.institutionName}" on CertifyVal.

Your One-Time Password (OTP) is:

  ██████  ${payload.otp}  ██████

This OTP expires in 15 minutes.

If you did not request this, please ignore this email.

— CertifyVal Platform
  `.trim();

  // Attempt to call API route if available
  try {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const res = await fetch(`${baseUrl}/api/email/otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: payload.email, subject, body, otp: payload.otp }),
    });
    if (res.ok) return true;
  } catch {
    // API route not available — fall through to console log
  }

  // Graceful console fallback (development / no email key configured)
  console.log(
    `%c[CertifyVal Email — OTP]\n%cTo: ${payload.email}\nSubject: ${subject}\n\n${body}`,
    "color: #6366f1; font-weight: bold; font-size: 14px;",
    "color: #94a3b8;"
  );

  return true; // always succeed so the UI flow continues
}

/** Sends credential issuance notification email to student */
export async function sendCredentialIssuedEmail(payload: CredentialEmailPayload): Promise<boolean> {
  const subject = ` A New Credential Has Been Issued To You by ${payload.institutionName}`;
  const body = `
Hello ${payload.studentName || "there"},

${payload.institutionName} has issued you a new credential on CertifyVal!

  Credential: ${payload.credentialTitle}
  Type:       ${payload.credentialType}
  Issued On:  ${payload.issueDate}

  Transaction Hash: ${payload.txHash}
  ${payload.explorerLink ? `Explorer:   ${payload.explorerLink}` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Claim your credential:
  ${payload.verifyLink}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Log in to CertifyVal to review and claim this credential in your Credential Passport.

— CertifyVal Platform
  `.trim();

  // Attempt API route
  try {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const res = await fetch(`${baseUrl}/api/email/credential`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: payload.studentEmail, subject, body }),
    });
    if (res.ok) return true;
  } catch {
    // fall through
  }

  console.log(
    `%c[CertifyVal Email — Credential Issued]\n%cTo: ${payload.studentEmail}\nSubject: ${subject}\n\n${body}`,
    "color: #10b981; font-weight: bold; font-size: 14px;",
    "color: #94a3b8;"
  );

  return true;
}

export async function sendInstitutionApprovedEmail(email: string, institutionName: string): Promise<boolean> {
  const subject = `[CertifyVal] Your Institution has been Approved!`;
  const body = `
Hello,

Great news! Your institution "${institutionName}" has been verified and approved on CertifyVal.
You can now start issuing official credentials on the Stellar network.

Log in to your Institution Dashboard to get started.

— CertifyVal Platform
  `.trim();

  try {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const res = await fetch(`${baseUrl}/api/email/otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: email, subject, body }),
    });
    if (res.ok) return true;
  } catch {}
  return true;
}

export async function sendInstitutionRejectedEmail(email: string, institutionName: string): Promise<boolean> {
  const subject = `[CertifyVal] Update on your Institution Registration`;
  const body = `
Hello,

We have reviewed your registration for "${institutionName}". Unfortunately, your institution has not been approved at this time.

Please contact our support team for more details or to appeal this decision.

— CertifyVal Platform
  `.trim();

  try {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const res = await fetch(`${baseUrl}/api/email/otp`, { // re-using the generic OTP endpoint which just sends email via nodemailer
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: email, subject, body }),
    });
    if (res.ok) return true;
  } catch {}
  return true;
}
