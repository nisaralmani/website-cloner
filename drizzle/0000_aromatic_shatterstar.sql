CREATE TABLE `ai_agent_log` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`conversation_id` text,
	`message_id` text,
	`category` text DEFAULT 'unknown' NOT NULL,
	`sentiment` text DEFAULT 'neutral' NOT NULL,
	`risk` text DEFAULT 'low' NOT NULL,
	`is_spam` integer DEFAULT 0 NOT NULL,
	`is_vip` integer DEFAULT 0 NOT NULL,
	`confidence` integer DEFAULT 0 NOT NULL,
	`decision` text NOT NULL,
	`reason` text,
	`model` text DEFAULT 'rules' NOT NULL,
	`summary` text,
	`channel` text DEFAULT 'unknown' NOT NULL,
	`latency_ms` integer,
	`grounding_source` text,
	`review_status` text,
	`error` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ai_review_queue` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`conversation_id` text,
	`message_id` text,
	`channel` text DEFAULT 'chat' NOT NULL,
	`state` text DEFAULT 'pending_review' NOT NULL,
	`decision` text NOT NULL,
	`reason` text,
	`confidence` integer DEFAULT 0 NOT NULL,
	`confidence_level` text DEFAULT 'low' NOT NULL,
	`draft_text` text,
	`reviewer` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`resolved_at` integer,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `billing_invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`invoice_number` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`status` text DEFAULT 'paid' NOT NULL,
	`issued_at` integer NOT NULL,
	`payment_method_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `campaign_recipients` (
	`campaign_id` text NOT NULL,
	`contact_id` text NOT NULL,
	`added_at` integer NOT NULL,
	PRIMARY KEY(`campaign_id`, `contact_id`),
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `campaign_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`status` text NOT NULL,
	`contact_count` integer DEFAULT 0 NOT NULL,
	`last_update` text NOT NULL,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `chatbox_restrictions` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`kind` text NOT NULL,
	`value` text NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `chatbox_restrictions_workspace_kind_value` ON `chatbox_restrictions` (`workspace_id`,`kind`,`value`);--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`name` text NOT NULL,
	`initials` text,
	`email` text NOT NULL,
	`location` text NOT NULL,
	`company` text NOT NULL,
	`segments` text NOT NULL,
	`last_active` text NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`avatar_gradient` text NOT NULL,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `conversation_ai` (
	`conversation_id` text PRIMARY KEY NOT NULL,
	`summary` text,
	`sentiment` text,
	`category` text,
	`confidence` integer,
	`is_vip` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `conversation_ratings` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`conversation_id` text NOT NULL,
	`session_id` text NOT NULL,
	`score` integer NOT NULL,
	`comment` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `conversation_reminders` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`message_id` text NOT NULL,
	`author_user_id` text NOT NULL,
	`remind_at` integer NOT NULL,
	`note` text NOT NULL,
	`cancelled_at` integer,
	`fulfilled_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`author_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `conversation_segments` (
	`conversation_id` text NOT NULL,
	`segment` text NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`conversation_id`, `segment`),
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `conversation_visitor_data` (
	`conversation_id` text NOT NULL,
	`data_key` text NOT NULL,
	`data_value` text NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`conversation_id`, `data_key`),
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`name` text NOT NULL,
	`initials` text,
	`preview` text NOT NULL,
	`time_label` text NOT NULL,
	`unread` integer DEFAULT 0 NOT NULL,
	`status` text NOT NULL,
	`country` text NOT NULL,
	`avatar_gradient` text NOT NULL,
	`sort_order` integer NOT NULL,
	`location` text,
	`local_time` text,
	`timezone` text,
	`channel` text,
	`device` text,
	`ip` text,
	`customer_email` text,
	`assigned_operator_id` text,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_operator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `email_verification_tokens` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`used_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `helpdesk_articles` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`title` text NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`status` text NOT NULL,
	`category_id` text,
	`views` integer DEFAULT 0 NOT NULL,
	`helpful_count` integer DEFAULT 0 NOT NULL,
	`last_update` text NOT NULL,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `helpdesk_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `message_shortcuts` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`bang` text NOT NULL,
	`tag` text,
	`message` text NOT NULL,
	`created_by` text,
	`sort_order` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `message_shortcuts_workspace_bang` ON `message_shortcuts` (`workspace_id`,`bang`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`from` text NOT NULL,
	`text` text NOT NULL,
	`time_label` text NOT NULL,
	`sort_order` integer NOT NULL,
	`author_user_id` text,
	`delivered_at` integer,
	`read_at` integer,
	`attachment_url` text,
	`attachment_name` text,
	`attachment_mime` text,
	`attachment_size` integer,
	`rfc_message_id` text,
	`email_in_reply_to` text,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`author_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `oauth_accounts` (
	`provider` text NOT NULL,
	`provider_user_id` text NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`linked_at` integer NOT NULL,
	PRIMARY KEY(`provider`, `provider_user_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`used_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payment_methods` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`label` text NOT NULL,
	`last4` text NOT NULL,
	`brand` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `plugin_catalog` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`icon_url` text NOT NULL,
	`category` text NOT NULL,
	`badge` text,
	`price` text,
	`separate_checkout` integer DEFAULT 0 NOT NULL,
	`sort_order` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `plugin_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`count` integer NOT NULL,
	`sort_order` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `routing_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`name` text NOT NULL,
	`action` text NOT NULL,
	`assign_target` text,
	`match_contains` text,
	`enabled` integer DEFAULT 1 NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `routing_rules_workspace_name` ON `routing_rules` (`workspace_id`,`name`);--> statement-breakpoint
CREATE TABLE `search_ai_frequent_searches` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`query` text NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sub_inboxes` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`name` text NOT NULL,
	`segment` text,
	`enabled` integer DEFAULT 1 NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sub_inboxes_workspace_name` ON `sub_inboxes` (`workspace_id`,`name`);--> statement-breakpoint
CREATE TABLE `triage_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`ruleset` text NOT NULL,
	`name` text NOT NULL,
	`action` text NOT NULL,
	`enabled` integer DEFAULT 1 NOT NULL,
	`match_contains` text,
	`sort_order` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`user_agent` text NOT NULL,
	`ip_address` text NOT NULL,
	`country` text DEFAULT 'Unknown' NOT NULL,
	`created_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL,
	`revoked_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_settings` (
	`user_id` text NOT NULL,
	`setting_key` text NOT NULL,
	`value` text NOT NULL,
	PRIMARY KEY(`user_id`, `setting_key`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`first_name` text DEFAULT '' NOT NULL,
	`last_name` text DEFAULT '' NOT NULL,
	`phone` text,
	`avatar_url` text,
	`avatar_gradient` text NOT NULL,
	`email_verified` integer DEFAULT 0 NOT NULL,
	`presence_status` text DEFAULT 'online' NOT NULL,
	`force_offline` integer DEFAULT 0 NOT NULL,
	`auto_available` integer DEFAULT 1 NOT NULL,
	`schedule_enabled` integer DEFAULT 0 NOT NULL,
	`schedule_days` text DEFAULT '["Mon","Tue","Wed","Thu","Fri","Sat"]' NOT NULL,
	`schedule_timezone` text DEFAULT 'UTC+05:00' NOT NULL,
	`schedule_start` text DEFAULT '09:00' NOT NULL,
	`schedule_end` text DEFAULT '17:00' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `visitor_chat_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`conversation_id` text NOT NULL,
	`visitor_nickname` text NOT NULL,
	`country` text DEFAULT 'US' NOT NULL,
	`locale` text,
	`page_url` text,
	`email` text,
	`phone` text,
	`ip` text,
	`created_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `visitors` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`name` text NOT NULL,
	`initials` text,
	`city` text NOT NULL,
	`location` text NOT NULL,
	`country` text NOT NULL,
	`current_page` text NOT NULL,
	`is_active` integer DEFAULT 0 NOT NULL,
	`avatar_gradient` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `workspace_api_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`label` text NOT NULL,
	`token_preview` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `workspace_audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`badge` text DEFAULT 'Write' NOT NULL,
	`ip_address` text NOT NULL,
	`country` text DEFAULT 'Unknown' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `workspace_members` (
	`user_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`role` text NOT NULL,
	PRIMARY KEY(`user_id`, `workspace_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `workspace_plugins` (
	`workspace_id` text NOT NULL,
	`plugin_id` text NOT NULL,
	`installed` integer DEFAULT 1 NOT NULL,
	`installed_at` integer NOT NULL,
	PRIMARY KEY(`workspace_id`, `plugin_id`),
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`plugin_id`) REFERENCES `plugin_catalog`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `workspace_settings` (
	`workspace_id` text NOT NULL,
	`setting_key` text NOT NULL,
	`value` text NOT NULL,
	PRIMARY KEY(`workspace_id`, `setting_key`),
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `workspace_subscriptions` (
	`workspace_id` text PRIMARY KEY NOT NULL,
	`plan_tag` text DEFAULT 'Free' NOT NULL,
	`plan_amount` text DEFAULT 'Free' NOT NULL,
	`plan_period` text DEFAULT 'forever!' NOT NULL,
	`status` text DEFAULT 'Active' NOT NULL,
	`billing_owner` text DEFAULT 'none' NOT NULL,
	`monthly_cents` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `workspace_webhooks` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`url` text NOT NULL,
	`enabled` integer DEFAULT 1 NOT NULL,
	`events` text DEFAULT '["message:operator","message:visitor","message:note","conversation:status","conversation:assigned","conversation:created","conversation:deleted"]' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`domain` text NOT NULL,
	`initials` text NOT NULL,
	`logo_url` text,
	`contact_email` text,
	`contact_phone` text,
	`contact_messenger` text,
	`contact_telegram` text,
	`contact_twitter` text,
	`contact_whatsapp` text,
	`contact_instagram` text,
	`contact_total` integer DEFAULT 0 NOT NULL,
	`helpdesk_enabled` integer DEFAULT 0 NOT NULL,
	`analytics_enabled` integer DEFAULT 0 NOT NULL,
	`analytics_timezone` text DEFAULT 'UTC' NOT NULL
);
