CREATE TABLE IF NOT EXISTS "ar_navigation_route_points" (
	"id" serial PRIMARY KEY NOT NULL,
	"route_id" integer NOT NULL,
	"point_order" integer NOT NULL,
	"point_type" varchar(40) NOT NULL,
	"label" varchar(160),
	"direction" varchar(40),
	"x" double precision NOT NULL,
	"y" double precision NOT NULL,
	"z" double precision NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ar_navigation_routes" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" integer NOT NULL,
	"start_anchor_id" integer NOT NULL,
	"title" varchar(180) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ar_navigation_route_points" ADD CONSTRAINT "ar_navigation_route_points_route_id_ar_navigation_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."ar_navigation_routes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ar_navigation_routes" ADD CONSTRAINT "ar_navigation_routes_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ar_navigation_routes" ADD CONSTRAINT "ar_navigation_routes_start_anchor_id_navigation_anchors_id_fk" FOREIGN KEY ("start_anchor_id") REFERENCES "public"."navigation_anchors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ar_navigation_route_points_route_order_unique" ON "ar_navigation_route_points" USING btree ("route_id","point_order");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ar_navigation_routes_room_start_unique" ON "ar_navigation_routes" USING btree ("room_id","start_anchor_id");