// src/lib/credentialPermissions.ts
// Role + Institution type permission matrix for credential issuance

import type { UserRole, InstitutionType, CredentialType, CredentialCategory } from './types';

// ── Which credential types can each institution type issue ───────────────────
export const INSTITUTION_CAN_ISSUE: Record<InstitutionType, CredentialType[]> = {
  university: [
    'degree', 'diploma', 'transcript', 'course_completion', 'academic_achievement',
    'research_paper',
  ],
  college: [
    'diploma', 'transcript', 'course_completion', 'academic_achievement',
  ],
  school: [
    'course_completion', 'academic_achievement',
  ],
  company: [
    'experience_letter', 'internship_certificate', 'employee_training',
    'promotion_letter', 'employment_achievement',
  ],
  government: [
    'professional_certification', 'experience_letter', 'employment_achievement',
  ],
  training: [
    'course_completion', 'workshop_certificate', 'professional_certification',
    'employee_training',
  ],
  bootcamp: [
    'bootcamp_certificate', 'course_completion', 'workshop_certificate',
  ],
  certification: [
    'professional_certification', 'workshop_certificate', 'competition_certificate',
  ],
  ngo: [
    'workshop_certificate', 'course_completion', 'employment_achievement',
    'hackathon_certificate',
  ],
  research: [
    'research_paper', 'academic_achievement', 'professional_certification',
  ],
};

// ── Which credential types students can self-upload (personal vault) ─────────
export const STUDENT_CAN_UPLOAD: CredentialType[] = [
  'resume', 'portfolio', 'github_profile', 'linkedin_profile',
  'research_paper', 'project_showcase', 'personal_achievement',
  // Students can also import external certs (treated as "imported" upload type)
  'course_completion', 'professional_certification', 'workshop_certificate',
  'bootcamp_certificate', 'hackathon_certificate', 'competition_certificate',
];

// ── Which credential types employers can self-upload ─────────────────────────
export const EMPLOYER_CAN_UPLOAD: CredentialType[] = [
  'resume', 'portfolio', 'linkedin_profile',
];

// ── Check if a role + institution type combination can issue a credential ─────
export function canIssue(
  role: UserRole,
  institutionType: InstitutionType | null,
  credentialType: CredentialType
): boolean {
  // Students cannot issue official credentials
  if (role === 'student') return false;

  // Employers can only issue employment credentials IF they are also an approved company
  if (role === 'employer') {
    return institutionType === 'company' &&
      INSTITUTION_CAN_ISSUE['company'].includes(credentialType);
  }

  // Institutions issue based on their type
  if (role === 'institution' && institutionType) {
    return INSTITUTION_CAN_ISSUE[institutionType]?.includes(credentialType) ?? false;
  }

  // Admins and owners can issue any type for testing
  if (role === 'admin' || role === 'owner') return true;

  return false;
}

// ── Check if a user can upload a personal document ──────────────────────────
export function canSelfUpload(role: UserRole, credentialType: CredentialType): boolean {
  if (role === 'student') return STUDENT_CAN_UPLOAD.includes(credentialType);
  if (role === 'employer') return EMPLOYER_CAN_UPLOAD.includes(credentialType);
  return false;
}

// ── Get categories available for a given role ─────────────────────────────────
export function getCategoriesForRole(role: UserRole): CredentialCategory[] {
  if (role === 'student') return ['academic', 'professional', 'personal'];
  if (role === 'employer') return ['employment', 'personal'];
  if (role === 'institution') return ['academic', 'employment', 'professional'];
  return ['academic', 'employment', 'professional', 'personal']; // admin/owner
}

// ── Get the label for why an issuance was denied ────────────────────────────
export function getDenialReason(
  role: UserRole,
  institutionType: InstitutionType | null,
  credentialType: CredentialType
): string {
  if (role === 'student') {
    return 'Students cannot issue official credentials. You may upload personal documents to your vault instead.';
  }
  if (role === 'employer' && institutionType !== 'company') {
    return 'Employers may only issue Employment credentials if registered as an approved Company institution.';
  }
  if (role === 'institution' && institutionType) {
    return `${institutionType.charAt(0).toUpperCase() + institutionType.slice(1)} institutions are not authorized to issue this credential type.`;
  }
  return 'You do not have permission to issue this credential type.';
}
