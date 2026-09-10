export interface ApiEnvelope<T> {
  data: T;
  error: { code: string; message: string; details?: Record<string, string> | null } | null;
}

export interface Page<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export interface Cta {
  label: string;
  url: string;
  style: string;
}

export interface Profile {
  id: string;
  name: string;
  tagline: string | null;
  intro: string | null;
  photoUrl: string | null;
  photoAlt: string | null;
  bannerImageUrl: string | null;
  bannerAlt: string | null;
  socialLinks: Record<string, string>;
  ctas: Cta[];
  resumeUrl: string | null;
  updatedAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  longDescription: string | null;
  thumbnailUrl: string | null;
  thumbnailAlt: string | null;
  liveUrl: string | null;
  repoUrl: string | null;
  techTags: string[];
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string | null;
  startDate: string | null;
  endDate: string | null;
  gradeOrGpa: string | null;
  description: string | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Achievement {
  id: string;
  category: string;
  title: string;
  platform: string | null;
  rank: string | null;
  rating: string | null;
  standingUrl: string | null;
  achievedDate: string | null;
  description: string | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Extracurricular {
  id: string;
  title: string;
  organization: string | null;
  role: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface BlogSummary {
  id: string;
  title: string;
  location: string | null;
  blogDate: string | null;
  coverPhotoUrl: string | null;
  coverPhotoAlt: string | null;
  summary: string | null;
  displayOrder: number;
}

export interface BlogPhoto {
  id: string;
  photoUrl: string;
  altText: string | null;
  caption: string | null;
  displayOrder: number;
}

export interface BlogDetail extends BlogSummary {
  createdAt: string;
  updatedAt: string;
  photos: BlogPhoto[];
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: { email: string };
}

export interface UploadResult {
  url: string;
  width: number | null;
  height: number | null;
  size: number;
  mimeType: string;
}
