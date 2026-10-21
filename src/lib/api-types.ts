/**
 * Response shapes shared by route handlers and client hooks.
 * Client code imports types from here — never from src/server (HANDOFF G-18).
 */
import type {
  AiModel,
  Priority,
  ProjectCategory,
  ProjectStatus,
  ProposalSource,
  ProposalStatus,
  ReportLanguage,
  StandardCategory,
  Theme,
  Weights,
} from "./domain";

export interface SettingsDto {
  customerName: string;
  organization: string;
  appName: string;
  theme: Theme;
  sidebarCollapsed: boolean;
  aiModel: AiModel;
  reportLanguage: ReportLanguage;
  weights: Weights;
  partialCredit: number;
  concurrency: number;
  onboarded: boolean;
  updatedAt: string;
  /** Runtime facts (read-only, not stored in settings). */
  runtime: {
    aiMode: "mock" | "live";
    apiKeyConfigured: boolean;
    maxUploadMb: number;
  };
}

export interface DocumentDto {
  id: string;
  kind: "rfp" | "commercial" | "technical" | "standard";
  originalName: string;
  mimeType: string;
  ext: string;
  sizeBytes: number;
  pageCount: number | null;
  aiReadable: boolean;
  createdAt: string;
  /** Inline view URL; add `?download=1` to download. */
  url: string;
}

export interface RuleDto {
  id: string;
  standardId: string;
  code: string;
  text: string;
  priority: Priority;
  sortOrder: number;
  createdAt: string;
}

export interface StandardDto {
  id: string;
  code: string;
  title: string;
  category: StandardCategory;
  description: string;
  isActive: boolean;
  isSample: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StandardSummaryDto extends StandardDto {
  rulesCount: number;
  mandatoryCount: number;
  documentsCount: number;
}

export interface StandardDetailDto extends StandardDto {
  rules: RuleDto[];
  documents: DocumentDto[];
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export interface ProjectDto {
  id: string;
  code: string;
  name: string;
  description: string;
  category: ProjectCategory;
  notes: string;
  deadline: string | null; // YYYY-MM-DD
  status: ProjectStatus;
  isSample: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface ProjectSummaryDto extends ProjectDto {
  rfpCount: number;
  proposalCount: number;
  standardCount: number;
}

export interface ProjectStandardRef {
  id: string;
  code: string;
  title: string;
  category: string;
  isActive: boolean;
}

export interface ProjectDetailDto extends ProjectDto {
  rfpDocuments: DocumentDto[];
  standards: ProjectStandardRef[];
  proposalCount: number;
}

export interface VendorDto {
  id: string;
  name: string;
  country: string;
  contactName: string;
  contactEmail: string;
  color: string;
  isSample: boolean;
  createdAt: string;
}

export interface VendorSummaryDto extends VendorDto {
  proposalCount: number;
}

export interface ProposalDto {
  id: string;
  projectId: string;
  vendorId: string;
  submittedAt: string;
  status: ProposalStatus;
  source: ProposalSource;
}

export interface ProposalSummaryDto extends ProposalDto {
  vendor: VendorDto;
  documentCounts: { commercial: number; technical: number; pages: number };
}

export interface ProposalDetailDto extends ProposalDto {
  vendor: VendorDto;
  project: { id: string; code: string; name: string; status: ProjectStatus };
  commercialDocuments: DocumentDto[];
  technicalDocuments: DocumentDto[];
}
