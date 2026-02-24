CREATE TABLE `efficiency_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cellType` enum('single_junction','tandem_silicon','tandem_perovskite','flexible','module','mini_module') NOT NULL,
	`efficiency` decimal(5,2) NOT NULL,
	`area` decimal(10,2),
	`institution` varchar(256) NOT NULL,
	`certifiedBy` varchar(256),
	`recordDate` timestamp NOT NULL,
	`sourceUrl` varchar(1024),
	`notes` text,
	`isCurrentRecord` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `efficiency_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `job_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobType` varchar(128) NOT NULL,
	`status` enum('running','success','failed') NOT NULL,
	`itemsProcessed` int DEFAULT 0,
	`errorMessage` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `job_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `manufacturers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`nameEn` varchar(256),
	`country` varchar(128) NOT NULL,
	`region` varchar(256),
	`foundedYear` int,
	`website` varchar(512),
	`logoUrl` varchar(1024),
	`description` text,
	`mainProducts` text,
	`techAchievements` text,
	`stockCode` varchar(64),
	`stage` enum('research','pilot','mass_production','listed') NOT NULL DEFAULT 'research',
	`capacity` varchar(256),
	`latestNews` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `manufacturers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `news` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(512) NOT NULL,
	`summary` text,
	`content` text,
	`sourceUrl` varchar(1024),
	`sourceName` varchar(256),
	`imageUrl` varchar(1024),
	`category` enum('domestic','international','research','policy','market','technology') NOT NULL DEFAULT 'domestic',
	`tags` text,
	`isImportant` boolean NOT NULL DEFAULT false,
	`publishedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `news_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(512) NOT NULL,
	`description` text,
	`projectType` enum('procurement','construction','research','service','other') NOT NULL DEFAULT 'procurement',
	`budget` varchar(256),
	`region` varchar(256),
	`publisherName` varchar(256),
	`contactInfo` text,
	`sourceUrl` varchar(1024),
	`sourcePlatform` varchar(256),
	`deadline` timestamp,
	`isImportant` boolean NOT NULL DEFAULT false,
	`status` enum('open','closed','awarded','cancelled') NOT NULL DEFAULT 'open',
	`publishedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenders_id` PRIMARY KEY(`id`)
);
