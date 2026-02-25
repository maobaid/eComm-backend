# Multi-Tenant Ecommerce SaaS Backend Specification

## 1. Architecture

- NestJS
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Multi-tenant architecture (single DB)
- Each business table must include store_id
- SUPER_ADMIN can access all data
- STORE_ADMIN and STAFF can access only their store

---

## 2. Core Models

### Store

- id (uuid)
- name
- slug (unique)
- subscription_plan
- allow_discount_stacking (boolean)
- is_active
- created_at

### User

- id
- store_id (nullable for SUPER_ADMIN)
- name
- email (unique)
- password_hash
- role (SUPER_ADMIN | STORE_ADMIN | STAFF)
- created_at

### Customer

- id
- store_id
- full_name
- phone_number (unique per store)
- email (nullable)
- created_at

### Address

- id
- store_id
- customer_id
- label
- street
- building_number
- apartment_number (nullable)
- city
- state (nullable)
- postal_code (nullable)
- country
- is_default (boolean)
- created_at

Rules:

- Customer can have multiple addresses
- Only one default address per customer
- Setting new default must unset previous
- Orders must reference address_id

---

### Category

- id
- store_id
- name
- slug
- parent_id (nullable)
- is_active
- created_at

### Product

- id
- store_id
- category_id (nullable)
- title
- description
- price
- image_url
- is_active
- created_at

---

## 3. Discount System

### Coupon (Code-Based)

- id
- store_id
- code (unique per store)
- type (PERCENTAGE | FIXED)
- value
- minimum_order_amount (nullable)
- expires_at
- usage_limit (nullable)
- usage_count
- is_active
- created_at

### ProductDiscount (Automatic)

- id
- store_id
- name
- percentage
- applies_to (ALL_PRODUCTS | CATEGORY | SPECIFIC_PRODUCTS)
- category_id (nullable)
- start_date
- end_date
- is_active
- created_at

### ProductDiscountItem

- id
- product_discount_id
- product_id

---

## 4. Order System

### Order

- id
- store_id
- customer_id
- address_id
- coupon_id (nullable)
- total_amount
- total_product_discount_amount
- total_coupon_discount_amount
- status (PENDING | CONFIRMED | SHIPPED | DELIVERED | CANCELLED)
- scheduled_delivery (nullable)
- created_at

### OrderItem

- id
- order_id
- product_id
- quantity
- unit_price
- product_discount_applied

---

## 5. DeliverySetting

- id
- store_id
- allow_scheduling
- default_message
- created_at

---

## 6. Analytics Requirements

Store-level:

- Total revenue
- Orders by status
- Top products
- Monthly revenue

Global:

- Total stores
- Total platform revenue
- Orders across all stores
- Monthly growth
