import { z } from 'zod';

// Common validation patterns
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[\d\s-()]{10,20}$/;
const urlPattern = /^https?:\/\/.+/;

// User authentication schemas
export const loginSchema = z.object({
  email: z.string()
    .trim()
    .min(1, 'Email is required')
    .max(255, 'Email must be less than 255 characters')
    .regex(emailPattern, 'Invalid email format'),
  password: z.string()
    .min(1, 'Password is required')
    .max(128, 'Password must be less than 128 characters')
});

export const signupSchema = z.object({
  email: z.string()
    .trim()
    .min(1, 'Email is required')
    .max(255, 'Email must be less than 255 characters')
    .regex(emailPattern, 'Invalid email format'),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

export const passwordResetSchema = z.object({
  email: z.string()
    .trim()
    .min(1, 'Email is required')
    .max(255, 'Email must be less than 255 characters')
    .regex(emailPattern, 'Invalid email format')
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmNewPassword: z.string()
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: 'Passwords do not match',
  path: ['confirmNewPassword']
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword']
});

// Profile schemas
export const profileSchema = z.object({
  full_name: z.string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens and apostrophes'),
  email: z.string()
    .trim()
    .max(255, 'Email must be less than 255 characters')
    .regex(emailPattern, 'Invalid email format')
    .optional(),
  phone: z.string()
    .regex(phonePattern, 'Invalid phone number')
    .optional()
    .nullable(),
  avatar_url: z.string()
    .regex(urlPattern, 'Invalid URL format')
    .optional()
    .nullable()
});

// Contact schemas
export const contactSchema = z.object({
  first_name: z.string()
    .trim()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters'),
  last_name: z.string()
    .trim()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters'),
  email: z.string()
    .trim()
    .max(255, 'Email must be less than 255 characters')
    .regex(emailPattern, 'Invalid email format')
    .optional()
    .nullable(),
  phone: z.string()
    .regex(phonePattern, 'Invalid phone number')
    .optional()
    .nullable(),
  company_name: z.string()
    .max(100, 'Company name must be less than 100 characters')
    .optional()
    .nullable(),
  title: z.string()
    .max(100, 'Title must be less than 100 characters')
    .optional()
    .nullable(),
  notes: z.string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional()
    .nullable()
});

// Lead schemas
export const leadSchema = z.object({
  first_name: z.string()
    .trim()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters'),
  last_name: z.string()
    .trim()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters'),
  email: z.string()
    .trim()
    .max(255, 'Email must be less than 255 characters')
    .regex(emailPattern, 'Invalid email format')
    .optional()
    .nullable(),
  phone: z.string()
    .regex(phonePattern, 'Invalid phone number')
    .optional()
    .nullable(),
  company: z.string()
    .max(100, 'Company name must be less than 100 characters')
    .optional()
    .nullable(),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'])
    .optional(),
  source: z.string()
    .max(50, 'Source must be less than 50 characters')
    .optional()
    .nullable(),
  value: z.number()
    .min(0, 'Value must be positive')
    .optional()
    .nullable()
});

// Company/Account schemas
export const accountSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Company name is required')
    .max(100, 'Company name must be less than 100 characters'),
  email: z.string()
    .trim()
    .max(255, 'Email must be less than 255 characters')
    .regex(emailPattern, 'Invalid email format')
    .optional()
    .nullable(),
  phone: z.string()
    .regex(phonePattern, 'Invalid phone number')
    .optional()
    .nullable(),
  website: z.string()
    .regex(urlPattern, 'Invalid website URL')
    .optional()
    .nullable(),
  industry: z.string()
    .max(50, 'Industry must be less than 50 characters')
    .optional()
    .nullable(),
  annual_revenue: z.number()
    .min(0, 'Revenue must be positive')
    .optional()
    .nullable(),
  number_of_employees: z.number()
    .int('Must be a whole number')
    .min(0, 'Must be positive')
    .optional()
    .nullable()
});

// Social media post schemas
export const socialPostSchema = z.object({
  content: z.string()
    .trim()
    .min(1, 'Content is required')
    .max(5000, 'Content must be less than 5000 characters'),
  platform: z.enum(['twitter', 'facebook', 'instagram', 'linkedin', 'telegram']),
  scheduled_for: z.string()
    .datetime()
    .optional()
    .nullable(),
  hashtags: z.array(z.string().max(50)).max(30, 'Maximum 30 hashtags allowed').optional()
});

// Search/filter schemas
export const searchSchema = z.object({
  query: z.string()
    .trim()
    .max(200, 'Search query must be less than 200 characters')
    .transform(val => val.replace(/[<>{}]/g, '')) // Remove potentially dangerous characters
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20)
});

// Date range schema
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: 'Start date must be before end date'
});

// API key schema
export const apiKeySchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'API key name is required')
    .max(50, 'Name must be less than 50 characters'),
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
  expiresAt: z.string().datetime().optional()
});

// Generic ID validation
export const uuidSchema = z.string().uuid('Invalid ID format');

// Sanitize string helper
export const sanitizeString = (value: string): string => {
  return value
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// Export types
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type LeadInput = z.infer<typeof leadSchema>;
export type AccountInput = z.infer<typeof accountSchema>;
export type SocialPostInput = z.infer<typeof socialPostSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
