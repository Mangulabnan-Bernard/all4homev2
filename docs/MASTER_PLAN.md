I have all five expert outputs. This is a synthesis task — I'll reconcile them into one master document. No codebase exploration is needed since this is a from-scratch rebuild and the experts have provided canonical artifacts. Let me resolve the key conflicts before writing.

**Conflicts I must reconcile (DB schema is the contract):**

1. **Booking provider FK**: DB schema says `Booking.providerId` → `ProviderProfile.id`. Domain expert references `booking.providerUserId` and `providerProfileId`. I must standardize: `providerId` = `ProviderProfile.id`; the provider's User id is reached via `booking.provider.userId`. I'll fix the domain code accordingly.

2. **Review fields**: DB uses `providerId` (ProviderProfile id) + `authorId`/`targetId`. Domain expert used `providerProfileId`. Reconcile to DB: `providerId`.

3. **Notification field**: DB uses `read` (not `isRead`). Domain expert wrote `isRead`. Reconcile to `read`.

4. **Message field**: DB uses `content` (not `body`). Domain expert wrote `body`. Reconcile to `content`.

5. **Conversation**: DB uses `participantAId`/`participantBId` with `@@unique([participantAId, participantBId])`. Domain expert proposed `customerId/providerId/bookingId`. Reconcile to DB's participant model (no bookingId on conversation).

6. **NotificationType enum**: DB defines canonical values (`BOOKING_IN_PROGRESS`, `BOOKING_COMPLETED`, `MESSAGE_RECEIVED`, `DOCUMENT_VERIFIED`, `DISPUTE_RESOLVED`). Domain expert used non-existent ones (`WORK_STARTED`, `WORK_COMPLETED`, `BOOKING_CLOSED`, `NEW_MESSAGE`, `DISPUTE_OPENED`, `DOCUMENT_APPROVED/REJECTED`). Reconcile to DB enum; map domain events onto canonical values.

7. **AuditAction enum**: DB defines verb-style values (`CREATE`, `UPDATE`, `APPROVE`, `STATUS_CHANGE`, etc.). Auth expert used `USER_CREATED`, `PASSWORD_RESET`, `BOOKING_ACCEPTED` and `userId`/`meta` fields. DB AuditLog uses `actorId`, `action`, `entity`, `entityId`, `metadata`. Reconcile to DB: `action: STATUS_CHANGE`, `entity: "Booking"`, etc., `actorId`, `metadata`.

8. **VerificationStatus**: DB has 4 values (PENDING/APPROVED/REJECTED/SUSPENDED). Domain expert said 3. Reconcile to DB's 4.

9. **DocumentType**: DB canonical (`ID_CARD`, `BUSINESS_LICENSE`, etc.). Domain expert used `ID_PROOF`, `BUSINESS_PERMIT`. Reconcile to DB.

10. **Permissions location**: Auth expert uses `src/lib/permissions/{matrix,can,guard}.ts`; app expert uses `{index,rbac,ownership,guards}.ts`; domain expert adds `booking-transitions.ts`, `assert-transition.ts`. I'll unify into one canonical permissions folder.

11. **TransactionCounter model**: Domain expert added a `TransactionCounter` model not in the required 18. I'll include it as a supporting (non-business) table and note it's additive.

12. **Auth lib location**: Auth expert uses `src/auth.ts`; app expert uses `src/lib/auth/`. I'll reconcile to `src/auth.ts` + `src/auth.config.ts` (Auth.js v5 convention) with `src/lib/auth/` helpers, and `src/lib/prisma.ts` as the singleton (app expert's `src/lib/prisma/index.ts` → standardize to `src/lib/prisma.ts`).

Now I'll write the master document.

---

# All4Home V2 — MASTER REBUILD PLAN

> Single source of truth for the build phase. The Database Architect's `schema.prisma` is the binding contract; wherever an expert artifact used a divergent model/field/enum name, it has been reconciled **to the schema** and the corrected form appears below. Canonical conventions: `src/` root, `src/actions/<domain>/`, `src/lib/validators/<domain>.ts`, `src/lib/permissions/`, Prisma models PascalCase singular with `@@map` snake_case plural.

---

## 1. Executive Summary & Architecture Overview

All4Home V2 is a production-ready home-services marketplace (TaskRabbit / Thumbtack / Airtasker style) rebuilt from scratch on **Next.js 16 (App Router) + TypeScript strict**, **MySQL + Prisma**, **Auth.js / NextAuth v5**, **Tailwind + shadcn/ui**, **React Hook Form + Zod**, and **Zustand for transient UI state only**. The old project is a *requirements + UI-design reference only* — none of its mock DB, localStorage business data, fake auth, or broken payment code is preserved.

**Architectural pillars**

1. **Vertical slices per domain.** Each domain (`auth`, `bookings`, `providers`, `payments`, `reviews`, `disputes`, `notifications`, `messages`, `categories`, `user`, `admin`) owns its server actions (`src/actions/<domain>/`), Zod validators (`src/lib/validators/<domain>.ts`), RSC queries (`src/features/<domain>/queries.ts`), and UI (`src/features/<domain>/components/`).
2. **Reads are RSC; writes are Server Actions.** No client component ever imports Prisma or touches the business DB. Route Handlers (`src/app/api/*`) are reserved for NextAuth, health, and the simulated-payment internal webhook.
3. **Session-derived identity, always.** Caller identity comes exclusively from `auth()` server-side. Client-supplied `userId`/`role`/`customerId` is never trusted for authorization — this single rule eliminates the IDOR / broken-access-control bug class.
4. **Uniform action contract.** Every mutation returns a typed `Result<T>` discriminated union; nothing throws to the client. Errors map to toasts; validation errors map to RHF field errors.
5. **Transactional integrity.** All multi-row mutations (booking+payment, dispute resolution, review+aggregate, message+notification) run inside `prisma.$transaction` with row-locking reads for state transitions.

**Request / data-flow**

- **RSC read flow:** Browser requests a route → `middleware.ts` coarse-gates by role (reads role from signed JWT at the edge, **zero DB hit**) → matched RSC page calls a `features/<domain>/queries.ts` function → Prisma reads MySQL → serializable DTO (`src/types/dto.ts`) returned → HTML streamed with `loading.tsx` suspense fallback and `error.tsx`/`not-found.tsx` boundaries.
- **Server-action mutation flow:** Client component (RHF + Zod resolver for UX) invokes a server action via the `use-action` hook → action runs the fixed pipeline: `requireUser()`/`requireCan(action)` (identity + capability from session) → `schema.parse(input)` (Zod boundary, `.strict()`) → load resource by id from DB → `assertCanOn` (ownership) → state-machine guard (`assertTransition`) → `prisma.$transaction` (mutate + `AuditLog` + `Notification`) → `revalidatePath`/`revalidateTag` → return `Result<T>` → `mapResultToToast()` surfaces success/error.
- **Session-derived identity:** the JWT carries `{ id, role }`; `requireUser()` re-reads `isActive`/`role` from MySQL so a banned user is rejected at the action layer even with a cryptographically valid token.

---

## 2. Final Prisma Schema

> Reconciled, authoritative `prisma/schema.prisma`. This is the binding contract. (Note: `TransactionCounter` is an additive supporting table — not business data — required by the concurrency-safe transaction-number generator in §6.2; it sits alongside the 18 required models.)

```prisma
// ============================================================================
// All4Home V2 — Prisma Schema (MASTER, reconciled)
// Datasource: MySQL | ORM: Prisma | Auth: Auth.js / NextAuth v5
// Conventions: PascalCase singular models, @@map snake_case plural tables,
//   @map snake_case columns, cuid() ids, explicit @relation onDelete,
//   @@index on every FK + hot filter column.
// ============================================================================

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// ----------------------------------------------------------------------------
// ENUMS (canonical)
// ----------------------------------------------------------------------------

enum UserRole {
  CUSTOMER
  PROVIDER
  ADMIN
}

enum VerificationStatus {
  PENDING
  APPROVED
  REJECTED
  SUSPENDED
}

enum BookingStatus {
  PENDING
  ACCEPTED
  IN_PROGRESS
  COMPLETED
  CONFIRMED
  CLOSED
  CANCELED
  DISPUTED
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

enum PaymentMethod {
  SIMULATED_CARD
  SIMULATED_WALLET
  SIMULATED_BANK
}

enum NotificationType {
  BOOKING_CREATED
  BOOKING_ACCEPTED
  BOOKING_IN_PROGRESS
  BOOKING_COMPLETED
  BOOKING_CONFIRMED
  BOOKING_CANCELED
  BOOKING_DISPUTED
  PAYMENT_COMPLETED
  PAYMENT_REFUNDED
  REVIEW_RECEIVED
  MESSAGE_RECEIVED
  PROVIDER_APPROVED
  PROVIDER_REJECTED
  DOCUMENT_VERIFIED
  DISPUTE_RESOLVED
  SYSTEM
}

enum DisputeStatus {
  OPEN
  UNDER_REVIEW
  RESOLVED
  REJECTED
  CLOSED
}

enum DocumentType {
  ID_CARD
  PASSPORT
  DRIVERS_LICENSE
  BUSINESS_LICENSE
  CERTIFICATION
  INSURANCE
  PROOF_OF_ADDRESS
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  LOGIN
  LOGOUT
  APPROVE
  REJECT
  SUSPEND
  REFUND
  STATUS_CHANGE
}

// ----------------------------------------------------------------------------
// AUTH.JS v5 CORE
// ----------------------------------------------------------------------------

model User {
  id         String   @id @default(cuid())
  name       String?
  email      String   @unique
  image      String?
  password   String? // nullable for OAuth-only accounts
  role       UserRole @default(CUSTOMER)
  phone      String?
  address    String?  @db.Text
  isActive   Boolean  @default(true) @map("is_active")
  isVerified Boolean  @default(false) @map("is_verified")
  darkMode   Boolean  @default(false) @map("dark_mode")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  accounts Account[]
  sessions Session[]

  providerProfile  ProviderProfile?
  bookings         Booking[]          @relation("CustomerBookings")
  reviewsAuthored  Review[]           @relation("ReviewAuthor")
  reviewsReceived  Review[]           @relation("ReviewTarget")
  notifications    Notification[]
  disputesRaised   Dispute[]          @relation("DisputeRaisedBy")
  disputesResolved Dispute[]          @relation("DisputeResolvedBy")
  auditLogs        AuditLog[]         @relation("AuditActor")
  favorites        FavoriteProvider[] @relation("FavoriteCustomer")
  favoritedBy      FavoriteProvider[] @relation("FavoriteProvider")
  messages         Message[]          @relation("MessageSender")
  conversationsAsA Conversation[]     @relation("ConversationParticipantA")
  conversationsAsB Conversation[]     @relation("ConversationParticipantB")

  @@index([role])
  @@index([isActive])
  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String  @map("user_id")
  type              String
  provider          String
  providerAccountId String  @map("provider_account_id")
  refresh_token     String? @db.Text @map("refresh_token")
  access_token      String? @db.Text @map("access_token")
  expires_at        Int?    @map("expires_at")
  token_type        String? @map("token_type")
  scope             String?
  id_token          String? @db.Text @map("id_token")
  session_state     String? @map("session_state")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique @map("session_token")
  userId       String   @map("user_id")
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

// ----------------------------------------------------------------------------
// PROVIDER DOMAIN
// ----------------------------------------------------------------------------

model ProviderProfile {
  id                 String             @id @default(cuid())
  userId             String             @unique @map("user_id")
  categoryId         String?            @map("category_id")
  bio                String?            @db.Text
  description        String?            @db.Text
  hourlyRate         Decimal            @default(0) @db.Decimal(10, 2) @map("hourly_rate")
  experienceYears    Int                @default(0) @map("experience_years")
  serviceRadiusKm    Int                @default(10) @map("service_radius_km")
  averageRating      Float              @default(0) @map("average_rating")
  reviewCount        Int                @default(0) @map("review_count")
  verificationStatus VerificationStatus @default(PENDING) @map("verification_status")
  approvedAt         DateTime?          @map("approved_at")
  createdAt          DateTime           @default(now()) @map("created_at")
  updatedAt          DateTime           @updatedAt @map("updated_at")

  user         User                   @relation(fields: [userId], references: [id], onDelete: Cascade)
  category     ServiceCategory?       @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  services     Service[]
  bookings     Booking[]              @relation("ProviderBookings")
  reviews      Review[]               @relation("ProviderReviews")
  documents    ProviderDocument[]
  availability ProviderAvailability[]

  @@index([categoryId])
  @@index([averageRating])
  @@index([verificationStatus])
  @@map("provider_profiles")
}

model ServiceCategory {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?  @db.Text
  icon        String?
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  services         Service[]
  providerProfiles ProviderProfile[]

  @@index([isActive])
  @@map("service_categories")
}

model Service {
  id          String   @id @default(cuid())
  providerId  String   @map("provider_id")
  categoryId  String   @map("category_id")
  title       String
  description String?  @db.Text
  price       Decimal  @db.Decimal(10, 2)
  durationMin Int      @default(60) @map("duration_min")
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  provider ProviderProfile @relation(fields: [providerId], references: [id], onDelete: Cascade)
  category ServiceCategory @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  bookings Booking[]

  @@index([providerId])
  @@index([categoryId])
  @@index([isActive])
  @@map("services")
}

model ProviderAvailability {
  id         String   @id @default(cuid())
  providerId String   @map("provider_id")
  dayOfWeek  Int      @map("day_of_week") // 0 = Sunday ... 6 = Saturday
  startTime  String   @map("start_time") // "HH:mm" 24h
  endTime    String   @map("end_time") // "HH:mm" 24h
  isActive   Boolean  @default(true) @map("is_active")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  provider ProviderProfile @relation(fields: [providerId], references: [id], onDelete: Cascade)

  @@unique([providerId, dayOfWeek, startTime, endTime])
  @@index([providerId])
  @@map("provider_availability")
}

model ProviderDocument {
  id         String       @id @default(cuid())
  providerId String       @map("provider_id")
  type       DocumentType
  url        String       @db.Text
  verified   Boolean      @default(false)
  verifiedAt DateTime?    @map("verified_at")
  createdAt  DateTime     @default(now()) @map("created_at")
  updatedAt  DateTime     @updatedAt @map("updated_at")

  provider ProviderProfile @relation(fields: [providerId], references: [id], onDelete: Cascade)

  @@index([providerId])
  @@index([verified])
  @@map("provider_documents")
}

// ----------------------------------------------------------------------------
// BOOKING + PAYMENT DOMAIN
// ----------------------------------------------------------------------------

model Booking {
  id          String        @id @default(cuid())
  customerId  String        @map("customer_id")
  providerId  String        @map("provider_id") // -> ProviderProfile.id
  serviceId   String        @map("service_id")
  status      BookingStatus @default(PENDING)
  scheduledAt DateTime      @map("scheduled_at")
  address     String        @db.Text
  notes       String?       @db.Text
  totalAmount Decimal       @db.Decimal(10, 2) @map("total_amount")
  acceptedAt  DateTime?     @map("accepted_at")
  startedAt   DateTime?     @map("started_at")
  completedAt DateTime?     @map("completed_at")
  confirmedAt DateTime?     @map("confirmed_at")
  canceledAt  DateTime?     @map("canceled_at")
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")

  customer User            @relation("CustomerBookings", fields: [customerId], references: [id], onDelete: Cascade)
  provider ProviderProfile @relation("ProviderBookings", fields: [providerId], references: [id], onDelete: Cascade)
  service  Service         @relation(fields: [serviceId], references: [id], onDelete: Restrict)
  payment  Payment?
  review   Review?
  dispute  Dispute?

  @@unique([providerId, scheduledAt]) // backstop against double-booking same slot
  @@index([customerId])
  @@index([providerId])
  @@index([serviceId])
  @@index([status])
  @@index([scheduledAt])
  @@index([status, scheduledAt])
  @@map("bookings")
}

model Payment {
  id                String        @id @default(cuid())
  bookingId         String        @unique @map("booking_id")
  transactionNumber String        @unique @map("transaction_number") // TRX-20260601-000001
  amount            Decimal       @db.Decimal(10, 2)
  status            PaymentStatus @default(PENDING)
  paymentMethod     PaymentMethod @default(SIMULATED_CARD) @map("payment_method")
  paidAt            DateTime?     @map("paid_at")
  createdAt         DateTime      @default(now()) @map("created_at")

  booking Booking @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  @@index([status])
  @@map("payments")
}

// Additive supporting table (not business data): atomic daily sequence for TRX numbers.
model TransactionCounter {
  day String @id // "20260601"
  seq Int    @default(0)

  @@map("transaction_counters")
}

// ----------------------------------------------------------------------------
// REVIEW + DISPUTE DOMAIN
// ----------------------------------------------------------------------------

model Review {
  id         String   @id @default(cuid())
  bookingId  String   @unique @map("booking_id")
  authorId   String   @map("author_id") // customer User id
  targetId   String   @map("target_id") // provider's User id
  providerId String   @map("provider_id") // ProviderProfile id (rating aggregation)
  rating     Int // 1..5
  comment    String?  @db.Text
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  booking  Booking         @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  author   User            @relation("ReviewAuthor", fields: [authorId], references: [id], onDelete: Cascade)
  target   User            @relation("ReviewTarget", fields: [targetId], references: [id], onDelete: Cascade)
  provider ProviderProfile @relation("ProviderReviews", fields: [providerId], references: [id], onDelete: Cascade)

  @@index([authorId])
  @@index([targetId])
  @@index([providerId])
  @@index([rating])
  @@map("reviews")
}

model Dispute {
  id           String        @id @default(cuid())
  bookingId    String        @unique @map("booking_id")
  raisedById   String        @map("raised_by_id")
  resolvedById String?       @map("resolved_by_id") // admin
  status       DisputeStatus @default(OPEN)
  reason       String        @db.Text
  resolution   String?       @db.Text
  resolvedAt   DateTime?     @map("resolved_at")
  createdAt    DateTime      @default(now()) @map("created_at")
  updatedAt    DateTime      @updatedAt @map("updated_at")

  booking    Booking @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  raisedBy   User    @relation("DisputeRaisedBy", fields: [raisedById], references: [id], onDelete: Cascade)
  resolvedBy User?   @relation("DisputeResolvedBy", fields: [resolvedById], references: [id], onDelete: SetNull)

  @@index([raisedById])
  @@index([resolvedById])
  @@index([status])
  @@map("disputes")
}

// ----------------------------------------------------------------------------
// NOTIFICATION DOMAIN
// ----------------------------------------------------------------------------

model Notification {
  id        String           @id @default(cuid())
  userId    String           @map("user_id")
  type      NotificationType
  title     String
  message   String           @db.Text
  link      String?
  read      Boolean          @default(false)
  createdAt DateTime         @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, read])
  @@index([createdAt])
  @@map("notifications")
}

// ----------------------------------------------------------------------------
// FAVORITES
// ----------------------------------------------------------------------------

model FavoriteProvider {
  id         String   @id @default(cuid())
  userId     String   @map("user_id") // customer
  providerId String   @map("provider_id") // provider's User id
  createdAt  DateTime @default(now()) @map("created_at")

  user     User @relation("FavoriteCustomer", fields: [userId], references: [id], onDelete: Cascade)
  provider User @relation("FavoriteProvider", fields: [providerId], references: [id], onDelete: Cascade)

  @@unique([userId, providerId])
  @@index([userId])
  @@index([providerId])
  @@map("favorite_providers")
}

// ----------------------------------------------------------------------------
// MESSAGING DOMAIN
// ----------------------------------------------------------------------------

model Conversation {
  id             String   @id @default(cuid())
  participantAId String   @map("participant_a_id")
  participantBId String   @map("participant_b_id")
  lastMessageAt  DateTime @default(now()) @map("last_message_at")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  participantA User      @relation("ConversationParticipantA", fields: [participantAId], references: [id], onDelete: Cascade)
  participantB User      @relation("ConversationParticipantB", fields: [participantBId], references: [id], onDelete: Cascade)
  messages     Message[]

  @@unique([participantAId, participantBId])
  @@index([participantAId])
  @@index([participantBId])
  @@index([lastMessageAt])
  @@map("conversations")
}

model Message {
  id             String   @id @default(cuid())
  conversationId String   @map("conversation_id")
  senderId       String   @map("sender_id")
  content        String   @db.Text
  read           Boolean  @default(false)
  createdAt      DateTime @default(now()) @map("created_at")

  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender       User         @relation("MessageSender", fields: [senderId], references: [id], onDelete: Cascade)

  @@index([conversationId])
  @@index([senderId])
  @@map("messages")
}

// ----------------------------------------------------------------------------
// AUDIT
// ----------------------------------------------------------------------------

model AuditLog {
  id        String      @id @default(cuid())
  actorId   String?     @map("actor_id") // nullable: system actions
  action    AuditAction
  entity    String // "Booking", "User", "Payment", ...
  entityId  String      @map("entity_id")
  metadata  Json?
  ipAddress String?     @map("ip_address")
  createdAt DateTime    @default(now()) @map("created_at")

  actor User? @relation("AuditActor", fields: [actorId], references: [id], onDelete: SetNull)

  @@index([actorId])
  @@index([entity, entityId])
  @@index([action])
  @@index([createdAt])
  @@map("audit_logs")
}
```

---

## 3. Database Design Notes

**Relationships (cascade policy)**
- `User 1—N Account` / `1—N Session` — Auth.js core; `onDelete: Cascade` purges credentials/sessions with the user.
- `User 1—1 ProviderProfile` (`userId @unique`) — a provider has exactly one profile; cascade on user delete.
- `ProviderProfile N—1 ServiceCategory` — `SetNull` so deleting a category never destroys a provider.
- `ServiceCategory 1—N Service`, `ProviderProfile 1—N Service` — category uses `Restrict` (cannot delete a category with live services).
- `ProviderProfile 1—N ProviderAvailability` / `1—N ProviderDocument` — owned children, cascade.
- `Booking N—1 User(customer)` / `N—1 ProviderProfile` / `N—1 Service` — service uses `Restrict` to preserve financial/historical integrity.
- `Booking 1—1 Payment` / `1—1 Review` / `1—1 Dispute` — enforced via `@unique` FK on child; cascade from booking.
- `Review` → author (customer User), target (provider User), and `providerId` (ProviderProfile, denormalized for fast aggregation).
- `Dispute` → `raisedBy` (cascade), `resolvedBy`/admin (`SetNull` to preserve history).
- `FavoriteProvider`, `Conversation` — dual `User` relations; unique pair constraints prevent duplicates.
- `AuditLog N—1 User(actor)` — `actorId` nullable + `SetNull` for audit immutability.

**Index rationale (non-obvious)**
- `Booking [status, scheduledAt]` composite — dashboards filter by status then range/sort by date.
- `Booking @@unique([providerId, scheduledAt])` — DB-level backstop for the app-level slot guard (see §6).
- `ProviderProfile [averageRating]` — search ORDER BY rating; `[verificationStatus]` — admin approval queue.
- `Payment [status]` — admin reconciliation; `transactionNumber @unique` doubles as receipt lookup.
- `Notification [userId, read]` composite — the unread-bell-badge query in one index.
- `Conversation [lastMessageAt]` — inbox most-recent ordering; `AuditLog [entity, entityId]` — "history for this Booking/User".

**Consistency / transaction rules**
- **Money + booking are atomic:** `Booking(PENDING)` and `Payment(COMPLETED)` are created in one `prisma.$transaction` (Serializable, or ReadCommitted + row locks).
- **Status transitions** re-read the booking `FOR UPDATE` inside the transaction and call the pure `assertTransition` guard → no double-accept / accept-after-cancel TOCTOU races.
- **Rating aggregates** are recomputed from `Review` rows (`aggregate`) inside the review transaction — never incrementally added — so concurrent reviews cannot lose updates.
- **Transaction numbers** use connection-scoped `LAST_INSERT_ID()` atomic increment on `TransactionCounter`, plus the `@unique` backstop on `Payment.transactionNumber`.
- **Slot booking** is re-validated under the row lock at commit; `@@unique([providerId, scheduledAt])` backs active bookings.
- **Notifications** are always written inside the same transaction as the triggering event.

---

## 4. Authentication & Authorization

**Strategy decision: `session: { strategy: "jwt" }`.** The Prisma Adapter is retained for OAuth `Account`/`User`/`VerificationToken` linking, but session state lives in a signed/encrypted JWT cookie so `middleware.ts` can role-gate at the edge with zero DB hits. Revocation weakness is mitigated by short `maxAge` (remember-me toggles 30d vs a few hours) and by re-checking `isActive`/`role` from MySQL in `requireUser()` on every sensitive action. The `Session` model stays in the schema for adapter completeness.

**Two-file split (edge-safe middleware).** NextAuth v5 + Prisma adapter + bcrypt cannot run on the edge runtime, so config is split: `src/auth.config.ts` (edge-safe: no Prisma/bcrypt/adapter, used by `middleware.ts`) and `src/auth.ts` (Node runtime: spreads `authConfig`, adds `PrismaAdapter` + providers + credentials `authorize`).

```ts
// src/auth.ts  (Node runtime)
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import { loginSchema } from "@/lib/validators/auth";
import type { UserRole } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 }, // 30d ceiling; remember-me shortens
  providers: [
    Google({ allowDangerousEmailAccountLinking: false }),
    GitHub({ allowDangerousEmailAccountLinking: false }),
    Credentials({
      credentials: { email: {}, password: {}, remember: {} },
      authorize: async (raw) => {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password, remember } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.password || !user.isActive) return null; // OAuth-only or banned
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;
        return { id: user.id, name: user.name, email: user.email, image: user.image, role: user.role, remember };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, trigger, session }) => {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: UserRole }).role;
        token.remember = (user as { remember?: boolean }).remember ?? false;
      }
      if (trigger === "update" && session?.role) token.role = session.role as UserRole;
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
    signIn: async () => true, // OAuth defaults to CUSTOMER via createUser event
  },
  events: {
    createUser: async ({ user }) => {
      await prisma.user.update({ where: { id: user.id }, data: { role: "CUSTOMER", isVerified: true } });
      await prisma.auditLog.create({ data: { action: "CREATE", entity: "User", entityId: user.id, metadata: { via: "oauth" } } });
    },
  },
});
```

> Reconciliation note: the auth expert's `AuditLog` writes (`{ action: "USER_CREATED", userId, meta }`) were rewritten to the contract shape `{ action: AuditAction, entity, entityId, actorId?, metadata }`. `USER_CREATED → CREATE`+`entity:"User"`; `PASSWORD_RESET → UPDATE`+`entity:"User"`+`metadata:{ kind:"password_reset" }`; `BOOKING_ACCEPTED → STATUS_CHANGE`+`entity:"Booking"`.

**Module augmentation** (`src/types/next-auth.d.ts`): augments `User`, `Session.user`, and `JWT` with `{ id: string; role: UserRole }` (+ `remember` on JWT).

**Credentials flows** (all Zod-validated, all in `src/actions/auth/`):
- **Register** — `registerSchema` (`role ∈ {CUSTOMER, PROVIDER}`, ADMIN never self-assigned); `bcrypt.hash(pw, 12)`; `AuditLog{action:CREATE, entity:"User"}`.
- **Forgot password** — issue `VerificationToken` storing a **SHA-256 hash** of a random raw token (`identifier: "pwreset:<email>"`, 30-min expiry); always return `{ ok: true }` (no account enumeration); email the raw token.
- **Reset password** — hash incoming token, `findFirst` by hash + expiry; in one `$transaction`: update password, **delete token (single-use)**, write `AuditLog{action:UPDATE, entity:"User", metadata:{kind:"password_reset"}}`.
- **Remember-me** — `remember` flows login form → `signIn("credentials", { remember })` → `authorize` return → JWT `remember` claim; `true` → 30-day persistent cookie, `false` → short-lived/session-style.

**Middleware** (`src/middleware.ts`) gates on URL path prefixes (route groups don't appear in URLs), reading role from `req.auth` (signed JWT, tamper-proof):

```ts
const ROUTE_ROLES = [
  { prefix: "/admin",      roles: ["ADMIN"] },
  { prefix: "/provider",   roles: ["PROVIDER"] },
  { prefix: "/customer",   roles: ["CUSTOMER"] },
  { prefix: "/dashboard",  roles: ["ADMIN", "PROVIDER", "CUSTOMER"] },
  { prefix: "/bookings",   roles: ["ADMIN", "PROVIDER", "CUSTOMER"] },
];
// unauthenticated -> /login?callbackUrl=...; wrong role -> /403
// matcher excludes api/auth, _next, static assets
```

**RBAC matrix** (`src/lib/permissions/matrix.ts`):

| Action | CUSTOMER | PROVIDER | ADMIN |
|---|---|---|---|
| `booking:create` | ✅ | | |
| `booking:read` | ✅ (own) | ✅ (own) | ✅ (all) |
| `booking:accept` | | ✅ (own) | ✅ |
| `booking:complete` | | ✅ (own) | ✅ |
| `booking:confirm` | ✅ (own) | | ✅ |
| `booking:cancel` | ✅ (own) | ✅ (own) | ✅ |
| `booking:dispute` | ✅ (own) | ✅ (own) | ✅ |
| `provider:apply` | ✅ | | |
| `provider:approve` / `reject` | | | ✅ |
| `provider:editProfile` | | ✅ (own) | ✅ |
| `service:create` / `edit` | | ✅ (own) | ✅ |
| `review:create` | ✅ (own booking) | | |
| `review:moderate` | | | ✅ |
| `dispute:resolve` | | | ✅ |
| `user:ban`, `category:manage`, `payment:read`, `auditlog:read` | | | ✅ |
| `notification:read`, `message:send` | ✅ (own) | ✅ (own) | ✅ |

`can(user, action)` checks the capability; `canOn(user, action, { ownerId, providerUserId })` adds the ownership relationship (ADMIN bypasses). Guards live in `src/lib/permissions/guard.ts`: `requireUser()` (session + live `isActive`/`role` re-check, throws `AuthError`→401), `requireCan(action)` (capability, throws `ForbiddenError`→403), `assertCanOn(user, action, resource)` (ownership).

**Mandatory action pipeline** (kills IDOR — the assigned provider's `userId` is loaded from the DB by booking id and compared to the session id, never taken from input; "not found" returns the same shape as "forbidden" to prevent enumeration):

```
requireUser()/requireCan(action)  →  schema.parse(input) [.strict()]
  →  load resource by id  →  assertCanOn(user, action, resource)
  →  assertTransition (state machine)  →  prisma.$transaction(mutate + AuditLog + Notification)
  →  revalidatePath  →  return Result<T>
```

**CSRF + validation convention**
- **Server Actions:** Next.js 16's Origin/Host check + action-id binding + `SameSite=Lax` cookies cover the CSRF surface; **no state change is ever exposed via GET**.
- **Route Handlers (`/api/*`)** that mutate: `assertSameOrigin()` (Origin allow-list from `AUTH_URL`) + require `Content-Type: application/json`. NextAuth's own `/api/auth/*` CSRF tokens are left intact.
- **Zod at every boundary:** every action is `(input: unknown)` → `schema.parse`; every route handler parses `await req.json()`; forms re-use the same schema client-side via `@hookform/resolvers/zod`. Schemas are `.strict()` to reject mass-assignment; Prisma writes use explicit field whitelists (never `data: input`). No `userId`/`role`/`customerId`/`isAdmin` from the request body is ever used for authorization.

---

## 5. Folder & File Structure

```
all4home/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── auth.ts                       # Node-runtime NextAuth (adapter + providers + bcrypt)
│   ├── auth.config.ts                # edge-safe config for middleware
│   ├── middleware.ts                 # role-gated route protection
│   │
│   ├── app/
│   │   ├── layout.tsx                # <html>, ThemeProvider, Toaster, SessionProvider
│   │   ├── page.tsx                  # public landing
│   │   ├── globals.css
│   │   ├── loading.tsx  error.tsx  not-found.tsx
│   │   ├── 403/page.tsx              # middleware forbidden target
│   │   │
│   │   ├── (auth)/                   # redirect if already authed
│   │   │   ├── layout.tsx  loading.tsx  error.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   ├── reset-password/page.tsx       # ?token=
│   │   │   └── verify-email/page.tsx
│   │   │
│   │   ├── (customer)/               # requires role=CUSTOMER
│   │   │   ├── layout.tsx  loading.tsx  error.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── search/page.tsx (+loading.tsx)
│   │   │   ├── providers/page.tsx
│   │   │   │   └── [providerId]/page.tsx (+loading.tsx +not-found.tsx)
│   │   │   ├── book/[serviceId]/page.tsx     # booking wizard entry
│   │   │   ├── bookings/page.tsx
│   │   │   │   └── [bookingId]/page.tsx (+not-found.tsx)
│   │   │   ├── favorites/page.tsx
│   │   │   ├── reviews/page.tsx
│   │   │   ├── messages/page.tsx
│   │   │   │   └── [conversationId]/page.tsx
│   │   │   ├── notifications/page.tsx
│   │   │   └── profile/page.tsx
│   │   │
│   │   ├── (provider)/               # requires role=PROVIDER
│   │   │   ├── layout.tsx  loading.tsx  error.tsx
│   │   │   ├── apply/page.tsx                 # role-upgrade application
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── services/page.tsx
│   │   │   ├── availability/page.tsx
│   │   │   ├── bookings/page.tsx
│   │   │   │   └── [bookingId]/page.tsx
│   │   │   ├── reviews/page.tsx
│   │   │   ├── documents/page.tsx
│   │   │   ├── earnings/page.tsx
│   │   │   ├── messages/page.tsx
│   │   │   │   └── [conversationId]/page.tsx
│   │   │   └── notifications/page.tsx
│   │   │
│   │   ├── (admin)/                  # requires role=ADMIN
│   │   │   ├── layout.tsx  loading.tsx  error.tsx
│   │   │   ├── dashboard/page.tsx             # analytics overview
│   │   │   ├── users/page.tsx + [userId]/page.tsx
│   │   │   ├── providers/page.tsx + [providerId]/page.tsx   # approvals queue
│   │   │   ├── bookings/page.tsx
│   │   │   ├── payments/page.tsx
│   │   │   ├── categories/page.tsx
│   │   │   ├── reviews/page.tsx
│   │   │   ├── disputes/page.tsx + [disputeId]/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   ├── audit-logs/page.tsx
│   │   │   └── notifications/page.tsx
│   │   │
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts    # export { handlers as GET, POST }
│   │       ├── health/route.ts
│   │       └── webhooks/payment-sim/route.ts  # internal simulated-payment callback
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn primitives (button, input, form, dialog, select,
│   │   │                             #   card, badge, table, tabs, toast, toaster, skeleton,
│   │   │                             #   avatar, calendar, popover, sheet, alert-dialog, pagination)
│   │   ├── forms/                    # form-field, text-field, password-field, select-field,
│   │   │                             #   textarea-field, date-field, submit-button (useFormStatus)
│   │   ├── shared/                   # empty-state, error-state, loading-spinner, data-table,
│   │   │                             #   page-header, stat-card, status-badge, confirm-dialog,
│   │   │                             #   rating-stars, theme-toggle
│   │   └── layout/                   # customer-sidebar, provider-sidebar, admin-sidebar, top-nav,
│   │                                 #   user-menu, notification-bell, mobile-nav
│   │
│   ├── features/                     # per-domain: components/, hooks/, queries.ts (RSC reads)
│   │   ├── auth/        ├── bookings/   ├── providers/  ├── payments/
│   │   ├── reviews/     ├── disputes/   ├── notifications/  ├── messages/
│   │
│   ├── actions/                      # 'use server' mutations, return Result<T>
│   │   ├── auth/        ├── bookings/   ├── providers/  ├── payments/
│   │   ├── reviews/     ├── disputes/   ├── notifications/  ├── messages/
│   │   ├── categories/  ├── user/       └── admin/
│   │
│   ├── lib/
│   │   ├── prisma.ts                 # PrismaClient singleton
│   │   ├── mail.ts                   # sendResetEmail
│   │   ├── auth/                     # password.ts (bcrypt), session.ts (getCurrentUser), tokens.ts
│   │   ├── validators/               # auth, bookings, providers, payments, reviews, disputes,
│   │   │                             #   notifications, messages, categories, user, common
│   │   ├── permissions/
│   │   │   ├── matrix.ts             # Action union + role->capability matrix
│   │   │   ├── can.ts                # can() / canOn() + Principal
│   │   │   ├── guard.ts              # requireUser/requireCan/assertCanOn, AuthError/ForbiddenError
│   │   │   ├── booking-transitions.ts# BOOKING_TRANSITIONS map (single source of truth)
│   │   │   └── assert-transition.ts  # pure assertTransition guard
│   │   ├── payments/
│   │   │   └── transaction-number.ts # nextTransactionNumber(tx)
│   │   ├── security/
│   │   │   └── origin.ts             # assertSameOrigin (CSRF for route handlers)
│   │   ├── storage/                  # index.ts (interface), local.ts (dev), s3.ts (prod)
│   │   └── utils/
│   │       ├── result.ts             # Result<T> + ok()/fail()
│   │       ├── errors.ts             # AppErrorCode taxonomy
│   │       ├── action-client.ts      # createAction() wrapper (validate+auth+catch+revalidate)
│   │       ├── audit.ts              # writeAuditLog()
│   │       ├── toast.ts              # mapResultToToast()
│   │       ├── format.ts  cn.ts
│   │
│   ├── hooks/                        # use-action, use-debounce, use-pagination,
│   │                                 #   use-media-query, use-confirm
│   ├── stores/                       # Zustand TRANSIENT UI ONLY:
│   │                                 #   booking-wizard-store, ui-store, theme-store
│   ├── types/                        # index, result, next-auth.d.ts, booking, provider,
│   │                                 #   payment, dto
│   └── constants/                    # roles, routes, booking-status, payment, navigation
```

**Per-feature inventory (canonical)**

- **auth** — actions: `register`, `login`, `logout`, `forgot-password`, `reset-password`, `verify-email`, `change-password`. validators: `registerSchema`, `loginSchema`, `forgotPasswordSchema`, `resetPasswordSchema`. components: `login-form`, `register-form`, `oauth-buttons`, `forgot-password-form`, `reset-password-form`, `remember-me-checkbox`.
- **bookings** — actions: `create-booking`, `accept-booking`, `start-work`, `complete-booking`, `confirm-completion`, `cancel-booking`, `dispute-booking`. validators: `createBookingSchema`, `bookingActionSchema`, `cancelBookingSchema`. components: `booking-wizard` + `step-service|provider|datetime|address|confirm`, `booking-card|list|detail`, `booking-status-timeline`, `booking-actions`. queries: `getCustomerBookings`, `getProviderBookings`, `getBookingById`.
- **providers** — actions: `apply-provider`, `update-profile`, `upsert-service`, `delete-service`, `set-availability`, `upload-document`, `approve-provider`(admin), `reject-provider`(admin), `verify-document`(admin). validators: `providerApplicationSchema`, `providerProfileSchema`, `serviceSchema`, `availabilitySchema`, `documentSchema`. queries: `searchProviders`, `getProviderById`, `getProviderProfile`, `getProviderEarnings`, `getPendingProviders`.
- **payments** — actions: `process-payment` (creates `Payment(COMPLETED)`+`Booking(PENDING)`, TRX number, audit, notification — co-located with `create-booking`), `refund-payment`(admin). validators: `processPaymentSchema`, `refundSchema`. components: `payment-summary`, `pay-now-button`, `payment-method-select`, `transaction-receipt`, `payment-status-badge`. queries: `getPaymentByBooking`, `getAdminPayments`.
- **reviews** — actions: `create-review`, `update-review`, `delete-review`(owner/admin). queries: `getProviderReviews`, `getCustomerReviews`, `getReviewForBooking`.
- **disputes** — actions: `open-dispute`, `update-dispute-status`(admin), `resolve-dispute`(admin). validators: `openDisputeSchema`, `resolveDisputeSchema`.
- **notifications** — actions: `mark-as-read`, `mark-all-read`, `create-notification`(internal helper). queries: `getNotifications`, `getUnreadCount`. hook: `use-unread-count`.
- **messages** — actions: `send-message`, `start-conversation`, `mark-conversation-read`. queries: `getConversations`, `getConversationById`, `getMessages`.
- **categories** — actions: `create-category`, `update-category`, `delete-category` (all admin).
- **user** — actions: `update-profile`, `update-avatar`, `toggle-dark-mode`, `add-favorite`, `remove-favorite`. queries: `getFavorites`.
- **admin** — actions: `toggle-user-active`, `update-user-role`. cross-domain queries: `getAllUsers`, `getAllBookings`, `getAuditLogs`, `getAnalytics`.

---

## 6. Domain Logic

### 6.1 Booking state machine

Ownership terms reconciled to the schema: **CustomerOwner** = `booking.customerId === session.user.id`; **ProviderOwner** = `booking.provider.userId === session.user.id` (reached via `Booking.providerId → ProviderProfile.userId`, never a `providerUserId` column). ADMIN bypasses ownership; the action is still audited.

**Transition table**

| # | From → To | Trigger (role + ownership) | Guard | Side effects |
|---|---|---|---|---|
| 1 | `∅ → PENDING` | CUSTOMER (self) | `Payment` COMPLETED same txn; provider APPROVED+active; slot free | create `Booking`+`Payment(COMPLETED)`; `Notification(BOOKING_CREATED)`→provider; `Notification(PAYMENT_COMPLETED)`→customer; `AuditLog(CREATE,"Booking")` |
| 2 | `PENDING → ACCEPTED` | ProviderOwner / ADMIN | still PENDING; `scheduledAt` not past | set `acceptedAt`; `Notification(BOOKING_ACCEPTED)`→customer; `AuditLog(STATUS_CHANGE)` |
| 3 | `PENDING → CANCELED` | Customer/Provider Owner / ADMIN | not yet ACCEPTED | `Payment→REFUNDED`; set `canceledAt`; `Notification(BOOKING_CANCELED)`+`(PAYMENT_REFUNDED)`; `AuditLog` |
| 4 | `ACCEPTED → IN_PROGRESS` | ProviderOwner / ADMIN | within window; optional GPS | set `startedAt`; `Notification(BOOKING_IN_PROGRESS)`→customer; `AuditLog` |
| 5 | `ACCEPTED → CANCELED` | Customer/Provider Owner / ADMIN | work not started | `Payment→REFUNDED`; `Notification(BOOKING_CANCELED)`; `AuditLog` |
| 6 | `IN_PROGRESS → COMPLETED` | ProviderOwner / ADMIN | currently IN_PROGRESS | set `completedAt`; `Notification(BOOKING_COMPLETED)`→customer; `AuditLog` |
| 7 | `COMPLETED → CONFIRMED` | CustomerOwner / ADMIN | currently COMPLETED | set `confirmedAt`; `Notification(BOOKING_CONFIRMED)`→provider; unlock review; `AuditLog` |
| 8 | `COMPLETED → DISPUTED` | CustomerOwner / ADMIN | within dispute window (7d) | create `Dispute(OPEN)`; `Notification(BOOKING_DISPUTED)`→provider+admin; `AuditLog` |
| 9 | `CONFIRMED → CLOSED` | ADMIN / system | no open dispute | finalize (simulated); `Notification(SYSTEM)`→both; `AuditLog(STATUS_CHANGE)` |
| 10 | `CONFIRMED → DISPUTED` | Customer/Provider Owner / ADMIN | within window | create `Dispute(OPEN)`; notify admin; `AuditLog` |
| 11 | `DISPUTED → CLOSED` | ADMIN only | dispute RESOLVED/REJECTED | `Payment→REFUNDED` or `COMPLETED` per ruling; `Notification(DISPUTE_RESOLVED)`→both; `AuditLog` |
| 12 | `DISPUTED → IN_PROGRESS` | ADMIN only | resolved "continue work" | notify both; `AuditLog` |

Terminal states `CLOSED`, `CANCELED` have no outbound transitions. (`NotificationType` reconciled to the schema enum: domain events `WORK_STARTED/WORK_COMPLETED/BOOKING_CLOSED/DISPUTE_OPENED/NEW_MESSAGE/DOCUMENT_APPROVED|REJECTED` were mapped to canonical `BOOKING_IN_PROGRESS / BOOKING_COMPLETED / SYSTEM / BOOKING_DISPUTED / MESSAGE_RECEIVED / DOCUMENT_VERIFIED`.)

```ts
// src/lib/permissions/booking-transitions.ts
import { BookingStatus } from "@prisma/client";
export type Actor = "CUSTOMER" | "PROVIDER" | "ADMIN";
interface TransitionRule { to: BookingStatus; actors: Actor[] }

export const BOOKING_TRANSITIONS: Record<BookingStatus, TransitionRule[]> = {
  PENDING:     [{ to: "ACCEPTED", actors: ["PROVIDER", "ADMIN"] }, { to: "CANCELED", actors: ["CUSTOMER", "PROVIDER", "ADMIN"] }],
  ACCEPTED:    [{ to: "IN_PROGRESS", actors: ["PROVIDER", "ADMIN"] }, { to: "CANCELED", actors: ["CUSTOMER", "PROVIDER", "ADMIN"] }],
  IN_PROGRESS: [{ to: "COMPLETED", actors: ["PROVIDER", "ADMIN"] }],
  COMPLETED:   [{ to: "CONFIRMED", actors: ["CUSTOMER", "ADMIN"] }, { to: "DISPUTED", actors: ["CUSTOMER", "ADMIN"] }],
  CONFIRMED:   [{ to: "CLOSED", actors: ["ADMIN"] }, { to: "DISPUTED", actors: ["CUSTOMER", "PROVIDER", "ADMIN"] }],
  DISPUTED:    [{ to: "CLOSED", actors: ["ADMIN"] }, { to: "IN_PROGRESS", actors: ["ADMIN"] }],
  CLOSED:      [],
  CANCELED:    [],
};
```

```ts
// src/lib/permissions/assert-transition.ts
import { BookingStatus, UserRole } from "@prisma/client";
import { BOOKING_TRANSITIONS, Actor } from "./booking-transitions";

export class TransitionError extends Error {
  constructor(public code: "INVALID_TRANSITION" | "FORBIDDEN" | "NOT_FOUND") { super(code); }
}
interface SessionUser { id: string; role: UserRole }
// `booking` is loaded with provider.userId; pass providerUserId explicitly.
interface BookingFacts { status: BookingStatus; customerId: string; providerUserId: string }

function resolveActor(b: BookingFacts, u: SessionUser): Actor | null {
  if (u.role === "ADMIN") return "ADMIN";
  if (u.role === "CUSTOMER" && b.customerId === u.id) return "CUSTOMER";
  if (u.role === "PROVIDER" && b.providerUserId === u.id) return "PROVIDER";
  return null;
}
export function assertTransition(b: BookingFacts, to: BookingStatus, u: SessionUser): Actor {
  const actor = resolveActor(b, u);
  if (!actor) throw new TransitionError("FORBIDDEN");
  const rule = BOOKING_TRANSITIONS[b.status].find((r) => r.to === to);
  if (!rule) throw new TransitionError("INVALID_TRANSITION");
  if (!rule.actors.includes(actor)) throw new TransitionError("FORBIDDEN");
  return actor;
}
```

The guard is pure (no I/O), hence unit-testable. Every status-mutating action calls it **inside** `prisma.$transaction` after a locking re-read (`SELECT ... FOR UPDATE`) so the `from` status cannot change under a concurrent actor (no double-accept / accept-after-cancel).

### 6.2 Simulated payment workflow

`process-payment` / `create-booking` (co-located in `src/actions/payments/` and `src/actions/bookings/`) sequence:

```
1. requireCan("booking:create")               // session role CUSTOMER (else FORBIDDEN)
2. processPaymentSchema.parse(input)           // serviceId, providerId, scheduledAt, address, hours (else VALIDATION)
3. prisma.$transaction(async (tx) => {
     a. load Service + ProviderProfile (isActive && verificationStatus==APPROVED) — else NOT_FOUND / PROVIDER_UNAVAILABLE
     b. re-validate slot under lock vs ProviderAvailability + active bookings — else SLOT_TAKEN
     c. amount = server-computed (service.price or hourlyRate * hours)   // never trust client
     d. txNumber = await nextTransactionNumber(tx)
     e. booking = tx.booking.create({ status: PENDING, totalAmount: amount, ... })
     f. payment = tx.payment.create({ bookingId, transactionNumber: txNumber, amount,
                                      status: COMPLETED, paymentMethod, paidAt: now })
     g. tx.notification.create({ userId: providerUserId, type: BOOKING_CREATED, ... })
     h. tx.notification.create({ userId: customerId,     type: PAYMENT_COMPLETED, ... })
     i. tx.auditLog.create({ action: CREATE, entity: "Booking", entityId: booking.id, ... })
   }, { isolationLevel: "Serializable" })
4. return Result.ok({ bookingId, transactionNumber })
```

Client "Pay Now": loading state → call action → success toast + receipt. **No money moves**; `Payment.status` is `COMPLETED` immediately because the gateway is simulated.

**Transaction-number algorithm** (concurrency-safe via `TransactionCounter` + connection-scoped `LAST_INSERT_ID`):

```ts
// src/lib/payments/transaction-number.ts
import { Prisma } from "@prisma/client";
type Tx = Prisma.TransactionClient;

export async function nextTransactionNumber(tx: Tx): Promise<string> {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
  await tx.$executeRaw`
    INSERT INTO transaction_counters (day, seq)
    VALUES (${day}, LAST_INSERT_ID(1))
    ON DUPLICATE KEY UPDATE seq = LAST_INSERT_ID(seq + 1)`;
  const rows = await tx.$queryRaw<{ seq: bigint }[]>`SELECT LAST_INSERT_ID() AS seq`;
  return `TRX-${day}-${String(Number(rows[0].seq)).padStart(6, "0")}`; // TRX-20260601-000001
}
```

The row lock held until the surrounding `$transaction` commits serializes same-day collisions; `Payment.transactionNumber @unique` is the backstop.

### 6.3 Reviews

Precondition: `booking.status ∈ {CONFIRMED, CLOSED}` **and** reviewer is CustomerOwner; one review per booking (`Review.bookingId @unique`). In one transaction: create `Review` (`authorId`=customer User, `targetId`=provider User, `providerId`=`ProviderProfile.id`), recompute `averageRating`/`reviewCount` from `review.aggregate({ where: { providerId } })`, write `Notification(REVIEW_RECEIVED)`→provider. Recompute-from-source (not incremental) prevents float drift / lost updates.

### 6.4 Disputes

`DisputeStatus = OPEN | UNDER_REVIEW | RESOLVED | REJECTED | CLOSED`. Flow: owner opens on a COMPLETED/CONFIRMED booking → `Dispute(OPEN)` + `Booking→DISPUTED` + notify counterparty/admin. Only ADMIN advances: `OPEN→UNDER_REVIEW`, then `UNDER_REVIEW→RESOLVED` (booking→CLOSED, payment→COMPLETED|REFUNDED per ruling) or `→REJECTED` (booking→CONFIRMED/CLOSED). Resolution always mutates the linked booking + payment in the **same transaction**; emits `Notification(DISPUTE_RESOLVED)` + `AuditLog(STATUS_CHANGE,"Dispute")`.

### 6.5 Notifications

Every domain event writes a persisted `Notification` row (`read` defaults false — schema uses `read`, not `isRead`) **inside the same transaction** as its trigger, and the client surfaces a toast. Mapping (canonical `NotificationType`): `BOOKING_CREATED`→provider, `BOOKING_ACCEPTED`→customer, `BOOKING_CANCELED`→counterparty, `BOOKING_IN_PROGRESS`/`BOOKING_COMPLETED`→customer, `BOOKING_CONFIRMED`→provider, `PAYMENT_COMPLETED`/`PAYMENT_REFUNDED`→customer, `REVIEW_RECEIVED`→provider, `BOOKING_DISPUTED`→counterparty+admin, `DISPUTE_RESOLVED`→both, `PROVIDER_APPROVED`/`PROVIDER_REJECTED`→provider, `DOCUMENT_VERIFIED`→provider, `MESSAGE_RECEIVED`→other participant, `SYSTEM`→generic (e.g. booking closed).

### 6.6 Messaging

Reconciled to the schema's participant model: `Conversation` ties exactly two users via `participantAId`/`participantBId` with `@@unique([participantAId, participantBId])` (no `bookingId` column on the conversation — pair-scoped). `Message` uses `content` (not `body`) and `read` (not `isRead`). Sending a message (one transaction): assert sender is a participant (ownership), create `Message`, bump `Conversation.lastMessageAt`, create `Notification(MESSAGE_RECEIVED)` for the other participant. Every read requires the requester be a participant; ADMIN may read for dispute review. To avoid pair-ordering duplicates, the start-conversation action normalizes `(participantAId, participantBId)` by sorting the two user ids before lookup/create.

### 6.7 Provider verification & availability

Apply: a CUSTOMER submits an application → `ProviderProfile(verificationStatus=PENDING)` (role stays CUSTOMER until approval) → upload `ProviderDocument[]` (`DocumentType ∈ ID_CARD | PASSPORT | DRIVERS_LICENSE | BUSINESS_LICENSE | CERTIFICATION | INSURANCE | PROOF_OF_ADDRESS`, each `verified=false`). Admin reviews per document (`verify-document` → `verified=true`, `verifiedAt`, `Notification(DOCUMENT_VERIFIED)`). Admin profile decision: `PENDING→APPROVED` requires required docs verified → set `verificationStatus=APPROVED`, `approvedAt`, `user.role=PROVIDER`, `user.isVerified=true`, `Notification(PROVIDER_APPROVED)`, `AuditLog(APPROVE,"ProviderProfile")`; `PENDING→REJECTED` → `Notification(PROVIDER_REJECTED)`, `AuditLog(REJECT)`. `SUSPENDED` is admin-applied for policy violations. A provider is **bookable only when** `verificationStatus=APPROVED` AND `user.isActive` — enforced in payment step (a) under lock.

Availability/slot generation (wizard Date→Time): pick date → derive `dayOfWeek` → load `ProviderAvailability` windows → subtract overlapping active bookings (`PENDING|ACCEPTED|IN_PROGRESS`) → optional radius geofence → return discrete start times. Re-validated under lock at commit (`SLOT_TAKEN` for the loser), backed by `@@unique([providerId, scheduledAt])`.

---

## 7. .env.example

```dotenv
# ─── Database (MySQL + Prisma) ─────────────────────────────────────────────
# Pooled/proxied connection in prod (PlanetScale/Neon/RDS Proxy); append
# ?connection_limit=5&pool_timeout=20 for serverless.
DATABASE_URL="mysql://root:password@localhost:3306/all4home"

# ─── Auth.js / NextAuth v5 ─────────────────────────────────────────────────
# 32+ byte secret: `npx auth secret` or `openssl rand -base64 32`.
AUTH_SECRET="replace-with-openssl-rand-base64-32"
# Canonical app URL for callbacks/cookies; MUST equal the deployed domain in prod.
AUTH_URL="http://localhost:3000"

# ─── OAuth: GitHub ─────────────────────────────────────────────────────────
# callback: <AUTH_URL>/api/auth/callback/github
GITHUB_ID=""
GITHUB_SECRET=""

# ─── OAuth: Google ─────────────────────────────────────────────────────────
# callback: <AUTH_URL>/api/auth/callback/google
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# ─── File Storage ──────────────────────────────────────────────────────────
# local (dev) | s3 (prod). Selects the storage adapter in src/lib/storage.
STORAGE_PROVIDER="local"
# LOCAL DEV ONLY (Vercel fs is ephemeral): provider docs/avatars dir.
UPLOAD_DIR="./public/uploads"
# Production object storage (S3 / Cloudflare R2) — required when STORAGE_PROVIDER=s3
S3_BUCKET=""
S3_REGION=""
S3_ACCESS_KEY_ID=""
S3_SECRET_ACCESS_KEY=""
S3_ENDPOINT=""

# ─── Email (password reset) ────────────────────────────────────────────────
# SMTP for sendResetEmail; in dev a console transport may be used.
EMAIL_SERVER="smtp://user:pass@smtp.host:587"
EMAIL_FROM="All4Home <no-reply@all4home.app>"

# ─── Public client config ──────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 8. Dependencies & Scripts

```jsonc
{
  "name": "all4home-v2",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "db:migrate": "prisma migrate deploy",
    "db:migrate:dev": "prisma migrate dev",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio",
    "postinstall": "prisma generate"
  },
  "prisma": { "seed": "tsx prisma/seed.ts" },
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "next-auth": "^5.0.0",
    "@auth/prisma-adapter": "^2.0.0",
    "@prisma/client": "^6.0.0",
    "bcryptjs": "^2.4.3",
    "zod": "^3.23.0",
    "react-hook-form": "^7.52.0",
    "@hookform/resolvers": "^3.9.0",
    "zustand": "^5.0.0",
    "tailwind-merge": "^2.5.0",
    "clsx": "^2.1.0",
    "class-variance-authority": "^0.7.0",
    "lucide-react": "^0.460.0",
    "sonner": "^1.5.0",
    "date-fns": "^4.0.0"
    // shadcn/ui adds @radix-ui/* primitives on demand via `npx shadcn add`
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/bcryptjs": "^2.4.6",
    "prisma": "^6.0.0",
    "tsx": "^4.19.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^16.0.0",
    "prettier": "^3.3.0",
    "prettier-plugin-tailwindcss": "^0.6.0"
  }
}
```

No Stripe/PayPal, no mock-DB/faker in runtime deps. Add `@aws-sdk/client-s3` only when implementing the `s3` storage adapter (Phase 9). `tsconfig.json` is `"strict": true`, `"noImplicitAny": true` — **no `any`** anywhere.

**Seed strategy (idempotent, `tsx prisma/seed.ts`)** — all writes use `upsert` on natural unique keys so re-runs never duplicate, ordered: (1) `ServiceCategory` upsert by `slug` (Cleaning, Plumbing, Electrical, Gardening, Moving). (2) Admin `User` upsert by email (`admin@all4home.local`, `role=ADMIN`, `isVerified=true`, `bcrypt.hash(pw,12)`). (3) Sample customers + providers upsert by email with hashed passwords. (4) Per provider: upsert `ProviderProfile` (`verificationStatus=APPROVED`, `approvedAt=now`, `categoryId`) + `Service` rows upsert by `(providerId, title)` + a few `ProviderAvailability` rows. (5) **No bookings/payments seeded** — those must flow through real actions so the lifecycle + TRX generator are exercised. Each group is wrapped to log the failing step and exit non-zero so CI catches it.

---

## 9. Phased Implementation Roadmap

**Phase 0 — Scaffold.** Deliverables: Next.js 16 + TS strict under `src/`; Tailwind + shadcn init; ESLint/Prettier; base tree; CI lint/typecheck. Key files: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `components.json`, `.env.example`, `.github/workflows/ci.yml`. **Acceptance:** `npm run build`, `npm run lint`, `tsc --noEmit` clean; home route renders.

**Phase 1 — DB + Auth.** Deliverables: all 18 required models + `TransactionCounter` + enums migrated; `src/lib/prisma.ts` singleton; NextAuth v5 (Google/GitHub/Credentials, PrismaAdapter, JWT callbacks injecting `role`, forgot/reset via `VerificationToken`, remember-me). Key files: `prisma/schema.prisma`, `src/auth.ts`, `src/auth.config.ts`, `src/types/next-auth.d.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/lib/validators/auth.ts`, `src/actions/auth/*`, `(auth)` pages. **Acceptance:** migrate creates all tables; register→login shows correct `role`; Google/GitHub create `User`+`Account`; reset-password token flow works end-to-end and token is single-use.

**Phase 2 — RBAC + Layouts.** Deliverables: `src/middleware.ts` prefix gating; `src/lib/permissions/{matrix,can,guard}.ts`; role-aware layouts + sidebars; dark-mode (DB `darkMode` + transient store); Toaster. **Acceptance:** unauthenticated `/dashboard`→login with callback; CUSTOMER→`/admin`→`/403`; each role sees correct nav; theme persists via DB.

**Phase 3 — Provider Onboarding.** Deliverables: application wizard (Zod, Zustand step only); `ProviderProfile` create (PENDING); `ProviderDocument` upload via storage adapter; `ProviderAvailability` editor; admin approval sets APPROVED/`approvedAt`/role upgrade. Key files: `src/actions/providers/*`, `src/lib/validators/providers.ts`, `(provider)/apply`, `src/lib/storage/*`, `src/app/api/uploads/route.ts`. **Acceptance:** apply→PENDING; doc upload persists row+file; not publicly listed until APPROVED; approval flips `user.role=PROVIDER`.

**Phase 4 — Catalog + Search.** Deliverables: `ServiceCategory`/`Service` admin CRUD; public search/filter (category, price, rating, radius) as one Prisma query; public provider profile; `FavoriteProvider` toggle. Key files: `src/actions/categories/*`, `src/features/providers/queries.ts`, `(customer)/search`, `(customer)/providers/[providerId]`. **Acceptance:** search returns only APPROVED+active providers; filters compose; favorite toggles a row.

**Phase 5 — Booking + Simulated Payment.** Deliverables: wizard (Service→Provider→Date→Time→Address→Confirm); `process-payment` action → `Payment(COMPLETED)`+`Booking(PENDING)`, `TRX-YYYYMMDD-NNNNNN` atomic daily sequence, provider+customer notifications. Key files: `src/actions/bookings/create-booking.ts`, `src/actions/payments/process-payment.ts`, `src/lib/payments/transaction-number.ts`, `src/lib/validators/{bookings,payments}.ts`, `src/features/bookings/components/booking-wizard.tsx`. **Acceptance:** one `Booking(PENDING)`+one `Payment(COMPLETED)` with unique sequential TRX; provider gets DB notification+toast; no external network call.

**Phase 6 — Dashboards + Lifecycle.** Deliverables: Customer + Provider dashboards; full transitions (ACCEPTED→IN_PROGRESS→COMPLETED→CONFIRMED→CLOSED/CANCELED) via `assert-transition.ts` under `$transaction`+`FOR UPDATE`, ownership-checked. Key files: `src/actions/bookings/{accept,start-work,complete,confirm,cancel}-booking.ts`, `src/lib/permissions/{booking-transitions,assert-transition}.ts`, dashboard pages. **Acceptance:** provider Accept moves PENDING→ACCEPTED; illegal transition (e.g. CLOSED→ACCEPTED) rejected server-side; earnings sum matches COMPLETED payments.

**Phase 7 — Reviews / Disputes / Messaging / Notifications.** Deliverables: `Review` (one per CONFIRMED/CLOSED booking, recompute aggregates); `Dispute` open/resolve; `Conversation`+`Message` (participant model); notification center (mark read). Key files: `src/actions/{reviews,disputes,messages,notifications}/*`, shared messages pages, `components/layout/notification-bell.tsx`. **Acceptance:** review only on CONFIRMED/CLOSED, `averageRating`/`reviewCount` update; dispute sets `Booking.status=DISPUTED`; messages restricted to participants; unread count accurate.

**Phase 8 — Admin + Audit + Analytics.** Deliverables: admin panels (users, provider approvals, bookings, payments, categories, reviews, disputes, notifications); `AuditLog` on every privileged mutation; analytics (counts, revenue, top categories). Key files: `src/actions/admin/*`, `src/lib/utils/audit.ts`, `(admin)` pages. **Acceptance:** approving a provider writes an `AuditLog` row with actor+entity+action; analytics totals reconcile with raw counts; only ADMIN reaches `/admin`.

**Phase 9 — Hardening + Deploy.** Deliverables: Zod-at-every-boundary audit; CSRF (Auth.js built-in + `assertSameOrigin` on route handlers); rate-limit sensitive actions; error/loading/empty states everywhere; S3/R2 storage adapter; Vercel config + `prisma migrate deploy` release step. Key files: `src/app/**/{loading,error}.tsx`, `not-found.tsx`, `src/lib/storage/s3.ts`, `next.config.ts` (image `remotePatterns`). **Acceptance:** `npm run build` clean; full booking flow works on a Vercel preview against pooled MySQL; manual pass on key flows.

---

## 10. Deployment & Production Hardening

- **Runtime split:** auth + Prisma + bcrypt run on the **Node.js runtime only** (never Edge). `middleware.ts` uses the edge-safe `auth.config.ts` (no Prisma) for role gating.
- **Migrations:** never `prisma migrate dev` in prod. `build` runs `prisma generate && next build`; `prisma migrate deploy` runs as a release/build step. `postinstall` regenerates the client (Vercel caches `node_modules`).
- **Connection pooling:** use a pooled/proxied `DATABASE_URL` (PlanetScale/Neon/RDS Proxy) with `?connection_limit=5&pool_timeout=20`; keep the Prisma client a global singleton (`src/lib/prisma.ts`) to avoid per-invocation re-instantiation exhausting `max_connections`.
- **Uploads:** Vercel fs is ephemeral — `UPLOAD_DIR` is dev only. Production uses the `s3` adapter (`STORAGE_PROVIDER=s3`, S3/R2 via `@aws-sdk/client-s3`); store only the object URL/key in `ProviderDocument.url`/`User.image`; add the storage host to `next.config.ts` `images.remotePatterns`.
- **Env in Vercel (Production + Preview):** `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL` (must equal the deployed domain or session cookies break), `NEXT_PUBLIC_APP_URL`, all OAuth keys (with callback URLs updated to the deployed domain), storage + email vars.
- **Security posture:** RBAC at middleware (coarse) + action layer (fine, ownership); session-derived identity only; `.strict()` Zod schemas + whitelisted Prisma writes (no mass-assignment); CSRF via `SameSite=Lax` + Origin checks + no state-changing GETs; password reset tokens hashed-at-rest, single-use, 30-min expiry; account-enumeration-safe auth responses; `AuditLog` immutable (`actorId` `SetNull`) for privileged actions; cookies `httpOnly`+`secure`+`SameSite=Lax`.
- **Reliability:** Serializable `$transaction` for booking+payment; `FOR UPDATE` re-reads for state transitions; `@unique` backstops on `transactionNumber` and `(providerId, scheduledAt)`; aggregate recompute (not increment) for ratings.
- **Health:** `src/app/api/health/route.ts` returns DB connectivity for uptime probes.