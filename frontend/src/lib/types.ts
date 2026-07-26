// src/lib/types.ts
// Central type definitions for Universal Decentralized Credential Infrastructure

// ── User Roles ──────────────────────────────────────────────────────────────
export type UserRole = 'student' | 'employer' | 'institution' | 'admin' | 'owner';

// ── Institution Types ────────────────────────────────────────────────────────
export type InstitutionType =
  | 'university'
  | 'college'
  | 'school'
  | 'company'
  | 'government'
  | 'training'
  | 'bootcamp'
  | 'certification'
  | 'ngo'
  | 'research';

export const INSTITUTION_TYPE_LABELS: Record<InstitutionType, string> = {
  university: 'University',
  college: 'College',
  school: 'School',
  company: 'Company',
  government: 'Government Department',
  training: 'Training Institute',
  bootcamp: 'Bootcamp',
  certification: 'Certification Body',
  ngo: 'NGO',
  research: 'Research Organization',
};

// ── Credential Categories ────────────────────────────────────────────────────
export type CredentialCategory = 'academic' | 'employment' | 'professional' | 'personal';

export const CREDENTIAL_CATEGORY_LABELS: Record<CredentialCategory, string> = {
  academic: 'Academic',
  employment: 'Employment',
  professional: 'Professional',
  personal: 'Personal',
};

// ── Credential Types ─────────────────────────────────────────────────────────
export type AcademicCredentialType =
  | 'degree'
  | 'diploma'
  | 'transcript'
  | 'course_completion'
  | 'academic_achievement';

export type EmploymentCredentialType =
  | 'experience_letter'
  | 'internship_certificate'
  | 'employee_training'
  | 'promotion_letter'
  | 'employment_achievement';

export type ProfessionalCredentialType =
  | 'professional_certification'
  | 'workshop_certificate'
  | 'bootcamp_certificate'
  | 'hackathon_certificate'
  | 'competition_certificate';

export type PersonalCredentialType =
  | 'resume'
  | 'portfolio'
  | 'github_profile'
  | 'linkedin_profile'
  | 'research_paper'
  | 'project_showcase'
  | 'personal_achievement';

export type CredentialType =
  | AcademicCredentialType
  | EmploymentCredentialType
  | ProfessionalCredentialType
  | PersonalCredentialType;

export const CREDENTIAL_TYPE_LABELS: Record<CredentialType, string> = {
  // Academic
  degree: 'Degree',
  diploma: 'Diploma',
  transcript: 'Transcript',
  course_completion: 'Course Completion',
  academic_achievement: 'Academic Achievement',
  // Employment
  experience_letter: 'Experience Letter',
  internship_certificate: 'Internship Certificate',
  employee_training: 'Employee Training',
  promotion_letter: 'Promotion Letter',
  employment_achievement: 'Employment Achievement',
  // Professional
  professional_certification: 'Professional Certification',
  workshop_certificate: 'Workshop Certificate',
  bootcamp_certificate: 'Bootcamp Certificate',
  hackathon_certificate: 'Hackathon Certificate',
  competition_certificate: 'Competition Certificate',
  // Personal
  resume: 'Resume',
  portfolio: 'Portfolio',
  github_profile: 'GitHub Profile',
  linkedin_profile: 'LinkedIn Profile',
  research_paper: 'Research Paper',
  project_showcase: 'Project Showcase',
  personal_achievement: 'Personal Achievement',
};

export const CREDENTIAL_TYPES_BY_CATEGORY: Record<CredentialCategory, CredentialType[]> = {
  academic: ['degree', 'diploma', 'transcript', 'course_completion', 'academic_achievement'],
  employment: ['experience_letter', 'internship_certificate', 'employee_training', 'promotion_letter', 'employment_achievement'],
  professional: ['professional_certification', 'workshop_certificate', 'bootcamp_certificate', 'hackathon_certificate', 'competition_certificate'],
  personal: ['resume', 'portfolio', 'github_profile', 'linkedin_profile', 'research_paper', 'project_showcase', 'personal_achievement'],
};

// ── Evidence Types ───────────────────────────────────────────────────────────
export type EvidenceType = 'pdf' | 'image' | 'word' | 'url' | 'video' | 'zip';

export const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  pdf: 'PDF Document',
  image: 'Image (JPG/PNG)',
  word: 'Word Document',
  url: 'URL / Link',
  video: 'Video',
  zip: 'ZIP Archive',
};

export const EVIDENCE_TYPES_BY_CREDENTIAL: Record<CredentialType, EvidenceType[]> = {
  degree: ['pdf', 'image'],
  diploma: ['pdf', 'image'],
  transcript: ['pdf'],
  course_completion: ['pdf', 'image'],
  academic_achievement: ['pdf', 'image'],
  experience_letter: ['pdf', 'image'],
  internship_certificate: ['pdf', 'image'],
  employee_training: ['pdf', 'image'],
  promotion_letter: ['pdf'],
  employment_achievement: ['pdf', 'image'],
  professional_certification: ['pdf', 'image', 'url'],
  workshop_certificate: ['pdf', 'image'],
  bootcamp_certificate: ['pdf', 'image', 'url'],
  hackathon_certificate: ['pdf', 'image', 'url'],
  competition_certificate: ['pdf', 'image'],
  resume: ['pdf', 'word'],
  portfolio: ['url'],
  github_profile: ['url'],
  linkedin_profile: ['url'],
  research_paper: ['pdf', 'url'],
  project_showcase: ['url', 'zip', 'pdf', 'video'],
  personal_achievement: ['pdf', 'image', 'url'],
};

// ── Upload Types ─────────────────────────────────────────────────────────────
export type UploadType = 'official' | 'imported' | 'self_published';

export const UPLOAD_TYPE_LABELS: Record<UploadType, string> = {
  official: 'Blockchain Issued',
  imported: 'Imported External',
  self_published: 'Self Published',
};

// ── External Source Platforms ────────────────────────────────────────────────
export type ExternalPlatform =
  | 'coursera'
  | 'udemy'
  | 'rise_in'
  | 'google'
  | 'microsoft'
  | 'aws'
  | 'linkedin_learning'
  | 'edx'
  | 'other';

export const EXTERNAL_PLATFORM_LABELS: Record<ExternalPlatform, string> = {
  coursera: 'Coursera',
  udemy: 'Udemy',
  rise_in: 'Rise In',
  google: 'Google',
  microsoft: 'Microsoft',
  aws: 'AWS',
  linkedin_learning: 'LinkedIn Learning',
  edx: 'edX',
  other: 'Other Platform',
};

// ── AI Classification Output ─────────────────────────────────────────────────
export interface AIClassificationResult {
  detectedCategory: CredentialCategory | null;
  detectedType: CredentialType | null;
  confidence: number; // 0-100
  reasons: string[];
  recommendation: 'proceed' | 'review' | 'reject';
  riskScore: number; // 0-100
  extractedInstitution?: string;
  extractedDate?: string;
  forgerySigns?: string[];
}

// ── User Profile ─────────────────────────────────────────────────────────────
export interface UserProfile {
  wallet_address: string;
  role: UserRole;
  display_name?: string;
  avatar_url?: string;
  created_at?: string;
}

// ── Extended Credential ──────────────────────────────────────────────────────
export interface ExtendedCredential {
  id: string;
  wallet_address: string;
  title: string;
  institution: string;
  type: string;
  date: string;
  cert_hash?: string;
  skills?: string[];
  description?: string;
  grade?: string;
  created_at?: string;
  // New fields
  category?: CredentialCategory;
  credential_type?: CredentialType;
  evidence_type?: EvidenceType;
  upload_type?: UploadType;
  source_platform?: ExternalPlatform;
  is_public?: boolean;
  share_token?: string;
  ai_risk_score?: number;
  ai_classification?: string;
  file_url?: string;
}

// ── Extended Institution ─────────────────────────────────────────────────────
export interface ExtendedInstitution {
  id: string;
  name: string;
  country: string;
  wallet_address: string;
  website?: string;
  type?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  trust_score?: number;
  verification_badge?: boolean;
  certs_issued?: number;
  verifications_count?: number;
  disputes?: number;
  created_at?: string;
  // New fields
  institution_type?: InstitutionType;
  registration_number?: string;
  logo_url?: string;
  description?: string;
  official_email?: string;
  global_rank?: number;
  suspended_at?: string;
  suspension_reason?: string;
}

// ── Verification Report ──────────────────────────────────────────────────────
export interface VerificationReport {
  id: string;
  employer_wallet: string;
  candidate_wallet: string;
  credential_ids: string[];
  generated_at: string;
  report_data: {
    credentials: ExtendedCredential[];
    candidate_name?: string;
    total_credentials: number;
    verified_count: number;
    institution_trust_avg: number;
  };
}

// ── Employer Bookmark ────────────────────────────────────────────────────────
export interface EmployerBookmark {
  id: string;
  employer_wallet: string;
  candidate_wallet: string;
  notes?: string;
  created_at?: string;
}

// ── Admin Audit Log ──────────────────────────────────────────────────────────
export interface AdminAuditEntry {
  id: string;
  admin_wallet: string;
  action: string;
  target_id?: string;
  details?: Record<string, unknown>;
  created_at?: string;
}
