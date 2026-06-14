import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`users_sessions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`created_at\` text,
  	\`expires_at\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`users_sessions_order_idx\` ON \`users_sessions\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`users_sessions_parent_id_idx\` ON \`users_sessions\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`users\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`email\` text NOT NULL,
  	\`reset_password_token\` text,
  	\`reset_password_expiration\` text,
  	\`salt\` text,
  	\`hash\` text,
  	\`login_attempts\` numeric DEFAULT 0,
  	\`lock_until\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`users_updated_at_idx\` ON \`users\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`users_created_at_idx\` ON \`users\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`users_email_idx\` ON \`users\` (\`email\`);`)
  await db.run(sql`CREATE TABLE \`media\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`alt\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`url\` text,
  	\`thumbnail_u_r_l\` text,
  	\`filename\` text,
  	\`mime_type\` text,
  	\`filesize\` numeric,
  	\`width\` numeric,
  	\`height\` numeric,
  	\`focal_x\` numeric,
  	\`focal_y\` numeric
  );
  `)
  await db.run(sql`CREATE INDEX \`media_updated_at_idx\` ON \`media\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`media_created_at_idx\` ON \`media\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`media_filename_idx\` ON \`media\` (\`filename\`);`)
  await db.run(sql`CREATE TABLE \`customers_sessions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`created_at\` text,
  	\`expires_at\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`customers\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`customers_sessions_order_idx\` ON \`customers_sessions\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`customers_sessions_parent_id_idx\` ON \`customers_sessions\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`customers\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`first_name\` text NOT NULL,
  	\`last_name\` text NOT NULL,
  	\`phone\` text,
  	\`address\` text,
  	\`gender\` text,
  	\`avatar_id\` integer,
  	\`role\` text DEFAULT 'customer' NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`email\` text NOT NULL,
  	\`reset_password_token\` text,
  	\`reset_password_expiration\` text,
  	\`salt\` text,
  	\`hash\` text,
  	\`login_attempts\` numeric DEFAULT 0,
  	\`lock_until\` text,
  	FOREIGN KEY (\`avatar_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`customers_avatar_idx\` ON \`customers\` (\`avatar_id\`);`)
  await db.run(sql`CREATE INDEX \`customers_updated_at_idx\` ON \`customers\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`customers_created_at_idx\` ON \`customers\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`customers_email_idx\` ON \`customers\` (\`email\`);`)
  await db.run(sql`CREATE TABLE \`omplassering\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`pet_type_id\` integer NOT NULL,
  	\`breed_id\` integer,
  	\`age\` numeric NOT NULL,
  	\`age_unit\` text DEFAULT 'years' NOT NULL,
  	\`gender\` text NOT NULL,
  	\`personality\` text,
  	\`description\` text,
  	\`status\` text DEFAULT 'available' NOT NULL,
  	\`image_id\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`pet_type_id\`) REFERENCES \`pet_types\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`breed_id\`) REFERENCES \`breeds\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`omplassering_pet_type_idx\` ON \`omplassering\` (\`pet_type_id\`);`)
  await db.run(sql`CREATE INDEX \`omplassering_breed_idx\` ON \`omplassering\` (\`breed_id\`);`)
  await db.run(sql`CREATE INDEX \`omplassering_image_idx\` ON \`omplassering\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`omplassering_updated_at_idx\` ON \`omplassering\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`omplassering_created_at_idx\` ON \`omplassering\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`pet_types\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`pet_types_updated_at_idx\` ON \`pet_types\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`pet_types_created_at_idx\` ON \`pet_types\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`breeds\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`pet_type_id\` integer NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`pet_type_id\`) REFERENCES \`pet_types\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`breeds_pet_type_idx\` ON \`breeds\` (\`pet_type_id\`);`)
  await db.run(sql`CREATE INDEX \`breeds_updated_at_idx\` ON \`breeds\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`breeds_created_at_idx\` ON \`breeds\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`dyremat_sizes\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`weight_value\` numeric NOT NULL,
  	\`weight_unit\` text DEFAULT 'kg' NOT NULL,
  	\`purchase_price\` numeric NOT NULL,
  	\`purchase_price_includes_tax\` integer DEFAULT false,
  	\`cost_price_before_tax\` numeric,
  	\`profit_percent\` numeric DEFAULT 0,
  	\`price_before_tax\` numeric,
  	\`price\` numeric,
  	\`discount_percent\` numeric DEFAULT 0,
  	\`sale_price\` numeric,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`dyremat\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`dyremat_sizes_order_idx\` ON \`dyremat_sizes\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`dyremat_sizes_parent_id_idx\` ON \`dyremat_sizes\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`dyremat_feeding_guide\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`weight_from\` numeric NOT NULL,
  	\`weight_to\` numeric NOT NULL,
  	\`amount\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`dyremat\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`dyremat_feeding_guide_order_idx\` ON \`dyremat_feeding_guide\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`dyremat_feeding_guide_parent_id_idx\` ON \`dyremat_feeding_guide\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`dyremat\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`pet_type_id\` integer NOT NULL,
  	\`mat_type_id\` integer NOT NULL,
  	\`brand\` text,
  	\`price\` numeric,
  	\`weight_value\` numeric,
  	\`weight_unit\` text,
  	\`country_of_origin\` text,
  	\`ingredients\` text,
  	\`description\` text,
  	\`status\` text DEFAULT 'available' NOT NULL,
  	\`image_id\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`pet_type_id\`) REFERENCES \`pet_types\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`mat_type_id\`) REFERENCES \`mat_types\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`dyremat_pet_type_idx\` ON \`dyremat\` (\`pet_type_id\`);`)
  await db.run(sql`CREATE INDEX \`dyremat_mat_type_idx\` ON \`dyremat\` (\`mat_type_id\`);`)
  await db.run(sql`CREATE INDEX \`dyremat_image_idx\` ON \`dyremat\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`dyremat_updated_at_idx\` ON \`dyremat\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`dyremat_created_at_idx\` ON \`dyremat\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`mat_types\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`mat_types_updated_at_idx\` ON \`mat_types\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`mat_types_created_at_idx\` ON \`mat_types\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`tilbehor_types\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`tilbehor_types_updated_at_idx\` ON \`tilbehor_types\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`tilbehor_types_created_at_idx\` ON \`tilbehor_types\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`tilbehor\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`tilbehor_type_id\` integer NOT NULL,
  	\`brand\` text,
  	\`purchase_price\` numeric NOT NULL,
  	\`purchase_price_includes_tax\` integer DEFAULT false,
  	\`cost_price_before_tax\` numeric,
  	\`profit_percent\` numeric DEFAULT 0,
  	\`price_before_tax\` numeric,
  	\`price\` numeric,
  	\`discount_percent\` numeric DEFAULT 0,
  	\`sale_price\` numeric,
  	\`material\` text,
  	\`color\` text,
  	\`description\` text,
  	\`status\` text DEFAULT 'available' NOT NULL,
  	\`image_id\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`tilbehor_type_id\`) REFERENCES \`tilbehor_types\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`tilbehor_tilbehor_type_idx\` ON \`tilbehor\` (\`tilbehor_type_id\`);`)
  await db.run(sql`CREATE INDEX \`tilbehor_image_idx\` ON \`tilbehor\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`tilbehor_updated_at_idx\` ON \`tilbehor\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`tilbehor_created_at_idx\` ON \`tilbehor\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`tilbehor_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`pet_types_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`tilbehor\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pet_types_id\`) REFERENCES \`pet_types\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`tilbehor_rels_order_idx\` ON \`tilbehor_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`tilbehor_rels_parent_idx\` ON \`tilbehor_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`tilbehor_rels_path_idx\` ON \`tilbehor_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`tilbehor_rels_pet_types_id_idx\` ON \`tilbehor_rels\` (\`pet_types_id\`);`)
  await db.run(sql`CREATE TABLE \`delivery_companies\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`description\` text,
  	\`price\` numeric NOT NULL,
  	\`delivery_time\` text,
  	\`logo_id\` integer,
  	\`status\` text DEFAULT 'active' NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`logo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`delivery_companies_logo_idx\` ON \`delivery_companies\` (\`logo_id\`);`)
  await db.run(sql`CREATE INDEX \`delivery_companies_updated_at_idx\` ON \`delivery_companies\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`delivery_companies_created_at_idx\` ON \`delivery_companies\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`stores\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`address\` text NOT NULL,
  	\`postal_code\` text NOT NULL,
  	\`city\` text NOT NULL,
  	\`phone\` text,
  	\`opening_hours\` text,
  	\`distance_text\` text,
  	\`status\` text DEFAULT 'active' NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`stores_updated_at_idx\` ON \`stores\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`stores_created_at_idx\` ON \`stores\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`pets\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`owner_id\` integer NOT NULL,
  	\`name\` text NOT NULL,
  	\`pet_type\` text NOT NULL,
  	\`breed\` text,
  	\`image_id\` integer,
  	\`gender\` text,
  	\`sterilized\` text,
  	\`origin\` text,
  	\`birth_date\` text,
  	\`description\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`owner_id\`) REFERENCES \`customers\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`pets_owner_idx\` ON \`pets\` (\`owner_id\`);`)
  await db.run(sql`CREATE INDEX \`pets_image_idx\` ON \`pets\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`pets_updated_at_idx\` ON \`pets\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`pets_created_at_idx\` ON \`pets\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`orders_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`product_name\` text NOT NULL,
  	\`product_type\` text NOT NULL,
  	\`product_id\` text,
  	\`image_url\` text,
  	\`quantity\` numeric NOT NULL,
  	\`price\` numeric NOT NULL,
  	\`original_price\` numeric,
  	\`line_total\` numeric NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`orders\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`orders_items_order_idx\` ON \`orders_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`orders_items_parent_id_idx\` ON \`orders_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`orders\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order_number\` text NOT NULL,
  	\`customer_id\` integer,
  	\`customer_email\` text,
  	\`customer_name\` text,
  	\`status\` text DEFAULT 'new' NOT NULL,
  	\`payment_status\` text DEFAULT 'pending' NOT NULL,
  	\`subtotal\` numeric NOT NULL,
  	\`shipping\` numeric DEFAULT 0 NOT NULL,
  	\`discount\` numeric DEFAULT 0,
  	\`total\` numeric NOT NULL,
  	\`currency\` text DEFAULT 'NOK' NOT NULL,
  	\`delivery_address_full_name\` text,
  	\`delivery_address_phone\` text,
  	\`delivery_address_address\` text,
  	\`delivery_address_postal_code\` text,
  	\`delivery_address_city\` text,
  	\`note\` text,
  	\`created_from\` text DEFAULT 'website',
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`orders_customer_idx\` ON \`orders\` (\`customer_id\`);`)
  await db.run(sql`CREATE INDEX \`orders_updated_at_idx\` ON \`orders\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`orders_created_at_idx\` ON \`orders\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_kv\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`data\` text NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`global_slug\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_global_slug_idx\` ON \`payload_locked_documents\` (\`global_slug\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_updated_at_idx\` ON \`payload_locked_documents\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_created_at_idx\` ON \`payload_locked_documents\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`media_id\` integer,
  	\`customers_id\` integer,
  	\`omplassering_id\` integer,
  	\`pet_types_id\` integer,
  	\`breeds_id\` integer,
  	\`dyremat_id\` integer,
  	\`mat_types_id\` integer,
  	\`tilbehor_types_id\` integer,
  	\`tilbehor_id\` integer,
  	\`delivery_companies_id\` integer,
  	\`stores_id\` integer,
  	\`pets_id\` integer,
  	\`orders_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`customers_id\`) REFERENCES \`customers\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`omplassering_id\`) REFERENCES \`omplassering\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pet_types_id\`) REFERENCES \`pet_types\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`breeds_id\`) REFERENCES \`breeds\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`dyremat_id\`) REFERENCES \`dyremat\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`mat_types_id\`) REFERENCES \`mat_types\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`tilbehor_types_id\`) REFERENCES \`tilbehor_types\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`tilbehor_id\`) REFERENCES \`tilbehor\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`delivery_companies_id\`) REFERENCES \`delivery_companies\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`stores_id\`) REFERENCES \`stores\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pets_id\`) REFERENCES \`pets\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`orders_id\`) REFERENCES \`orders\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_customers_id_idx\` ON \`payload_locked_documents_rels\` (\`customers_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_omplassering_id_idx\` ON \`payload_locked_documents_rels\` (\`omplassering_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_pet_types_id_idx\` ON \`payload_locked_documents_rels\` (\`pet_types_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_breeds_id_idx\` ON \`payload_locked_documents_rels\` (\`breeds_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_dyremat_id_idx\` ON \`payload_locked_documents_rels\` (\`dyremat_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_mat_types_id_idx\` ON \`payload_locked_documents_rels\` (\`mat_types_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_tilbehor_types_id_idx\` ON \`payload_locked_documents_rels\` (\`tilbehor_types_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_tilbehor_id_idx\` ON \`payload_locked_documents_rels\` (\`tilbehor_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_delivery_companies_id_idx\` ON \`payload_locked_documents_rels\` (\`delivery_companies_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_stores_id_idx\` ON \`payload_locked_documents_rels\` (\`stores_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_pets_id_idx\` ON \`payload_locked_documents_rels\` (\`pets_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_orders_id_idx\` ON \`payload_locked_documents_rels\` (\`orders_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text,
  	\`value\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_key_idx\` ON \`payload_preferences\` (\`key\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_updated_at_idx\` ON \`payload_preferences\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_created_at_idx\` ON \`payload_preferences\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`customers_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_preferences\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`customers_id\`) REFERENCES \`customers\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_order_idx\` ON \`payload_preferences_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_parent_idx\` ON \`payload_preferences_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_path_idx\` ON \`payload_preferences_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_users_id_idx\` ON \`payload_preferences_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_customers_id_idx\` ON \`payload_preferences_rels\` (\`customers_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_migrations\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`batch\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_migrations_updated_at_idx\` ON \`payload_migrations\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_migrations_created_at_idx\` ON \`payload_migrations\` (\`created_at\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`users_sessions\`;`)
  await db.run(sql`DROP TABLE \`users\`;`)
  await db.run(sql`DROP TABLE \`media\`;`)
  await db.run(sql`DROP TABLE \`customers_sessions\`;`)
  await db.run(sql`DROP TABLE \`customers\`;`)
  await db.run(sql`DROP TABLE \`omplassering\`;`)
  await db.run(sql`DROP TABLE \`pet_types\`;`)
  await db.run(sql`DROP TABLE \`breeds\`;`)
  await db.run(sql`DROP TABLE \`dyremat_sizes\`;`)
  await db.run(sql`DROP TABLE \`dyremat_feeding_guide\`;`)
  await db.run(sql`DROP TABLE \`dyremat\`;`)
  await db.run(sql`DROP TABLE \`mat_types\`;`)
  await db.run(sql`DROP TABLE \`tilbehor_types\`;`)
  await db.run(sql`DROP TABLE \`tilbehor\`;`)
  await db.run(sql`DROP TABLE \`tilbehor_rels\`;`)
  await db.run(sql`DROP TABLE \`delivery_companies\`;`)
  await db.run(sql`DROP TABLE \`stores\`;`)
  await db.run(sql`DROP TABLE \`pets\`;`)
  await db.run(sql`DROP TABLE \`orders_items\`;`)
  await db.run(sql`DROP TABLE \`orders\`;`)
  await db.run(sql`DROP TABLE \`payload_kv\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_migrations\`;`)
}
