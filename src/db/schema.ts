import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

const timestamps = {
  createdAt: timestamp('created_at', {withTimezone: true}).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', {withTimezone: true}).defaultNow().notNull(),
};

export const buildings = pgTable('buildings', {
  id: serial('id').primaryKey(),
  code: varchar('code', {length: 50}).notNull().unique(),
  name: varchar('name', {length: 150}).notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  campusName: varchar('campus_name', {length: 150}),
  address: text('address'),
  mapNote: text('map_note'),
  isActive: boolean('is_active').default(true).notNull(),
  ...timestamps,
});

export const floors = pgTable('floors', {
  id: serial('id').primaryKey(),
  buildingId: integer('building_id').references(() => buildings.id).notNull(),
  floorNumber: integer('floor_number').notNull(),
  floorName: varchar('floor_name', {length: 120}).notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(true).notNull(),
  ...timestamps,
});

export const roomCategories = pgTable('room_categories', {
  id: serial('id').primaryKey(),
  code: varchar('code', {length: 50}).notNull().unique(),
  name: varchar('name', {length: 120}).notNull(),
  description: text('description'),
  iconName: varchar('icon_name', {length: 120}),
  colorHex: varchar('color_hex', {length: 16}),
  isActive: boolean('is_active').default(true).notNull(),
  ...timestamps,
});

export const rooms = pgTable('rooms', {
  id: serial('id').primaryKey(),
  roomCode: varchar('room_code', {length: 60}).notNull().unique(),
  roomName: varchar('room_name', {length: 160}).notNull(),
  shortName: varchar('short_name', {length: 80}),
  categoryId: integer('category_id').references(() => roomCategories.id).notNull(),
  buildingId: integer('building_id').references(() => buildings.id).notNull(),
  floorId: integer('floor_id').references(() => floors.id).notNull(),
  description: text('description'),
  roomNumber: varchar('room_number', {length: 40}),
  imageUrl: text('image_url'),
  coverImageUrl: text('cover_image_url'),
  nearestLandmark: text('nearest_landmark'),
  operatingHours: text('operating_hours'),
  contactEmail: varchar('contact_email', {length: 160}),
  contactPhone: varchar('contact_phone', {length: 60}),
  locationNote: text('location_note'),
  qrCodeValue: varchar('qr_code_value', {length: 160}),
  isFeatured: boolean('is_featured').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  capacity: integer('capacity'),
  tagsJson: jsonb('tags_json').$type<string[]>().default([]).notNull(),
  searchableKeywords: text('searchable_keywords'),
  staticDistanceNote: text('static_distance_note'),
  demoNavigationNote: text('demo_navigation_note'),
  ...timestamps,
});

export const roomPeople = pgTable('room_people', {
  id: serial('id').primaryKey(),
  roomId: integer('room_id').references(() => rooms.id).notNull(),
  fullName: varchar('full_name', {length: 160}).notNull(),
  roleTitle: varchar('role_title', {length: 160}),
  email: varchar('email', {length: 160}),
  phone: varchar('phone', {length: 60}),
  imageUrl: text('image_url'),
  officeHours: text('office_hours'),
  notes: text('notes'),
  isPrimary: boolean('is_primary').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  ...timestamps,
});

export const roomGallery = pgTable('room_gallery', {
  id: serial('id').primaryKey(),
  roomId: integer('room_id').references(() => rooms.id).notNull(),
  imageUrl: text('image_url').notNull(),
  imageType: varchar('image_type', {length: 60}),
  sortOrder: integer('sort_order').default(0).notNull(),
  caption: text('caption'),
  ...timestamps,
});

export const qrEntries = pgTable('qr_entries', {
  id: serial('id').primaryKey(),
  qrCodeValue: varchar('qr_code_value', {length: 160}).notNull().unique(),
  label: varchar('label', {length: 160}).notNull(),
  description: text('description'),
  buildingId: integer('building_id').references(() => buildings.id),
  floorId: integer('floor_id').references(() => floors.id),
  roomId: integer('room_id').references(() => rooms.id),
  scopeType: varchar('scope_type', {length: 60}).notNull(),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(true).notNull(),
  ...timestamps,
});

export const navigationDemoConfigs = pgTable('navigation_demo_configs', {
  id: serial('id').primaryKey(),
  roomId: integer('room_id').references(() => rooms.id).notNull().unique(),
  arrowDirection: varchar('arrow_direction', {length: 40}).notNull(),
  approximateDistanceMeters: integer('approximate_distance_meters'),
  overlayLabel: varchar('overlay_label', {length: 160}),
  helperText: text('helper_text'),
  mockStepsJson: jsonb('mock_steps_json').$type<string[]>().default([]).notNull(),
  ...timestamps,
});

export const navigationAnchors = pgTable('navigation_anchors', {
  id: serial('id').primaryKey(),
  code: varchar('code', {length: 80}).notNull().unique(),
  name: varchar('name', {length: 160}).notNull(),
  qrCodeValue: varchar('qr_code_value', {length: 160}).notNull().unique(),
  description: text('description'),
  buildingId: integer('building_id').references(() => buildings.id),
  floorId: integer('floor_id').references(() => floors.id),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  ...timestamps,
});

export const navigationRoutes = pgTable('navigation_routes', {
  id: serial('id').primaryKey(),
  roomId: integer('room_id').references(() => rooms.id).notNull().unique(),
  startAnchorId: integer('start_anchor_id').references(() => navigationAnchors.id).notNull(),
  title: varchar('title', {length: 180}).notNull(),
  description: text('description'),
  totalDistanceMeters: integer('total_distance_meters'),
  isActive: boolean('is_active').default(true).notNull(),
  ...timestamps,
});

export const navigationRouteSteps = pgTable('navigation_route_steps', {
  id: serial('id').primaryKey(),
  routeId: integer('route_id').references(() => navigationRoutes.id).notNull(),
  stepOrder: integer('step_order').notNull(),
  fromAnchorId: integer('from_anchor_id').references(() => navigationAnchors.id),
  toAnchorId: integer('to_anchor_id').references(() => navigationAnchors.id),
  instruction: text('instruction').notNull(),
  helperText: text('helper_text'),
  arrowDirection: varchar('arrow_direction', {length: 40}).notNull(),
  distanceMeters: integer('distance_meters'),
  checkpointQrValue: varchar('checkpoint_qr_value', {length: 160}),
  isCheckpointRequired: boolean('is_checkpoint_required').default(false).notNull(),
  ...timestamps,
});

export const arNavigationRoutes = pgTable('ar_navigation_routes', {
  id: serial('id').primaryKey(),
  roomId: integer('room_id').references(() => rooms.id).notNull(),
  startAnchorId: integer('start_anchor_id').references(() => navigationAnchors.id).notNull(),
  title: varchar('title', {length: 180}).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  ...timestamps,
}, table => ({
  roomStartUnique: uniqueIndex('ar_navigation_routes_room_start_unique').on(
    table.roomId,
    table.startAnchorId,
  ),
}));

export const arNavigationRoutePoints = pgTable('ar_navigation_route_points', {
  id: serial('id').primaryKey(),
  routeId: integer('route_id').references(() => arNavigationRoutes.id).notNull(),
  pointOrder: integer('point_order').notNull(),
  pointType: varchar('point_type', {length: 40}).notNull(),
  label: varchar('label', {length: 160}),
  direction: varchar('direction', {length: 40}),
  x: doublePrecision('x').notNull(),
  y: doublePrecision('y').notNull(),
  z: doublePrecision('z').notNull(),
  ...timestamps,
}, table => ({
  routePointOrderUnique: uniqueIndex('ar_navigation_route_points_route_order_unique').on(
    table.routeId,
    table.pointOrder,
  ),
}));

export type Building = typeof buildings.$inferSelect;
export type Floor = typeof floors.$inferSelect;
export type RoomCategory = typeof roomCategories.$inferSelect;
export type Room = typeof rooms.$inferSelect;
export type RoomPerson = typeof roomPeople.$inferSelect;
export type RoomGalleryItem = typeof roomGallery.$inferSelect;
export type QrEntry = typeof qrEntries.$inferSelect;
export type NavigationDemoConfig = typeof navigationDemoConfigs.$inferSelect;
export type NavigationAnchor = typeof navigationAnchors.$inferSelect;
export type NavigationRoute = typeof navigationRoutes.$inferSelect;
export type NavigationRouteStep = typeof navigationRouteSteps.$inferSelect;
export type ArNavigationRoute = typeof arNavigationRoutes.$inferSelect;
export type ArNavigationRoutePoint = typeof arNavigationRoutePoints.$inferSelect;
