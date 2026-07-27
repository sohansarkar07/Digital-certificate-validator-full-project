import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// ── In-memory rate limiter ────────────────────────────────────────────────────
// 5 OTP emails per IP address per 10 minutes
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    // New window
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetInMs: RATE_LIMIT_WINDOW_MS };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const resetInMs = RATE_LIMIT_WINDOW_MS - (now - entry.windowStart);
    return { allowed: false, remaining: 0, resetInMs };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX - entry.count,
    resetInMs: RATE_LIMIT_WINDOW_MS - (now - entry.windowStart),
  };
}

// Periodically clean up old entries to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW_MS);

// ── Route Handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  // 1. Rate limit check (DISABLED temporarily for testing)
  // const ip = getClientIp(request);
  // const { allowed, remaining, resetInMs } = checkRateLimit(ip);

  // if (!allowed) {
  //   const resetInSeconds = Math.ceil(resetInMs / 1000);
  //   return NextResponse.json(
  //     { error: `Too many requests. Please wait ${resetInSeconds} seconds before requesting another OTP.` },
  //     {
  //       status: 429,
  //       headers: {
  //         'Retry-After': String(resetInSeconds),
  //         'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
  //         'X-RateLimit-Remaining': '0',
  //       },
  //     }
  //   );
  // }

  try {
    const body = await request.json();
    const { to, subject, body: emailBody } = body;

    // 2. Input validation
    if (!to || !subject || !emailBody) {
      return NextResponse.json({ error: 'Missing required fields: to, subject, body' }, { status: 400 });
    }
    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // 3. SMTP check
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
      return NextResponse.json({ error: 'SMTP credentials are not configured' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"CertifyVal" <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      text: emailBody,
    };

    const info = await transporter.sendMail(mailOptions);
    return NextResponse.json(
      { data: info },
      { headers: { 'X-RateLimit-Remaining': '999' } }
    );
  } catch (error) {
    console.error('Failed to send email via Nodemailer:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}

