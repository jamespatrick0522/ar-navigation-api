INSERT INTO "admin_users" ("username", "display_name", "password_hash", "role", "is_active") VALUES
  ('pacadmin', 'PAC Admin', 'sha256$pacadmin-seed-2026$cbcbf89c19420b444e5024301f2361cea3f4c25202144660b326b44cf5a0a8b8', 'admin', true),
  ('demo_admin', 'Demo Admin', 'sha256$demo-admin-seed-2026$aa473a98fbee1e6e3e039bde0eae9c1d879c35b11a94b64583aeefaab5d4cab4', 'admin', true)
ON CONFLICT ("username") DO UPDATE SET
  "display_name" = EXCLUDED."display_name",
  "password_hash" = EXCLUDED."password_hash",
  "role" = EXCLUDED."role",
  "is_active" = true,
  "updated_at" = now();
