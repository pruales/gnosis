import { MiddlewareHandler } from "hono";
import { ApiKeyService } from "../services/api-key";
import { createClerkClient } from "@clerk/backend";

export const adminAuth: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header("Authorization");
  const apiKey = ApiKeyService.extractBearerToken(authHeader);

  if (!apiKey || apiKey !== c.env.ADMIN_API_KEY) {
    return c.json({ error: "Invalid admin credentials" }, 401);
  }

  return next();
};

export const companyAuth: MiddlewareHandler = async (c, next) => {
  const db = c.get("db");
  const apiKeyService = new ApiKeyService(db);

  const authHeader = c.req.header("Authorization");
  const apiKey = ApiKeyService.extractBearerToken(authHeader);

  if (!apiKey) {
    return c.json({ error: "Bearer token required" }, 401);
  }

  const key = await apiKeyService.verify(apiKey);
  if (!key) {
    return c.json({ error: "Invalid or revoked API key" }, 401);
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
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Get the session claims which contain the user ID and organization ID
    const session = auth.toAuth();
    if (!session || !session.userId) {
      return c.json({ error: "Invalid session" }, 401);
    }

    const userId = session.userId;

    // Extract organization ID from session claims if available
    // The org_id claim is included in the session token when the user is part of an organization
    const orgId = session.orgId;

    if (!orgId) {
      return c.json(
        { error: "No organization associated with this user" },
        403
      );
    }

    console.log(`Authenticated user ${userId} for organization ${orgId}`);

    // Use the organization ID as the company ID
    c.set("companyId", orgId);
    c.set("userId", userId);

    return next();
  } catch (error) {
    console.error("Clerk authentication error:", error);
    return c.json({ error: "Authentication failed" }, 401);
  }
};

// Combined authentication middleware that supports both Clerk JWT and API keys
export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    return c.json({ error: "Authentication required" }, 401);
  }

  const token = ApiKeyService.extractBearerToken(authHeader);
  if (!token) {
    return c.json({ error: "Bearer token required" }, 401);
  }

  // Try to determine if this is a Clerk JWT or an API key
  // Clerk JWTs are typically longer and contain two dots (header.payload.signature)
  const isJwt = token.includes(".") && token.split(".").length === 3;

  if (isJwt) {
    // Handle as Clerk JWT
    return clerkAuth(c, next);
  } else {
    // Handle as API key
    const db = c.get("db");
    const apiKeyService = new ApiKeyService(db);

    const key = await apiKeyService.verify(token);
    if (!key) {
      return c.json({ error: "Invalid or revoked API key" }, 401);
    }

    c.set("companyId", key.companyId);
    c.set("userId", null); // No Clerk user ID

    return next();
  }
};
