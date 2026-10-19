ALTER TABLE "ar_navigation_routes" ADD COLUMN "coordinate_frame" varchar(40) DEFAULT 'legacy-v1' NOT NULL;
--> statement-breakpoint
ALTER TABLE "ar_navigation_routes" ADD COLUMN "marker_floor_offset_meters" double precision DEFAULT 0 NOT NULL;
--> statement-breakpoint
UPDATE "navigation_anchors" SET "code" = 'MAIN_ENTRANCE'
WHERE "qr_code_value" = 'PAC-NAV-START-MAIN-ENTRANCE'
AND NOT EXISTS (SELECT 1 FROM "navigation_anchors" WHERE "code" = 'MAIN_ENTRANCE');
--> statement-breakpoint
INSERT INTO "navigation_anchors" ("code", "name", "qr_code_value", "description", "sort_order", "is_active")
VALUES ('MAIN_ENTRANCE', 'Main Entrance', 'PAC-NAV-START-MAIN-ENTRANCE', 'Fixed Main Entrance AR image marker. Keep its printed size, position and orientation unchanged.', 1, true)
ON CONFLICT DO NOTHING;
