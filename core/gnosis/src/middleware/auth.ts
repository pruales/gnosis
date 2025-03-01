import { MiddlewareHandler } from "hono";
import { ApiKeyService } from "../services/api-key";
import { createClerkClient } from "@clerk/backend";
import { errorResponse } from "../utils/response";

export const adminAuth: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header("Authorization");
  const apiKey = extractBearerToken(authHeader);

  if (!apiKey || apiKey !== c.env.ADMIN_API_KEY) {
    return errorResponse(c, "Invalid admin credentials", 401);
  }

  return next();
};

export const companyAuth: MiddlewareHandler = async (c, next) => {
  const db = c.get("db");
  const apiKeyService = new ApiKeyService(db);

  const authHeader = c.req.header("Authorization");
  const apiKey = extractBearerToken(authHeader);

  if (!apiKey) {
    return errorResponse(c, "Bearer token required", 401);
  }

  const key = await apiKeyService.verify(apiKey);
  if (!key) {
    return errorResponse(c, "Invalid or revoked API key", 401);
  }

  c.set("companyId", key.companyId);
  return next();
};

// Middleware for Clerk JWT authentication
export const clerkAuth: MiddlewareHandler = async (c, next) => {
  try {
    // Initialize Clerk client with environment variables
    const clerkClient = createClerkClient({
      secretKey: c.env.CLERK_SECRET_KEY,
      publishableKey: c.env.CLERK_PUBLISHABLE_KEY,
    });

    // Create a Request object from Hono's request
    const url = new URL(c.req.url);
    const headers = new Headers();

    // Copy all headers from Hono request to the new Headers object
    for (const [key, value] of Object.entries(c.req.header())) {
      if (value) headers.set(key, value);
    }

    // Create a Request object for Clerk's authenticateRequest
    const request = new Request(url, {
      method: c.req.method,
      headers,
    });

    // Authenticate the request using Clerk
    const auth = await clerkClient.authenticateRequest(request);

    if (!auth.isSignedIn) {
      return errorResponse(c, "Unauthorized", 401);
    }

    // Get the session claims which contain the user ID and organization ID
    const session = auth.toAuth();
    if (!session || !session.userId) {
      return errorResponse(c, "Invalid session", 401);
    }

    // Extract organization ID from session claims if available
    // The org_id claim is included in the session token when the user is part of an organization
    const orgId = session.orgId;

    if (!orgId) {
      return errorResponse(c, "No organization associated with this user", 403);
    }

    console.log(
      `Authenticated user ${session.userId} for organization ${orgId}`
    );

    // Use the organization ID as the company ID
    c.set("companyId", orgId);

    return next();
  } catch (error) {
    console.error("Clerk authentication error:", error);
    return errorResponse(c, "Authentication failed", 401);
  }
};

// Combined authentication middleware that supports both Clerk JWT and API keys
export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    return errorResponse(c, "Authentication required", 401);
  }

  const token = extractBearerToken(authHeader);
  if (!token) {
    return errorResponse(c, "Bearer token required", 401);
  }

  // Check if this is an API key by looking for the 'sk-' prefix
  const isApiKey = token.startsWith("sk-");

  if (isApiKey) {
    // Handle as API key
    const db = c.get("db");
    const apiKeyService = new ApiKeyService(db);

    const key = await apiKeyService.verify(token);
    if (!key) {
      return errorResponse(c, "Invalid or revoked API key", 401);
    }

    c.set("companyId", key.companyId);

    return next();
  } else {
    // Handle as Clerk JWT
    return clerkAuth(c, next);
  }
};

function extractBearerToken(authHeader?: string): string | null {
  return authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
}
