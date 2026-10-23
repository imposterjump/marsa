CREATE TABLE `analysis_meta` (
	`item_id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`kind` text NOT NULL,
	`section` text,
	`headline` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `analysis_runs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `analysis_meta_run_idx` ON `analysis_meta` (`run_id`,`kind`);