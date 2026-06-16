import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pets\` ADD \`pet_type_id\` integer NOT NULL REFERENCES pet_types(id);`)
  await db.run(sql`CREATE INDEX \`pets_pet_type_idx\` ON \`pets\` (\`pet_type_id\`);`)
  await db.run(sql`ALTER TABLE \`pets\` DROP COLUMN \`pet_type\`;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_pets\` (
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
  await db.run(sql`INSERT INTO \`__new_pets\`("id", "owner_id", "name", "pet_type", "breed", "image_id", "gender", "sterilized", "origin", "birth_date", "description", "updated_at", "created_at") SELECT "id", "owner_id", "name", "pet_type", "breed", "image_id", "gender", "sterilized", "origin", "birth_date", "description", "updated_at", "created_at" FROM \`pets\`;`)
  await db.run(sql`DROP TABLE \`pets\`;`)
  await db.run(sql`ALTER TABLE \`__new_pets\` RENAME TO \`pets\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`pets_owner_idx\` ON \`pets\` (\`owner_id\`);`)
  await db.run(sql`CREATE INDEX \`pets_image_idx\` ON \`pets\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`pets_updated_at_idx\` ON \`pets\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`pets_created_at_idx\` ON \`pets\` (\`created_at\`);`)
}
