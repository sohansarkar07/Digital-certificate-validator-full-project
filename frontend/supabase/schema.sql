-- ============================================================
-- CertifyVal — Supabase Database Schema
-- Run this ENTIRE script in the Supabase SQL Editor:
--   supabase.com → your project → SQL Editor → New query → Paste → Run
-- ============================================================

-- Institutions table
CREATE TABLE IF NOT EXISTS institutions (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  country             TEXT NOT NULL,
  wallet_address      TEXT NOT NULL,
  website             TEXT,
  type                TEXT DEFAULT 'University',
  status              TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  trust_score         INTEGER DEFAULT 70,
  verification_badge  BOOLEAN DEFAULT FALSE,
  certs_issued        INTEGER DEFAULT 0,
  verifications_count INTEGER DEFAULT 0,
  disputes            INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Credential Passport table (per wallet)
CREATE TABLE IF NOT EXISTS credentials (
  id             TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  title          TEXT NOT NULL,
  institution    TEXT NOT NULL,
  type           TEXT NOT NULL,
  date           TEXT NOT NULL,
  cert_hash      TEXT,
  skills         TEXT[],
  description    TEXT,
  grade          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Certificate Issuance History
CREATE TABLE IF NOT EXISTS issuance_history (
  id             BIGSERIAL PRIMARY KEY,
  hash           TEXT NOT NULL UNIQUE,
  owner          TEXT NOT NULL,
  issuer_wallet  TEXT,
  issued_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Verification Records
CREATE TABLE IF NOT EXISTS verifications (
  id              BIGSERIAL PRIMARY KEY,
  hash            TEXT NOT NULL,
  verifier_wallet TEXT,
  status          TEXT DEFAULT 'valid',
  verified_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Stake Bonds
CREATE TABLE IF NOT EXISTS bonds (
  id          TEXT PRIMARY KEY,
  cert_hash   TEXT NOT NULL,
  institution TEXT,
  amount_xlm  NUMERIC DEFAULT 1,
  status      TEXT DEFAULT 'locked' CHECK (status IN ('locked','released','slashed')),
  locked_at   TIMESTAMPTZ DEFAULT NOW(),
  released_at TIMESTAMPTZ
);

-- User Feedback
CREATE TABLE IF NOT EXISTS feedback (
  id             TEXT PRIMARY KEY,
  wallet_address TEXT,
  role           TEXT NOT NULL,
  rating         INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  category       TEXT NOT NULL,
  message        TEXT NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Live Blockchain Activity Feed
CREATE TABLE IF NOT EXISTS activity_feed (
  id         BIGSERIAL PRIMARY KEY,
  action     TEXT NOT NULL,
  hash       TEXT NOT NULL,
  wallet     TEXT,
  color      TEXT DEFAULT 'text-success',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security (public access — wallet-authenticated app)
-- ============================================================
ALTER TABLE institutions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials    ENABLE ROW LEVEL SECURITY;
ALTER TABLE issuance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonds          ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback       ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed  ENABLE ROW LEVEL SECURITY;

-- Institutions policies
CREATE POLICY "public_read_institutions"   ON institutions FOR SELECT USING (true);
CREATE POLICY "public_insert_institutions" ON institutions FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_institutions" ON institutions FOR UPDATE USING (true);

-- Credentials policies
CREATE POLICY "public_read_credentials"   ON credentials FOR SELECT USING (true);
CREATE POLICY "public_insert_credentials" ON credentials FOR INSERT WITH CHECK (true);
CREATE POLICY "public_delete_credentials" ON credentials FOR DELETE USING (true);

-- Issuance history policies
CREATE POLICY "public_read_issuance"   ON issuance_history FOR SELECT USING (true);
CREATE POLICY "public_insert_issuance" ON issuance_history FOR INSERT WITH CHECK (true);

-- Verifications policies
CREATE POLICY "public_read_verifications"   ON verifications FOR SELECT USING (true);
CREATE POLICY "public_insert_verifications" ON verifications FOR INSERT WITH CHECK (true);

-- Bonds policies
CREATE POLICY "public_read_bonds"   ON bonds FOR SELECT USING (true);
CREATE POLICY "public_insert_bonds" ON bonds FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_bonds" ON bonds FOR UPDATE USING (true);

-- Feedback policies
CREATE POLICY "public_read_feedback"   ON feedback FOR SELECT USING (true);
CREATE POLICY "public_insert_feedback" ON feedback FOR INSERT WITH CHECK (true);

-- Activity feed policies
CREATE POLICY "public_read_activity"   ON activity_feed FOR SELECT USING (true);
CREATE POLICY "public_insert_activity" ON activity_feed FOR INSERT WITH CHECK (true);
