/**
 * URL Validation and Username Extraction for LinkedIn Profiles
 */

export interface ValidationResult {
  valid: boolean
  username?: string
  message: string
}

export function validateLinkedInUrl(rawUrl: unknown): ValidationResult {
  if (!rawUrl || typeof rawUrl !== "string" || !rawUrl.trim()) {
    return {
      valid: false,
      message: "Profile URL is required and must be a non-empty string.",
    };
  }

  const trimmed = rawUrl.trim();

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      valid: false,
      message: "Malformed URL. Please provide a valid, well-formed URL."
    };
  }

  // Enforce HTTPS
  if (parsed.protocol !== "https:") {
    return {
      valid: false,
      message: "Invalid protocol. LinkedIn profile URL must use HTTPS (e.g., https://www.linkedin.com/in/<username>).",
    };
  }

  // Enforce LinkedIn domain
  const hostname = parsed.hostname.toLowerCase();
  const isLinkedIn =
    hostname === "linkedin.com" ||
    hostname.endsWith(".linkedin.com");

  if (!isLinkedIn) {
    return {
      valid: false,
      message: "Invalid domain. Profile URL must belong to linkedin.com.",
    };
  }

  // Extract and validate path
  // Expected path structure: /in/<username> or /in/<username>/...
  const segments = parsed.pathname.split("/").filter(Boolean);

  if (segments.length < 2 || segments[0]?.toLowerCase() !== "in") {
    return {
      valid: false,
      message: "https://www.linkedin.com/in/<username>'.",
    };
  }

  const username = decodeURIComponent(segments[1]!).trim();

  if (!username) {
    return {
      valid: false,
      message: "Username parameter in LinkedIn profile URL cannot be empty.",
    };
  }

  // Validate username format (alphanumeric, dashes, underscores, common localized chars)
  const usernameRegex = /^[\w\-À-ž%]+$/;
  if (!usernameRegex.test(username)) {
    return {
      valid: false,
      message: "Malformed username in profile URL. Contains invalid characters.",
    };
  }

  return {
    valid: true,
    username,
    message: ""
  };
}
