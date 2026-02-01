import { pgTable, text, uuid, timestamp, boolean, integer, decimal, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// Users table (customers) - بدون مصادقة
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 100 }),
  address: text("address"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Customers table (alias for users)
export const customers = users;

// User addresses table
export const userAddresses = pgTable("user_addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // تمت الإضافة: home, work, other
  title: varchar("title", { length: 100 }).notNull(),
  address: text("address").notNull(),
  details: text("details"), // تمت الإضافة
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Categories table
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 100 }).notNull(),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Restaurants table
export const restaurants = pgTable("restaurants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  image: text("image").notNull(), // تم تغيير إلى notNull
  phone: varchar("phone", { length: 20 }), // إضافة رقم هاتف المطعم
  rating: varchar("rating", { length: 10 }).default("0.0"),
  reviewCount: integer("review_count").default(0),
  deliveryTime: varchar("delivery_time", { length: 50 }).notNull(), // تم تغيير إلى notNull
  isOpen: boolean("is_open").default(true).notNull(),
  minimumOrder: decimal("minimum_order", { precision: 10, scale: 2 }).default("0"),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("0"),
  perKmFee: decimal("per_km_fee", { precision: 10, scale: 2 }).default("0"), // سعر الكيلومتر الواحد للمطعم
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("0"), // نسبة الشركة من المطعم
  categoryId: uuid("category_id").references(() => categories.id),
  openingTime: varchar("opening_time", { length: 50 }).default("08:00"), // تمت الإضافة
  closingTime: varchar("closing_time", { length: 50 }).default("23:00"), // تمت الإضافة
  workingDays: varchar("working_days", { length: 50 }).default("0,1,2,3,4,5,6"), // تمت الإضافة
  isTemporarilyClosed: boolean("is_temporarily_closed").default(false), // تمت الإضافة
  temporaryCloseReason: text("temporary_close_reason"), // تمت الإضافة
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  address: text("address"), // عنوان المطعم
  isFeatured: boolean("is_featured").default(false), // للمطاعم المفضلة
  isNew: boolean("is_new").default(false), // للمطاعم الجديدة
  isActive: boolean("is_active").default(true).notNull(), // حالة النشاط
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Menu items table
export const menuItems = pgTable("menu_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  image: text("image").notNull(), // تم تغيير إلى notNull
  category: varchar("category", { length: 100 }).notNull(), // تم تغيير إلى notNull
  isAvailable: boolean("is_available").default(true).notNull(),
  isSpecialOffer: boolean("is_special_offer").default(false).notNull(),
  restaurantId: uuid("restaurant_id").references(() => restaurants.id),
});

// Drivers table - بدون مصادقة
export const drivers = pgTable("drivers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  password: text("password").notNull(), // إضافة حقل كلمة المرور
  isAvailable: boolean("is_available").default(true).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("70"), // نسبة السائق من رسوم التوصيل
  paymentMode: varchar("payment_mode", { length: 20 }).default("commission").notNull(), // commission or salary
  salaryAmount: decimal("salary_amount", { precision: 10, scale: 2 }).default("0"), // الراتب الشهري إن وجد
  email: varchar("email", { length: 100 }),
  vehicleType: varchar("vehicle_type", { length: 50 }),
  vehicleNumber: varchar("vehicle_number", { length: 50 }),
  currentLocation: varchar("current_location", { length: 200 }),
  earnings: decimal("earnings", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Orders table
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  customerName: varchar("customer_name", { length: 100 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
  customerEmail: varchar("customer_email", { length: 100 }),
  customerId: uuid("customer_id").references(() => users.id),
  deliveryAddress: text("delivery_address").notNull(),
  customerLocationLat: decimal("customer_location_lat", { precision: 10, scale: 8 }), // إحداثيات العميل
  customerLocationLng: decimal("customer_location_lng", { precision: 11, scale: 8 }), // إحداثيات العميل
  notes: text("notes"),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  items: text("items").notNull(), // JSON string
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  estimatedTime: varchar("estimated_time", { length: 50 }).default("30-45 دقيقة"),
  driverEarnings: decimal("driver_earnings", { precision: 10, scale: 2 }).default("0"),
  restaurantEarnings: decimal("restaurant_earnings", { precision: 10, scale: 2 }).default("0"),
  companyEarnings: decimal("company_earnings", { precision: 10, scale: 2 }).default("0"),
  distance: decimal("distance", { precision: 10, scale: 2 }).default("0"),
  restaurantId: uuid("restaurant_id").references(() => restaurants.id),
  restaurantName: varchar("restaurant_name", { length: 200 }), // اسم المطعم للسهولة
  restaurantPhone: varchar("restaurant_phone", { length: 20 }), // رقم هاتف المطعم للسهولة
  driverId: uuid("driver_id").references(() => drivers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Special offers table
export const specialOffers = pgTable("special_offers", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(), // تم تغيير إلى notNull
  image: text("image").notNull(), // تمت الإضافة
  discountPercent: integer("discount_percent"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }),
  minimumOrder: decimal("minimum_order", { precision: 10, scale: 2 }).default("0"),
  restaurantId: uuid("restaurant_id").references(() => restaurants.id), // ربط العرض بمطعم محدد
  validUntil: timestamp("valid_until"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Admin users table - بدون مصادقة
export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  username: varchar("username", { length: 50 }).unique(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  userType: varchar("user_type", { length: 50 }).default("admin").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// System settings table
export const systemSettings = pgTable("system_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  category: varchar("category", { length: 100 }).default("general"),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// UI settings table (alias for system_settings)
export const uiSettings = systemSettings;

// Restaurant sections table
export const restaurantSections = pgTable("restaurant_sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id").references(() => restaurants.id),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Ratings table
export const ratings = pgTable("ratings", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").references(() => orders.id),
  restaurantId: uuid("restaurant_id").references(() => restaurants.id),
  customerName: varchar("customer_name", { length: 100 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  isApproved: boolean("is_approved").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  recipientType: varchar("recipient_type", { length: 50 }).notNull(),
  recipientId: uuid("recipient_id"),
  orderId: uuid("order_id").references(() => orders.id),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Order tracking table
export const orderTracking = pgTable("order_tracking", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").references(() => orders.id).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  message: text("message").notNull(),
  createdBy: uuid("created_by").notNull(),
  createdByType: varchar("created_by_type", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Wallets table
export const wallets = pgTable("wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerPhone: varchar("customer_phone", { length: 20 }).unique().notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0.00"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Wallet transactions table
export const walletTransactions = pgTable("wallet_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  walletId: uuid("wallet_id").references(() => wallets.id),
  type: varchar("type", { length: 50 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  orderId: uuid("order_id").references(() => orders.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// System settings table (removed duplicate)
export const systemSettingsTable = pgTable("system_settings_table", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 100 }).unique().notNull(),
  value: text("value").notNull(),
  category: varchar("category", { length: 50 }),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Restaurant earnings table
export const restaurantEarnings = pgTable("restaurant_earnings", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id").references(() => restaurants.id),
  ownerName: varchar("owner_name", { length: 100 }).notNull(),
  ownerPhone: varchar("owner_phone", { length: 20 }).notNull(),
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).default("0.00"),
  pendingAmount: decimal("pending_amount", { precision: 10, scale: 2 }).default("0.00"),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0.00"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Cart table - جدول السلة
export const cart = pgTable("cart", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  menuItemId: uuid("menu_item_id").references(() => menuItems.id).notNull(),
  restaurantId: uuid("restaurant_id").references(() => restaurants.id).notNull(),
  quantity: integer("quantity").default(1).notNull(),
  specialInstructions: text("special_instructions"),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

// Favorites table - جدول المفضلة
export const favorites = pgTable("favorites", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  restaurantId: uuid("restaurant_id").references(() => restaurants.id).notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

// New tables for Advanced Features
export const driverReviews = pgTable("driver_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  driverId: uuid("driver_id").references(() => drivers.id).notNull(),
  orderId: uuid("order_id").references(() => orders.id).notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const driverEarningsTable = pgTable("driver_earnings_table", {
  id: uuid("id").primaryKey().defaultRandom(),
  driverId: uuid("driver_id").references(() => drivers.id).notNull(),
  totalEarned: decimal("total_earned", { precision: 10, scale: 2 }).default("0"),
  withdrawn: decimal("withdrawn", { precision: 10, scale: 2 }).default("0"),
  pending: decimal("pending", { precision: 10, scale: 2 }).default("0"),
  lastPaidAt: timestamp("last_paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const driverWallets = pgTable("driver_wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  driverId: uuid("driver_id").references(() => drivers.id).notNull().unique(),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Driver balance table (Admin interface expects these specific fields)
export const driverBalances = pgTable("driver_balances", {
  id: uuid("id").primaryKey().defaultRandom(),
  driverId: uuid("driver_id").references(() => drivers.id).notNull().unique(),
  totalBalance: decimal("total_balance", { precision: 10, scale: 2 }).default("0").notNull(),
  availableBalance: decimal("available_balance", { precision: 10, scale: 2 }).default("0").notNull(),
  withdrawnAmount: decimal("withdrawn_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  pendingAmount: decimal("pending_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Driver transactions table
export const driverTransactions = pgTable("driver_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  driverId: uuid("driver_id").references(() => drivers.id).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // commission, salary, bonus, deduction, withdrawal
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  balanceBefore: decimal("balance_before", { precision: 10, scale: 2 }).default("0"),
  balanceAfter: decimal("balance_after", { precision: 10, scale: 2 }).default("0"),
  referenceId: varchar("reference_id", { length: 100 }), // orderId or withdrawalId
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Driver commissions table
export const driverCommissions = pgTable("driver_commissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  driverId: uuid("driver_id").references(() => drivers.id).notNull(),
  orderId: uuid("order_id").references(() => orders.id).notNull(),
  orderAmount: decimal("order_amount", { precision: 10, scale: 2 }).notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(),
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(), // pending, approved, paid
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Driver withdrawals table
export const driverWithdrawals = pgTable("driver_withdrawals", {
  id: uuid("id").primaryKey().defaultRandom(),
  driverId: uuid("driver_id").references(() => drivers.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(), // pending, approved, rejected, completed
  bankDetails: text("bank_details"),
  adminNotes: text("admin_notes"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const restaurantWallets = pgTable("restaurant_wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id").references(() => restaurants.id).notNull().unique(),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const commissionSettings = pgTable("commission_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: varchar("type", { length: 50 }).notNull(), // default, restaurant, driver
  entityId: uuid("entity_id"), // null if default
  commissionPercent: decimal("commission_percent", { precision: 5, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityType: varchar("entity_type", { length: 50 }).notNull(), // driver, restaurant
  entityId: uuid("entity_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(), // pending, approved, rejected, completed
  bankDetails: text("bank_details"),
  adminNotes: text("admin_notes"),
  rejectionReason: text("rejection_reason"),
  approvedBy: uuid("approved_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const driverWorkSessions = pgTable("driver_work_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  driverId: uuid("driver_id").references(() => drivers.id).notNull(),
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  isActive: boolean("is_active").default(true).notNull(),
  totalDeliveries: integer("total_deliveries").default(0),
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// HR Management Tables
export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }).notNull(),
  position: varchar("position", { length: 50 }).notNull(), // admin, manager, support, accountant, hr
  department: varchar("department", { length: 50 }).notNull(),
  salary: decimal("salary", { precision: 10, scale: 2 }).notNull(),
  hireDate: timestamp("hire_date").defaultNow().notNull(),
  status: varchar("status", { length: 20 }).default("active").notNull(), // active, inactive, on_leave, terminated
  address: text("address"),
  emergencyContact: varchar("emergency_contact", { length: 100 }),
  permissions: text("permissions"), // JSON string or comma-separated
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const attendance = pgTable("attendance", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id").references(() => employees.id).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  checkIn: timestamp("check_in"),
  checkOut: timestamp("check_out"),
  status: varchar("status", { length: 20 }).notNull(), // present, absent, late, early_leave, on_leave
  hoursWorked: decimal("hours_worked", { precision: 4, scale: 2 }),
  notes: text("notes"),
});

export const leaveRequests = pgTable("leave_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id").references(() => employees.id).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // annual, sick, emergency, unpaid
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, approved, rejected
  reason: text("reason"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).partial({
  id: true,
  createdAt: true,
  isActive: true,
});
export const selectUserSchema = createSelectSchema(users);
export type User = z.infer<typeof selectUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

export const insertUserAddressSchema = createInsertSchema(userAddresses).partial({
  id: true,
  createdAt: true,
  isDefault: true,
});
export const selectUserAddressSchema = createSelectSchema(userAddresses);
export type UserAddress = z.infer<typeof selectUserAddressSchema>;
export type InsertUserAddress = z.infer<typeof insertUserAddressSchema>;

export const insertCategorySchema = createInsertSchema(categories).partial({
  id: true,
  createdAt: true,
  updatedAt: true,
  isActive: true,
  sortOrder: true,
});
export const selectCategorySchema = createSelectSchema(categories);
export type Category = z.infer<typeof selectCategorySchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export const insertRestaurantSchema = createInsertSchema(restaurants).partial({
  id: true,
  createdAt: true,
  updatedAt: true,
  isActive: true,
  isOpen: true,
  isFeatured: true,
  isNew: true,
  isTemporarilyClosed: true,
  rating: true,
  reviewCount: true,
  minimumOrder: true,
  deliveryFee: true,
  perKmFee: true,
  commissionRate: true,
  openingTime: true,
  closingTime: true,
  workingDays: true,
});
export const selectRestaurantSchema = createSelectSchema(restaurants);
export type Restaurant = z.infer<typeof selectRestaurantSchema>;
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;

export const insertMenuItemSchema = createInsertSchema(menuItems).partial({
  id: true,
  isAvailable: true,
  isSpecialOffer: true,
});
export const selectMenuItemSchema = createSelectSchema(menuItems);
export type MenuItem = z.infer<typeof selectMenuItemSchema>;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;

export const insertOrderSchema = createInsertSchema(orders).partial({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  orderNumber: true,
  distance: true,
  driverEarnings: true,
  restaurantEarnings: true,
  companyEarnings: true,
});
export const selectOrderSchema = createSelectSchema(orders);
export type Order = z.infer<typeof selectOrderSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export const insertDriverSchema = createInsertSchema(drivers).extend({
  commissionRate: z.preprocess((val) => val === null || val === undefined ? undefined : String(val), z.string().optional()),
  salaryAmount: z.preprocess((val) => val === null || val === undefined ? undefined : String(val), z.string().optional()),
  earnings: z.preprocess((val) => val === null || val === undefined ? undefined : String(val), z.string().optional()),
}).partial({
  id: true,
  createdAt: true,
  isAvailable: true,
  isActive: true,
  paymentMode: true,
  email: true,
  vehicleType: true,
  vehicleNumber: true,
  currentLocation: true,
  updatedAt: true,
});
export const selectDriverSchema = createSelectSchema(drivers);
export type Driver = z.infer<typeof selectDriverSchema>;
export type InsertDriver = z.infer<typeof insertDriverSchema>;

export const insertSpecialOfferSchema = createInsertSchema(specialOffers).partial({
  id: true,
  createdAt: true,
  isActive: true,
  minimumOrder: true,
});
export const selectSpecialOfferSchema = createSelectSchema(specialOffers);
export type SpecialOffer = z.infer<typeof selectSpecialOfferSchema>;
export type InsertSpecialOffer = z.infer<typeof insertSpecialOfferSchema>;

export const insertAdminUserSchema = createInsertSchema(adminUsers).partial({
  id: true,
  createdAt: true,
  isActive: true,
  userType: true,
});
export const selectAdminUserSchema = createSelectSchema(adminUsers);
export type AdminUser = z.infer<typeof selectAdminUserSchema>;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;

export const insertUiSettingsSchema = createInsertSchema(uiSettings).partial({
  id: true,
  createdAt: true,
  updatedAt: true,
  isActive: true,
  category: true,
});
export const selectUiSettingsSchema = createSelectSchema(uiSettings);
export type UiSettings = z.infer<typeof selectUiSettingsSchema>;
export type InsertUiSettings = z.infer<typeof insertUiSettingsSchema>;

export const insertRestaurantSectionSchema = createInsertSchema(restaurantSections).partial({
  id: true,
  createdAt: true,
  isActive: true,
  sortOrder: true,
});
export const selectRestaurantSectionSchema = createSelectSchema(restaurantSections);
export type RestaurantSection = z.infer<typeof selectRestaurantSectionSchema>;
export type InsertRestaurantSection = z.infer<typeof insertRestaurantSectionSchema>;

export const insertRatingSchema = createInsertSchema(ratings).partial({
  id: true,
  createdAt: true,
  isApproved: true,
});
export const selectRatingSchema = createSelectSchema(ratings);
export type Rating = z.infer<typeof selectRatingSchema>;
export type InsertRating = z.infer<typeof insertRatingSchema>;

export const insertNotificationSchema = createInsertSchema(notifications).partial({
  id: true,
  createdAt: true,
  isRead: true,
});
export const selectNotificationSchema = createSelectSchema(notifications);
export type Notification = z.infer<typeof selectNotificationSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export const insertWalletSchema = createInsertSchema(wallets).partial({
  id: true,
  createdAt: true,
  updatedAt: true,
  isActive: true,
  balance: true,
});
export const selectWalletSchema = createSelectSchema(wallets);
export type Wallet = z.infer<typeof selectWalletSchema>;
export type InsertWallet = z.infer<typeof insertWalletSchema>;

export const insertWalletTransactionSchema = createInsertSchema(walletTransactions).partial({
  id: true,
  createdAt: true,
});
export const selectWalletTransactionSchema = createSelectSchema(walletTransactions);
export type WalletTransaction = z.infer<typeof selectWalletTransactionSchema>;
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;

export const insertSystemSettingsSchema = createInsertSchema(systemSettingsTable).partial({
  id: true,
  createdAt: true,
  updatedAt: true,
  isActive: true,
});
export const selectSystemSettingsSchema = createSelectSchema(systemSettingsTable);
export type SystemSettings = z.infer<typeof selectSystemSettingsSchema>;
export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;

export const insertRestaurantEarningsSchema = createInsertSchema(restaurantEarnings).partial({
  id: true,
  createdAt: true,
  updatedAt: true,
  isActive: true,
  totalEarnings: true,
  pendingAmount: true,
  paidAmount: true,
});
export const selectRestaurantEarningsSchema = createSelectSchema(restaurantEarnings);
export type RestaurantEarnings = z.infer<typeof selectRestaurantEarningsSchema>;
export type InsertRestaurantEarnings = z.infer<typeof insertRestaurantEarningsSchema>;

export const insertCartSchema = createInsertSchema(cart).partial({
  id: true,
  addedAt: true,
  quantity: true,
});
export const selectCartSchema = createSelectSchema(cart);
export type Cart = z.infer<typeof selectCartSchema>;
export type InsertCart = z.infer<typeof insertCartSchema>;

export const insertFavoritesSchema = createInsertSchema(favorites).partial({
  id: true,
  addedAt: true,
});
export const selectFavoritesSchema = createSelectSchema(favorites);
export type Favorites = z.infer<typeof selectFavoritesSchema>;
export type InsertFavorites = z.infer<typeof insertFavoritesSchema>;

// New schemas for Advanced Features
export const insertDriverReviewSchema = createInsertSchema(driverReviews).partial({
  id: true,
  createdAt: true,
});
export const selectDriverReviewSchema = createSelectSchema(driverReviews);
export type DriverReview = z.infer<typeof selectDriverReviewSchema>;
export type InsertDriverReview = z.infer<typeof insertDriverReviewSchema>;

export const insertDriverEarningsSchema = createInsertSchema(driverEarningsTable).partial({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalEarned: true,
  withdrawn: true,
  pending: true,
});
export const selectDriverEarningsSchema = createSelectSchema(driverEarningsTable);
export type DriverEarnings = z.infer<typeof selectDriverEarningsSchema>;
export type InsertDriverEarnings = z.infer<typeof insertDriverEarningsSchema>;

export const insertDriverWalletSchema = createInsertSchema(driverWallets).partial({
  id: true,
  createdAt: true,
  updatedAt: true,
  isActive: true,
  balance: true,
});
export const selectDriverWalletSchema = createSelectSchema(driverWallets);
export type DriverWallet = z.infer<typeof selectDriverWalletSchema>;
export type InsertDriverWallet = z.infer<typeof insertDriverWalletSchema>;

export const insertDriverBalanceSchema = createInsertSchema(driverBalances).partial({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalBalance: true,
  availableBalance: true,
  withdrawnAmount: true,
  pendingAmount: true,
});
export const selectDriverBalanceSchema = createSelectSchema(driverBalances);
export type DriverBalance = z.infer<typeof selectDriverBalanceSchema>;
export type InsertDriverBalance = z.infer<typeof insertDriverBalanceSchema>;

export const insertDriverTransactionSchema = createInsertSchema(driverTransactions).partial({
  id: true,
  createdAt: true,
  balanceBefore: true,
  balanceAfter: true,
});
export const selectDriverTransactionSchema = createSelectSchema(driverTransactions);
export type DriverTransaction = z.infer<typeof selectDriverTransactionSchema>;
export type InsertDriverTransaction = z.infer<typeof insertDriverTransactionSchema>;

export const insertDriverCommissionSchema = createInsertSchema(driverCommissions).partial({
  id: true,
  createdAt: true,
  status: true,
});
export const selectDriverCommissionSchema = createSelectSchema(driverCommissions);
export type DriverCommission = z.infer<typeof selectDriverCommissionSchema>;
export type InsertDriverCommission = z.infer<typeof insertDriverCommissionSchema>;

export const insertDriverWithdrawalSchema = createInsertSchema(driverWithdrawals).partial({
  id: true,
  createdAt: true,
  status: true,
  processedAt: true,
});
export const selectDriverWithdrawalSchema = createSelectSchema(driverWithdrawals);
export type DriverWithdrawal = z.infer<typeof selectDriverWithdrawalSchema>;
export type InsertDriverWithdrawal = z.infer<typeof insertDriverWithdrawalSchema>;

export const insertRestaurantWalletSchema = createInsertSchema(restaurantWallets).partial({
  id: true,
  createdAt: true,
  updatedAt: true,
  isActive: true,
  balance: true,
});
export const selectRestaurantWalletSchema = createSelectSchema(restaurantWallets);
export type RestaurantWallet = z.infer<typeof selectRestaurantWalletSchema>;
export type InsertRestaurantWallet = z.infer<typeof insertRestaurantWalletSchema>;

export const insertCommissionSettingsSchema = createInsertSchema(commissionSettings).partial({
  id: true,
  createdAt: true,
  updatedAt: true,
  isActive: true,
});
export const selectCommissionSettingsSchema = createSelectSchema(commissionSettings);
export type CommissionSettings = z.infer<typeof selectCommissionSettingsSchema>;
export type InsertCommissionSettings = z.infer<typeof insertCommissionSettingsSchema>;

export const insertWithdrawalRequestSchema = createInsertSchema(withdrawalRequests).partial({
  id: true,
  submittedAt: true,
  updatedAt: true,
  status: true,
});
export const selectWithdrawalRequestSchema = createSelectSchema(withdrawalRequests);
export type WithdrawalRequest = z.infer<typeof selectWithdrawalRequestSchema>;
export type InsertWithdrawalRequest = z.infer<typeof insertWithdrawalRequestSchema>;

export const insertDriverWorkSessionSchema = createInsertSchema(driverWorkSessions).partial({
  id: true,
  startTime: true,
  isActive: true,
  totalDeliveries: true,
  totalEarnings: true,
  createdAt: true,
});
export const selectDriverWorkSessionSchema = createSelectSchema(driverWorkSessions);
export type DriverWorkSession = z.infer<typeof selectDriverWorkSessionSchema>;
export type InsertDriverWorkSession = z.infer<typeof insertDriverWorkSessionSchema>;

export const insertEmployeeSchema = createInsertSchema(employees).partial({
  id: true,
  createdAt: true,
  updatedAt: true,
  hireDate: true,
  status: true,
  permissions: true,
  department: true,
  position: true,
  salary: true,
  address: true,
  emergencyContact: true,
});
export const selectEmployeeSchema = createSelectSchema(employees);
export type Employee = z.infer<typeof selectEmployeeSchema>;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export const insertAttendanceSchema = createInsertSchema(attendance).partial({
  id: true,
  date: true,
  checkIn: true,
  checkOut: true,
  status: true,
  hoursWorked: true,
  notes: true,
});
export const selectAttendanceSchema = createSelectSchema(attendance);
export type Attendance = z.infer<typeof selectAttendanceSchema>;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

export const insertLeaveRequestSchema = createInsertSchema(leaveRequests).partial({
  id: true,
  status: true,
  submittedAt: true,
  reason: true,
});
export const selectLeaveRequestSchema = createSelectSchema(leaveRequests);
export type LeaveRequest = z.infer<typeof selectLeaveRequestSchema>;
export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;


// Delivery fee settings table
export const deliveryFeeSettings = pgTable("delivery_fee_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id").references(() => restaurants.id), // null for global settings
  type: varchar("type", { length: 50 }).default("per_km").notNull(), // fixed, per_km, zone_based, restaurant_custom
  baseFee: decimal("base_fee", { precision: 10, scale: 2 }).default("0"),
  perKmFee: decimal("per_km_fee", { precision: 10, scale: 2 }).default("0"),
  minFee: decimal("min_fee", { precision: 10, scale: 2 }).default("0"),
  maxFee: decimal("max_fee", { precision: 10, scale: 2 }).default("1000"),
  freeDeliveryThreshold: decimal("free_delivery_threshold", { precision: 10, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Delivery zones table
export const deliveryZones = pgTable("delivery_zones", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  minDistance: decimal("min_distance", { precision: 10, scale: 2 }).default("0"),
  maxDistance: decimal("max_distance", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).notNull(),
  estimatedTime: varchar("estimated_time", { length: 50 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Company financial reports table
export const financialReports = pgTable("financial_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  periodType: varchar("period_type", { length: 20 }).notNull(), // daily, weekly, monthly, yearly
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  totalOrders: integer("total_orders").default(0),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default("0"),
  totalDeliveryFees: decimal("total_delivery_fees", { precision: 12, scale: 2 }).default("0"),
  totalDriverEarnings: decimal("total_driver_earnings", { precision: 12, scale: 2 }).default("0"),
  totalRestaurantEarnings: decimal("total_restaurant_earnings", { precision: 12, scale: 2 }).default("0"),
  totalCompanyProfit: decimal("total_company_profit", { precision: 12, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Re-export schemas
export const insertDeliveryFeeSettingsSchema = createInsertSchema(deliveryFeeSettings).partial({
  id: true,
  createdAt: true,
  updatedAt: true,
  isActive: true,
  baseFee: true,
  perKmFee: true,
  minFee: true,
  maxFee: true,
  freeDeliveryThreshold: true,
});
export const selectDeliveryFeeSettingsSchema = createSelectSchema(deliveryFeeSettings);
export type DeliveryFeeSetting = z.infer<typeof selectDeliveryFeeSettingsSchema>;
export type InsertDeliveryFeeSetting = z.infer<typeof insertDeliveryFeeSettingsSchema>;

export const insertDeliveryZoneSchema = createInsertSchema(deliveryZones).partial({
  id: true,
  createdAt: true,
  isActive: true,
  minDistance: true,
  description: true,
  estimatedTime: true,
});
export const selectDeliveryZoneSchema = createSelectSchema(deliveryZones);
export type DeliveryZone = z.infer<typeof selectDeliveryZoneSchema>;
export type InsertDeliveryZone = z.infer<typeof insertDeliveryZoneSchema>;

export const insertFinancialReportSchema = createInsertSchema(financialReports).partial({
  id: true,
  createdAt: true,
  totalOrders: true,
  totalRevenue: true,
  totalDeliveryFees: true,
  totalDriverEarnings: true,
  totalRestaurantEarnings: true,
  totalCompanyProfit: true,
});
export const selectFinancialReportSchema = createSelectSchema(financialReports);
export type FinancialReport = z.infer<typeof selectFinancialReportSchema>;
export type InsertFinancialReport = z.infer<typeof insertFinancialReportSchema>;
