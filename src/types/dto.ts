import type {
  BookingStatus,
  DisputeStatus,
  NotificationType,
  PaymentMethod,
  PaymentStatus,
  VerificationStatus,
} from "@prisma/client";

/**
 * Serializable DTOs returned from RSC queries to client components. Prisma
 * Decimals are converted to numbers (Decimals can't cross the RSC boundary) and
 * Dates to ISO strings.
 */

export interface ServiceDTO {
  id: string;
  title: string;
  description: string | null;
  price: number;
  durationMin: number;
  categoryId: string;
  isActive: boolean;
}

export interface ProviderCardDTO {
  id: string; // ProviderProfile id
  userId: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  hourlyRate: number;
  averageRating: number;
  reviewCount: number;
  experienceYears: number;
  fromPrice: number; // cheapest active service, else hourly rate
}

export interface ProviderDetailDTO extends ProviderCardDTO {
  description: string | null;
  serviceRadiusKm: number;
  verificationStatus: VerificationStatus;
  services: ServiceDTO[];
}

export interface PendingProviderDTO {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  categoryName: string | null;
  createdAt: string; // ISO
  documentCount: number;
}

export interface PaymentDTO {
  transactionNumber: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  paidAt: string | null;
}

export interface BookingListItemDTO {
  id: string;
  status: BookingStatus;
  scheduledAt: string;
  address: string;
  totalAmount: number;
  serviceTitle: string;
  providerName: string | null;
  customerName: string | null;
  createdAt: string;
}

export interface BookingDetailDTO extends BookingListItemDTO {
  notes: string | null;
  providerId: string; // ProviderProfile id
  providerUserId: string;
  customerId: string;
  serviceId: string;
  payment: PaymentDTO | null;
  hasReview: boolean;
  disputeStatus: DisputeStatus | null;
}

export interface ReviewDTO {
  id: string;
  rating: number;
  comment: string | null;
  authorName: string | null;
  bookingId: string;
  createdAt: string;
}

export interface AdminDisputeDTO {
  id: string;
  status: DisputeStatus;
  reason: string;
  resolution: string | null;
  bookingId: string;
  raisedByName: string | null;
  createdAt: string;
}

export interface ConversationDTO {
  id: string;
  otherUserId: string;
  otherName: string | null;
  otherImage: string | null;
  lastMessageAt: string;
  unreadCount: number;
}

export interface MessageDTO {
  id: string;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationDTO {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}
