CREATE TABLE `run_quality` (
	`run_id` text PRIMARY KEY NOT NULL,
	`metrics` text NOT NULL,
	`computed_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `analysis_runs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `run_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`reviewer` text DEFAULT '' NOT NULL,
	`overall` integer NOT NULL,
	`accuracy` integer,
	`evidence` integer,
	`completeness` integer,
	`usefulness` integer,
	`verdict` text NOT NULL,
	`comment` text DEFAULT '' NOT NULL,
	`metrics_snapshot` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `analysis_runs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `run_reviews_run_idx` ON `run_reviews` (`run_id`,`created_at`);