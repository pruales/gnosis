import { useLoaderData, useFetcher } from "@remix-run/react";
import { useEffect } from "react";
import { getAuth } from "@clerk/remix/ssr.server";
import type { LoaderFunction, ActionFunction } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import { getAuthenticatedApi } from "~/services/api";
import { toast } from "sonner";
import { Card, CardContent } from "~/components/ui/card";
import { TabsContent } from "~/components/ui/tabs";

// Import components
import { ApiKeysTab } from "~/components/dashboard/ApiKeysTab";
import { PromptsTab } from "~/components/dashboard/PromptsTab";
import { TabNav } from "~/components/dashboard/TabNav";

// Import necessary types
import type { ApiResponse } from "~/services/api";

// Define response types for API keys
type ApiKey = {
  id: string;
  createdAt: string;
  revoked: boolean;
};

// Define response types for prompts
type PromptMessage = {
  role: string;
  content: string;
};

type LoaderData = {
  userStats: {
    apiKeyCount: number;
    promptCount: number;
  };
  apiKeys: ApiKey[];
  promptContent: PromptMessage[];
  error?: string;
  isUsingFallbackPrompt: boolean;
};

// Action data type
type ActionData = {
  success?: boolean;
  message?: string;
  apiKey?: string;
  promptContent?: PromptMessage[];
  error?: string;
  action?: string;
};

export const loader: LoaderFunction = async (args) => {
  const { userId, orgId } = await getAuth(args);
  const urlOrgId = args.params.orgId;

  if (!userId) {
    return redirect("/");
  }

  // If no active organization, redirect to org selection
  if (!orgId) {
    return redirect("/org-selection");
  }

  // If orgId from session doesn't match URL, redirect to the correct org
  if (orgId !== urlOrgId) {
    return redirect(`/${orgId}/dashboard`);
  }

  // Get the authenticated API client with fresh token getter
  const api = await getAuthenticatedApi(args);

  // Attempt to fetch API keys and prompts in parallel with proper type annotations
  const [apiKeysResponse, promptsResponse] = await Promise.all([
    api.getApiKeys().catch((err) => {
      console.error("Error fetching API keys:", err);
      return {
        success: false,
        error: "We're having trouble accessing your API keys",
      } as ApiResponse<{ keys: ApiKey[] }>;
    }),
    api.getFactExtractionPrompt(urlOrgId).catch((err) => {
      console.error("Error fetching prompts:", err);
      return {
        success: false,
        error: "We're having trouble accessing your prompt data",
      } as ApiResponse<{ prompt: PromptMessage[] }>;
    }),
  ]);

  // Prepare user-friendly error messages
  const apiKeyError = apiKeysResponse.error || null;
  const promptError = promptsResponse.error || null;

  // Combine errors if both exist
  let errorMessage = null;
  if (apiKeyError && promptError) {
    errorMessage =
      "We're having trouble connecting to our services. Please try again later.";
  } else if (apiKeyError) {
    errorMessage = apiKeyError;
  } else if (promptError) {
    errorMessage = promptError;
  }

  // Get API key count or default to 0
  let apiKeyCount = 0;
  let apiKeys: ApiKey[] = [];

  if (apiKeysResponse.success) {
    // TypeScript guard to ensure we only access data if success is true
    apiKeyCount = apiKeysResponse.data?.keys?.length || 0;
    apiKeys = apiKeysResponse.data?.keys || [];
  }

  // Don't use fallback data - if the API is unavailable, we return an empty array
  let promptContent: PromptMessage[] = [];
  let promptCount = 0;

  if (promptsResponse.success) {
    // TypeScript guard to ensure we only access data if success is true
    promptContent = promptsResponse.data?.prompt || [];
    promptCount = promptsResponse.data?.prompt?.length || 0;
  }

  return {
    userStats: {
      apiKeyCount,
      promptCount,
    },
    apiKeys,
    promptContent,
    error: errorMessage,
  };
};

export const action: ActionFunction = async (args) => {
  const { userId, orgId } = await getAuth(args);
  const urlOrgId = args.params.orgId;

  if (!userId) {
    return Response.json(
      { error: "You need to be logged in to perform this action" },
      { status: 401 }
    );
  }

  // If no active organization or mismatch, return error
  if (!orgId || orgId !== urlOrgId) {
    return Response.json(
      { error: "Invalid organization selected" },
      { status: 403 }
    );
  }

  const formData = await args.request.formData();
  const action = formData.get("action")?.toString();

  try {
    // Get the authenticated API client with fresh token getter
    const api = await getAuthenticatedApi(args);

    // Handle API key actions
    if (action === "create_api_key") {
      const response = await api.createApiKey();

      if (!response.success) {
        return {
          error:
            response.error ||
            "We couldn't create your API key at this time. Please try again later.",
          action,
        };
      }

      return {
        success: true,
        message: "API key created successfully",
        apiKey: response.data?.apiKey,
        action,
      } as ActionData;
    }

    if (action === "revoke_api_key") {
      const keyId = formData.get("keyId")?.toString();
      if (!keyId) {
        return { error: "No API key was specified to revoke", action };
      }

      const response = await api.revokeApiKey(keyId);

      if (!response.success) {
        return {
          error:
            response.error ||
            "We couldn't revoke this API key. Please try again later.",
          action,
        };
      }

      return {
        success: true,
        message: response.data?.message || "API key revoked successfully",
        action,
      } as ActionData;
    }

    // Handle prompt actions
    if (action === "save_prompt") {
      const promptContentJson = formData.get("promptContent")?.toString();
      if (!promptContentJson) {
        return { error: "No prompt content was provided to save", action };
      }

      let promptContent;
      try {
        promptContent = JSON.parse(promptContentJson);
      } catch (e) {
        return { error: "Invalid prompt content format", action };
      }

      // Use the real API endpoint to save the prompt
      const response = await api.setFactExtractionPrompt(
        urlOrgId,
        promptContent
      );

      if (!response.success) {
        return {
          error:
            response.error ||
            "We couldn't save your prompt. Please try again later.",
          action,
        };
      }

      return {
        success: true,
        message: response.data?.message || "Prompt saved successfully",
        promptContent,
        action,
      } as ActionData;
    }

    return Response.json(
      { error: "Invalid action requested" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing action:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again later.",
      action: formData.get("action")?.toString(),
    };
  }
};

export default function OrganizationDashboardIndex() {
  const data = useLoaderData<LoaderData>();
  const { error, apiKeys, promptContent } = data;

  // Fetcher for form submissions
  const fetcher = useFetcher<ActionData>();

  // Show notifications based on API responses
  useEffect(() => {
    if (fetcher.data?.success) {
      toast.success(fetcher.data.message || "Operation completed successfully");
    }

    if (fetcher.data?.error) {
      toast.error(fetcher.data.error);
    }
  }, [fetcher.data]);

  // Show error from loader data
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Define dashboard tabs
  const dashboardTabs = [
    { id: "prompts", label: "Custom Prompts" },
    { id: "api-keys", label: "API Keys" },
  ];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage your Gnosis settings, custom prompts, and API keys.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 border border-destructive bg-destructive/10 rounded-md text-destructive">
          {error}
        </div>
      )}

      {/* Settings Section */}
      <Card className="shadow-sm">
        <TabNav tabs={dashboardTabs} defaultTab="prompts">
          <CardContent className="p-6">
            <TabsContent
              value="prompts"
              className="mt-0 animate-in fade-in duration-300"
            >
              <PromptsTab
                initialPromptContent={promptContent}
                fetcher={fetcher}
                isFallbackData={false}
              />
            </TabsContent>

            <TabsContent
              value="api-keys"
              className="mt-0 animate-in fade-in duration-300"
            >
              <ApiKeysTab
                apiKeys={apiKeys}
                fetcher={fetcher}
                newApiKey={fetcher.data?.apiKey}
              />
            </TabsContent>
          </CardContent>
        </TabNav>
      </Card>
    </div>
  );
}
