/**
 * User-friendly error message mapping for authentication errors
 */

export function getUserFriendlyErrorMessage(error: any): string {
  if (!error) return "An unexpected error occurred. Please try again.";

  const errorMessage = error.message || String(error);
  const errorCode = error.code || error.status;

  // Map common Supabase error codes to user-friendly messages
  switch (errorCode) {
    case "invalid_credentials":
    case "invalid_grant":
      return "Email or password is incorrect. Please check your spelling and try again.";

    case "email_not_confirmed":
      return "Please check your email and click the confirmation link to verify your account.";

    case "user_not_found":
      return "No account found with this email. Please sign up first.";

    case "email_address_not_authorized":
      return "This email address is not authorized. Please contact support if you believe this is an error.";

    case "signup_disabled":
      return "New signups are currently disabled. Please contact support.";

    case "too_many_requests":
      return "Too many attempts. Please wait a moment and try again.";

    case "email_rate_limit_exceeded":
      return "Too many emails sent. Please wait a few minutes before requesting another magic link.";

    case "invalid_token":
    case "token_expired":
      return "This link has expired or is invalid. Please request a new one.";

    case "weak_password":
      return "Password is too weak. Please choose a stronger password (at least 6 characters).";

    case "user_already_registered":
      return "This email is already registered. Try signing in instead, or use 'Forgot password?' if you don't remember your password.";

    case "email_change_token_new_email_same_as_old_email":
      return "The new email address is the same as your current email.";

    case "same_password":
      return "New password must be different from your current password.";

    default:
      // Check error message for common patterns
      const lowerMessage = errorMessage.toLowerCase();

      if (lowerMessage.includes("invalid login") || lowerMessage.includes("invalid credentials")) {
        return "Email or password is incorrect. Please check your spelling and try again.";
      }

      if (lowerMessage.includes("email not confirmed") || lowerMessage.includes("email_not_confirmed")) {
        return "Please check your email and click the confirmation link to verify your account.";
      }

      if (lowerMessage.includes("user already registered") || lowerMessage.includes("already registered")) {
        return "This email is already registered. Try signing in instead.";
      }

      if (lowerMessage.includes("too many") || lowerMessage.includes("rate limit")) {
        return "Too many attempts. Please wait a moment and try again.";
      }

      if (lowerMessage.includes("network") || lowerMessage.includes("fetch")) {
        return "Network error. Please check your connection and try again.";
      }

      // Return original message if no mapping found, but make it more user-friendly
      return errorMessage || "An unexpected error occurred. Please try again.";
  }
}

/**
 * Check if error is a network/connection error
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false;
  const message = (error.message || String(error)).toLowerCase();
  return (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("connection") ||
    message.includes("timeout")
  );
}

/**
 * Check if error indicates user already exists
 */
export function isUserExistsError(error: any): boolean {
  if (!error) return false;
  const code = error.code || error.status;
  const message = (error.message || String(error)).toLowerCase();
  return (
    code === "user_already_registered" ||
    message.includes("already registered") ||
    message.includes("user already exists")
  );
}

/**
 * Check if error indicates email not confirmed
 */
export function isEmailNotConfirmedError(error: any): boolean {
  if (!error) return false;
  const code = error.code || error.status;
  const message = (error.message || String(error)).toLowerCase();
  return (
    code === "email_not_confirmed" ||
    message.includes("email not confirmed") ||
    message.includes("verify your email")
  );
}

