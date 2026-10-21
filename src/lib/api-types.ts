/**
 * Response shapes shared by route handlers and client hooks.
 * Client code imports types from here — never from src/server (HANDOFF G-18).
 */
import type { AiModel, Priority, ReportLanguage, StandardCategory, Theme, Weights } from "./domain";

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
