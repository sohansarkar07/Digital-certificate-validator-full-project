-- ============================================================
-- CertifyVal — Migration v3: Credential Delivery Workflow
-- Run this in Supabase SQL Editor → New Query → Paste → Run
-- ============================================================

-- 1. Add extended columns to institutions table
ALTER TABLE institutions
  ADD COLUMN IF NOT EXISTS official_email         TEXT,
  ADD COLUMN IF NOT EXISTS email_verified         BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_verification_status TEXT DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS registration_number    TEXT,
  ADD COLUMN IF NOT EXISTS logo_url               TEXT,
  ADD COLUMN IF NOT EXISTS description            TEXT,
  ADD COLUMN IF NOT EXISTS institution_type       TEXT;

-- 2. Add email column to user_profiles (for pending claim matching)
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

-- 4. Email verification tokens table
CREATE TABLE IF NOT EXISTS email_verifications (
  id          TEXT PRIMARY KEY,
  email       TEXT NOT NULL,
  otp         TEXT NOT NULL,
  purpose     TEXT NOT NULL DEFAULT 'institution_registration',
  expires_at  TIMESTAMPTZ NOT NULL,
  verified    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Pending credential claims
CREATE TABLE IF NOT EXISTS pending_claims (
  id                TEXT PRIMARY KEY,
  student_email     TEXT NOT NULL,
  student_wallet    TEXT,
  institution_id    TEXT,
  institution_name  TEXT NOT NULL,
  credential_title  TEXT NOT NULL,
  credential_type   TEXT NOT NULL,
  credential_category TEXT,
  issue_date        TEXT NOT NULL,
  tx_hash           TEXT,
  cert_hash         TEXT,
  explorer_link     TEXT,
  status            TEXT DEFAULT 'pending',
  claimed_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 6. In-app notification center
CREATE TABLE IF NOT EXISTS notifications (
  id            TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  type          TEXT NOT NULL,
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  data          JSONB,
  read          BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Full audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id            BIGSERIAL PRIMARY KEY,
  actor_wallet  TEXT,
  actor_role    TEXT,
  action        TEXT NOT NULL,
  target_id     TEXT,
  credential_id TEXT,
  tx_hash       TEXT,
  details       JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_claims      ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log           ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_email_verif"   ON email_verifications FOR SELECT USING (true);
CREATE POLICY "public_insert_email_verif" ON email_verifications FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_email_verif" ON email_verifications FOR UPDATE USING (true);

CREATE POLICY "public_read_pending_claims"   ON pending_claims FOR SELECT USING (true);
CREATE POLICY "public_insert_pending_claims" ON pending_claims FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_pending_claims" ON pending_claims FOR UPDATE USING (true);

CREATE POLICY "public_read_notifications"   ON notifications FOR SELECT USING (true);
CREATE POLICY "public_insert_notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_notifications" ON notifications FOR UPDATE USING (true);

CREATE POLICY "public_read_audit_log"   ON audit_log FOR SELECT USING (true);
CREATE POLICY "public_insert_audit_log" ON audit_log FOR INSERT WITH CHECK (true);

-- user_profiles table (if not already created from earlier migrations)
CREATE TABLE IF NOT EXISTS user_profiles (
  wallet_address TEXT PRIMARY KEY,
  role           TEXT NOT NULL,
  display_name   TEXT,
  avatar_url     TEXT,
  email          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
