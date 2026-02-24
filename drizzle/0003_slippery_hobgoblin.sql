ALTER TABLE `manufacturers` ADD `isPinned` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `manufacturers` ADD `sortOrder` int DEFAULT 999 NOT NULL;