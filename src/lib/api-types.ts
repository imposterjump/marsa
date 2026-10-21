/**
 * Response shapes shared by route handlers and client hooks.
 * Client code imports types from here — never from src/server (HANDOFF G-18).
 */
import type { AiModel, ReportLanguage, Theme, Weights } from "./domain";

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

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}
