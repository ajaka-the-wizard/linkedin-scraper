import { logger } from "./logger.js";

export interface ValidationResult {
  valid: boolean;
  username?: string;
  message: string;
}

export function validateLinkedInUrl(rawUrl: unknown): ValidationResult {
  if (!rawUrl || typeof rawUrl !== "string" || !rawUrl.trim()) {
    const message = "Profile URL is required and must be a non-empty string.";
    logger.warn({ rawUrl }, message);
    return {
      valid: false,
      message,
    };
  }

  const trimmed = rawUrl.trim();

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    const message = "Malformed URL. Please provide a valid, well-formed URL.";
    logger.warn({ url: trimmed }, message);
    return {
      valid: false,
      message,
    };
  }

  // Enforce HTTPS
  if (parsed.protocol !== "https:") {
    const message = "Invalid protocol. LinkedIn profile URL must use HTTPS (e.g., https://www.linkedin.com/in/<username>).";
    logger.warn({ url: trimmed, protocol: parsed.protocol }, message);
    return {
      valid: false,
      message,
    };
  }

  // Enforce LinkedIn domain
  const hostname = parsed.hostname.toLowerCase();
  const isLinkedIn =
    hostname === "linkedin.com" ||
    hostname.endsWith(".linkedin.com");

  if (!isLinkedIn) {
    const message = "Invalid domain. Profile URL must belong to linkedin.com.";
    logger.warn({ url: trimmed, hostname }, message);
    return {
      valid: false,
      message,
    };
  }

  // Extract and validate path
  // Expected path structure: /in/<username> or /in/<username>/...
  const segments = parsed.pathname.split("/").filter(Boolean);

  if (segments.length < 2 || segments[0]?.toLowerCase() !== "in") {
    const message = "Invalid profile path. URL must follow the format 'https://www.linkedin.com/in/<username>'.";
    logger.warn({ url: trimmed, pathname: parsed.pathname }, message);
    return {
      valid: false,
      message,
    };
  }

  let username: string;
  try {
    username = decodeURIComponent(segments[1]!).trim();
  } catch {
    const message = "Malformed URL encoding in profile username.";
    logger.warn({ url: trimmed, segment: segments[1] }, message);
    return {
      valid: false,
      message,
    };
  }

  if (!username) {
    const message = "Username parameter in LinkedIn profile URL cannot be empty.";
    logger.warn({ url: trimmed }, message);
    return {
      valid: false,
      message,
    };
  }

  // Validate username format (alphanumeric, dashes, underscores, common localized chars)
  const usernameRegex = /^[\w\-À-ž%]+$/;
  if (!usernameRegex.test(username)) {
    const message = "Malformed username in profile URL. Contains invalid characters.";
    logger.warn({ url: trimmed, username }, message);
    return {
      valid: false,
      message,
    };
  }

  return {
    valid: true,
    username,
    message: "",
  };
}
