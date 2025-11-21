/**
 * Push Notification Service
 * 
 * This service provides a unified interface for sending push notifications.
 * Currently supports:
 * - Capacitor push notifications (mobile apps)
 * - Expo push notifications (if using Expo)
 * 
 * TODO: Add support for web push notifications (FCM, OneSignal, etc.)
 * TODO: Add email notification support via Resend
 */

import { Resend } from "resend";

import { logger } from "@/lib/logger";

import { sendExpoPushNotification } from "./expo-push-service";

export interface PushNotificationPayload {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: "default" | "foghorn" | "boat_horn" | "airplane_ding" | "cash_register";
  priority?: "default" | "normal" | "high";
  channelId?: string;
}

export interface EmailNotificationPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const resendApiKey = process.env.RESEND_API_KEY;
const resendFromAddress =
  process.env.NOTIFICATIONS_EMAIL_FROM || "SpareCarry <notifications@sparecarry.com>";

/**
 * Send a push notification via Expo push service.
 */
export async function sendPushNotification(
  payload: PushNotificationPayload
): Promise<{ success: boolean; error?: string }> {
  const tokens = Array.isArray(payload.to) ? payload.to.filter(Boolean) : [payload.to];

  if (tokens.length === 0) {
    return { success: false, error: "No valid push tokens provided" };
  }

  const chunks: string[][] = [];
  for (let i = 0; i < tokens.length; i += 100) {
    chunks.push(tokens.slice(i, i + 100));
  }

  try {
    for (const chunk of chunks) {
      await sendExpoPushNotification({
        to: chunk,
        sound: payload.sound ?? "default",
        body: payload.body,
        title: payload.title,
        data: payload.data,
        priority: payload.priority ?? "high",
        channelId: payload.channelId ?? "default",
      });
    }

    return { success: true };
  } catch (error: any) {
    logger.error("push_notification_failed", error, {
      tokens: tokens.length,
      title: payload.title,
    });
    return { success: false, error: error?.message ?? "Failed to send push notification" };
  }
}

/**
 * Send an email notification using Resend.
 */
export async function sendEmailNotification(
  payload: EmailNotificationPayload
): Promise<{ success: boolean; error?: string }> {
  if (!resendApiKey) {
    logger.warn("resend_not_configured", { to: payload.to, subject: payload.subject });
    return { success: false, error: "Resend API key not configured" };
  }

  try {
    const resend = new Resend(resendApiKey);
    await resend.emails.send({
      from: resendFromAddress,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });
    return { success: true };
  } catch (error: any) {
    logger.error("email_notification_failed", error, {
      to: payload.to,
      subject: payload.subject,
    });
    return { success: false, error: error?.message ?? "Failed to send email" };
  }
}

/**
 * Helper to send both push and email notifications and return their results.
 */
export async function sendNotifications(options: {
  push?: PushNotificationPayload | null;
  email?: EmailNotificationPayload | null;
}): Promise<{
  push?: { success: boolean; error?: string };
  email?: { success: boolean; error?: string };
}> {
  const results: {
    push?: { success: boolean; error?: string };
    email?: { success: boolean; error?: string };
  } = {};

  if (options.push) {
    results.push = await sendPushNotification(options.push);
  }

  if (options.email) {
    results.email = await sendEmailNotification(options.email);
  }

  return results;
}