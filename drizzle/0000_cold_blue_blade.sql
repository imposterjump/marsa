CREATE TABLE `analysis_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`model` text NOT NULL,
	`total_steps` integer NOT NULL,
	`done_steps` integer DEFAULT 0 NOT NULL,
	`config` text NOT NULL,
	`usage` text,
	`cost_usd` real DEFAULT 0 NOT NULL,
	`error` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`started_at` text,
	`finished_at` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `analysis_runs_project_idx` ON `analysis_runs` (`project_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `analysis_steps` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`seq` integer NOT NULL,
	`phase` text NOT NULL,
	`proposal_id` text,
	`label` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`attempt` integer DEFAULT 0 NOT NULL,
	`started_at` text,
	`finished_at` text,
	`duration_ms` integer,
	`error` text,
	`output` text,
	`usage` text,
	FOREIGN KEY (`run_id`) REFERENCES `analysis_runs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `analysis_steps_run_seq_uq` ON `analysis_steps` (`run_id`,`seq`);--> statement-breakpoint
CREATE TABLE `comparisons` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`proposal_id` text NOT NULL,
	`data` text NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `analysis_runs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `comparisons_run_proposal_uq` ON `comparisons` (`run_id`,`proposal_id`);--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`project_id` text,
	`proposal_id` text,
	`standard_id` text,
	`original_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`ext` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`sha256` text NOT NULL,
	`storage_path` text NOT NULL,
	`page_count` integer,
	`text_content` text,
	`ai_readable` integer DEFAULT true NOT NULL,
	`anthropic_file_id` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`standard_id`) REFERENCES `standards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `documents_project_idx` ON `documents` (`project_id`,`kind`);--> statement-breakpoint
CREATE INDEX `documents_proposal_idx` ON `documents` (`proposal_id`,`kind`);--> statement-breakpoint
CREATE INDEX `documents_standard_idx` ON `documents` (`standard_id`);--> statement-breakpoint
CREATE TABLE `evaluations` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`proposal_id` text NOT NULL,
	`score_pct` real NOT NULL,
	`counts` text NOT NULL,
	`mandatory_failures` integer DEFAULT 0 NOT NULL,
	`category_scores` text NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`strengths` text NOT NULL,
	`weaknesses` text NOT NULL,
	`commercial` text NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `analysis_runs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `evaluations_run_proposal_uq` ON `evaluations` (`run_id`,`proposal_id`);--> statement-breakpoint
CREATE TABLE `findings` (
	`id` text PRIMARY KEY NOT NULL,
	`evaluation_id` text NOT NULL,
	`requirement_id` text NOT NULL,
	`status` text NOT NULL,
	`vendor_response` text DEFAULT '' NOT NULL,
	`evidence_quote` text,
	`evidence_doc_id` text,
	`evidence_page` integer,
	`evidence_section` text,
	`assessment` text DEFAULT '' NOT NULL,
	`gap` text,
	`confidence` text DEFAULT 'medium' NOT NULL,
	`override_status` text,
	`override_note` text,
	`overridden_at` text,
	FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`requirement_id`) REFERENCES `requirements`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`evidence_doc_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `findings_evaluation_idx` ON `findings` (`evaluation_id`);--> statement-breakpoint
CREATE TABLE `project_standards` (
	`project_id` text NOT NULL,
	`standard_id` text NOT NULL,
	PRIMARY KEY(`project_id`, `standard_id`),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`standard_id`) REFERENCES `standards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`category` text DEFAULT 'other' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`deadline` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`is_sample` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`published_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_code_uq` ON `projects` (`code`);--> statement-breakpoint
CREATE INDEX `projects_status_idx` ON `projects` (`status`);--> statement-breakpoint
CREATE TABLE `proposals` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`vendor_id` text NOT NULL,
	`submitted_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`status` text DEFAULT 'submitted' NOT NULL,
	`source` text DEFAULT 'simulator' NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `proposals_project_vendor_uq` ON `proposals` (`project_id`,`vendor_id`);--> statement-breakpoint
CREATE INDEX `proposals_project_idx` ON `proposals` (`project_id`);--> statement-breakpoint
CREATE TABLE `requirements` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`category` text NOT NULL,
	`priority` text NOT NULL,
	`source_type` text NOT NULL,
	`source_ref` text DEFAULT '' NOT NULL,
	`standard_id` text,
	`acceptance` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `analysis_runs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`standard_id`) REFERENCES `standards`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `requirements_run_code_uq` ON `requirements` (`run_id`,`code`);--> statement-breakpoint
CREATE TABLE `risks` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`proposal_id` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`likelihood` integer NOT NULL,
	`impact` integer NOT NULL,
	`severity` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`consequence` text DEFAULT '' NOT NULL,
	`mitigation` text DEFAULT '' NOT NULL,
	`evidence` text,
	`requirement_codes` text NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `analysis_runs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `risks_run_proposal_idx` ON `risks` (`run_id`,`proposal_id`);--> statement-breakpoint
CREATE TABLE `run_summaries` (
	`run_id` text PRIMARY KEY NOT NULL,
	`ranking` text NOT NULL,
	`recommended_proposal_id` text,
	`executive_summary` text DEFAULT '' NOT NULL,
	`conditions` text NOT NULL,
	`negotiation_points` text NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `analysis_runs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recommended_proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`customer_name` text DEFAULT '' NOT NULL,
	`organization` text DEFAULT '' NOT NULL,
	`app_name` text DEFAULT 'Marsa' NOT NULL,
	`theme` text DEFAULT 'system' NOT NULL,
	`sidebar_collapsed` integer DEFAULT false NOT NULL,
	`ai_model` text DEFAULT 'claude-opus-5-5' NOT NULL,
	`report_language` text DEFAULT 'en' NOT NULL,
	`weights` text NOT NULL,
	`partial_credit` real DEFAULT 0.5 NOT NULL,
	`concurrency` integer DEFAULT 3 NOT NULL,
	`onboarded` integer DEFAULT false NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `standard_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`standard_id` text NOT NULL,
	`code` text NOT NULL,
	`text` text NOT NULL,
	`priority` text DEFAULT 'important' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`standard_id`) REFERENCES `standards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `standard_rules_standard_idx` ON `standard_rules` (`standard_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `standards` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`category` text DEFAULT 'general' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`is_sample` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `vendors` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`country` text DEFAULT '' NOT NULL,
	`contact_name` text DEFAULT '' NOT NULL,
	`contact_email` text DEFAULT '' NOT NULL,
	`color` text DEFAULT 'teal' NOT NULL,
	`is_sample` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
