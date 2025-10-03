import { z } from "zod";

// Social Media Account validation
export const socialMediaAccountSchema = z.object({
  account_name: z
    .string()
    .trim()
    .min(1, "Account name is required")
    .max(100, "Account name must be less than 100 characters"),
  access_token: z
    .string()
    .trim()
    .max(500, "Token must be less than 500 characters")
    .optional(),
  refresh_token: z
    .string()
    .trim()
    .max(500, "Token must be less than 500 characters")
    .optional(),
  api_key: z
    .string()
    .trim()
    .max(500, "API key must be less than 500 characters")
    .optional(),
  api_secret: z
    .string()
    .trim()
    .max(500, "API secret must be less than 500 characters")
    .optional(),
});

// Platform configuration validation
export const platformConfigSchema = z.object({
  client_id: z
    .string()
    .trim()
    .max(255, "Client ID must be less than 255 characters")
    .optional(),
  client_secret: z
    .string()
    .trim()
    .max(255, "Client Secret must be less than 255 characters")
    .optional(),
  redirect_url: z
    .string()
    .trim()
    .max(500, "Redirect URL must be less than 500 characters")
    .refine((val) => !val || z.string().url().safeParse(val).success, {
      message: "Must be a valid URL",
    })
    .optional(),
  api_key: z
    .string()
    .trim()
    .max(255, "API Key must be less than 255 characters")
    .optional(),
  api_secret: z
    .string()
    .trim()
    .max(255, "API Secret must be less than 255 characters")
    .optional(),
  webhook_url: z
    .string()
    .trim()
    .max(500, "Webhook URL must be less than 500 characters")
    .refine((val) => !val || z.string().url().safeParse(val).success, {
      message: "Must be a valid URL",
    })
    .optional(),
});

// Email configuration validation
export const emailConfigSchema = z.object({
  sender_name: z
    .string()
    .trim()
    .min(1, "Sender name is required")
    .max(100, "Sender name must be less than 100 characters"),
  sender_email: z
    .string()
    .trim()
    .email("Must be a valid email address")
    .max(255, "Email must be less than 255 characters"),
  smtp_host: z
    .string()
    .trim()
    .min(1, "SMTP host is required")
    .max(255, "SMTP host must be less than 255 characters"),
  smtp_port: z
    .number()
    .int()
    .min(1, "Port must be at least 1")
    .max(65535, "Port must be less than 65535"),
  smtp_username: z
    .string()
    .trim()
    .min(1, "SMTP username is required")
    .max(255, "Username must be less than 255 characters"),
  smtp_password: z
    .string()
    .trim()
    .min(1, "SMTP password is required")
    .max(255, "Password must be less than 255 characters"),
});

// Company application validation
export const companyApplicationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Company name must be at least 2 characters")
    .max(200, "Company name must be less than 200 characters"),
  email: z
    .string()
    .trim()
    .email("Must be a valid email address")
    .max(255, "Email must be less than 255 characters"),
  phone: z
    .string()
    .trim()
    .max(50, "Phone must be less than 50 characters")
    .optional(),
  website: z
    .string()
    .trim()
    .url("Must be a valid URL")
    .max(500, "Website URL must be less than 500 characters")
    .optional(),
  industry: z
    .string()
    .trim()
    .max(100, "Industry must be less than 100 characters")
    .optional(),
  company_size: z
    .string()
    .trim()
    .max(50, "Company size must be less than 50 characters")
    .optional(),
  address: z
    .string()
    .trim()
    .max(500, "Address must be less than 500 characters")
    .optional(),
});
