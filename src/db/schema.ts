import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
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

export type Building = typeof buildings.$inferSelect;
export type Floor = typeof floors.$inferSelect;
export type RoomCategory = typeof roomCategories.$inferSelect;
export type Room = typeof rooms.$inferSelect;
export type RoomPerson = typeof roomPeople.$inferSelect;
export type RoomGalleryItem = typeof roomGallery.$inferSelect;
export type QrEntry = typeof qrEntries.$inferSelect;
export type NavigationDemoConfig = typeof navigationDemoConfigs.$inferSelect;
