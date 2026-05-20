CREATE TABLE IF NOT EXISTS "navigation_anchors" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(80) NOT NULL,
	"name" varchar(160) NOT NULL,
	"qr_code_value" varchar(160) NOT NULL,
	"description" text,
	"building_id" integer,
	"floor_id" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "navigation_anchors_code_unique" UNIQUE("code"),
	CONSTRAINT "navigation_anchors_qr_code_value_unique" UNIQUE("qr_code_value")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "navigation_route_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"route_id" integer NOT NULL,
	"step_order" integer NOT NULL,
	"from_anchor_id" integer,
	"to_anchor_id" integer,
	"instruction" text NOT NULL,
	"helper_text" text,
	"arrow_direction" varchar(40) NOT NULL,
	"distance_meters" integer,
	"checkpoint_qr_value" varchar(160),
	"is_checkpoint_required" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "navigation_routes" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" integer NOT NULL,
	"start_anchor_id" integer NOT NULL,
	"title" varchar(180) NOT NULL,
	"description" text,
	"total_distance_meters" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "navigation_routes_room_id_unique" UNIQUE("room_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "navigation_anchors" ADD CONSTRAINT "navigation_anchors_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "navigation_anchors" ADD CONSTRAINT "navigation_anchors_floor_id_floors_id_fk" FOREIGN KEY ("floor_id") REFERENCES "public"."floors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "navigation_route_steps" ADD CONSTRAINT "navigation_route_steps_route_id_navigation_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."navigation_routes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "navigation_route_steps" ADD CONSTRAINT "navigation_route_steps_from_anchor_id_navigation_anchors_id_fk" FOREIGN KEY ("from_anchor_id") REFERENCES "public"."navigation_anchors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "navigation_route_steps" ADD CONSTRAINT "navigation_route_steps_to_anchor_id_navigation_anchors_id_fk" FOREIGN KEY ("to_anchor_id") REFERENCES "public"."navigation_anchors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "navigation_routes" ADD CONSTRAINT "navigation_routes_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "navigation_routes" ADD CONSTRAINT "navigation_routes_start_anchor_id_navigation_anchors_id_fk" FOREIGN KEY ("start_anchor_id") REFERENCES "public"."navigation_anchors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
