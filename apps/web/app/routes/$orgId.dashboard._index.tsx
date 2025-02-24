import { useLoaderData, useParams, useFetcher } from "@remix-run/react";
import { useState, useEffect } from "react";
import { getAuth } from "@clerk/remix/ssr.server";
import type { LoaderFunction, ActionFunction } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import { getAuthenticatedApi } from "~/services/api";
import { toast } from "sonner";
import { Card, CardContent } from "~/components/ui/card";

// Import components
import { ApiKeysTab } from "~/components/dashboard/ApiKeysTab";
import { PromptsTab } from "~/components/dashboard/PromptsTab";
import { TabNav } from "~/components/dashboard/TabNav";

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

// Mock data for initial prompt
const DEFAULT_SYSTEM_PROMPT = `You are an expert user fact extractor. Your task is to analyze the following conversation and extract only the information that directly relates to the user's life, experiences, or interests. Do not record general facts, background information, or news items unless the user explicitly connects them to their personal context.`;

type LoaderData = {
  userStats: {
    apiKeyCount: number;
    promptCount: number;
  };
  apiKeys: ApiKey[];
  promptContent: PromptMessage[];
  error?: string;
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

  try {
    // Get the authenticated API client with fresh token getter
    const api = await getAuthenticatedApi(args);

    // Fetch API keys and prompts in parallel
    const [apiKeysResponse, promptsResponse] = await Promise.all([
      api.getApiKeys(),
      api.getPrompts(),
    ]);

    const apiKeyCount = apiKeysResponse.success
      ? apiKeysResponse.data?.keys?.length || 0
      : 0;
    const promptCount = promptsResponse.success
      ? promptsResponse.data?.prompts?.length || 0
      : 0;

    // Mock data for prompts - in a real implementation, this would fetch from your backend API
    const promptContent = [
      {
        role: "system",
        content: DEFAULT_SYSTEM_PROMPT,
      },
    ];

    return {
      userStats: {
        apiKeyCount,
        promptCount,
      },
      apiKeys: apiKeysResponse.success ? apiKeysResponse.data?.keys || [] : [],
      promptContent,
    };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return {
      userStats: { apiKeyCount: 0, promptCount: 0 },
      apiKeys: [],
      promptContent: [{ role: "system", content: DEFAULT_SYSTEM_PROMPT }],
      error:
        error instanceof Error ? error.message : "Failed to fetch user stats",
    };
  }
};

export const action: ActionFunction = async (args) => {
  const { userId, orgId } = await getAuth(args);
  const urlOrgId = args.params.orgId;

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // If no active organization or mismatch, return error
  if (!orgId || orgId !== urlOrgId) {
    return Response.json({ error: "Invalid organization" }, { status: 403 });
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
        return { error: response.error || "Failed to create API key", action };
      }

      return {
        success: true,
        message: "API key created successfully",
        apiKey: response.data?.key,
        action,
      } as ActionData;
    }

    if (action === "revoke_api_key") {
      const keyId = formData.get("keyId")?.toString();
      if (!keyId) {
        return { error: "Missing key ID", action };
      }

      const response = await api.revokeApiKey(keyId);

      if (!response.success) {
        return { error: response.error || "Failed to revoke API key", action };
      }

      return {
        success: true,
        message: "API key revoked successfully",
        action,
      } as ActionData;
    }

    // Handle prompt actions
    if (action === "save_prompt") {
      const promptContentJson = formData.get("promptContent")?.toString();
      if (!promptContentJson) {
        return { error: "Missing prompt content", action };
      }

      const promptContent = JSON.parse(promptContentJson);

      // In a real implementation, this would call your backend API
      return {
        success: true,
        message: "Prompt saved successfully",
        promptContent,
        action,
      } as ActionData;
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error processing action:", error);
    return {
      error: error instanceof Error ? error.message : "An error occurred",
      action: formData.get("action")?.toString(),
    };
  }
};

export default function OrganizationDashboardIndex() {
  const data = useLoaderData<LoaderData>();
  const { error, apiKeys, promptContent } = data;
  const { orgId } = useParams();

  // State for tabs
  const [activeTab, setActiveTab] = useState("prompts");

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

  // Pass orgId to console for debugging
  console.debug(`Current organization: ${orgId}`);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage your Gnosis settings, custom prompts, and API keys.
        </p>
      </div>

      {/* Settings Section */}
      <Card>
        <TabNav
          tabs={dashboardTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <CardContent className="p-6">
          {/* Prompts Tab Content */}
          {activeTab === "prompts" && (
            <PromptsTab
              initialPromptContent={promptContent}
              fetcher={fetcher}
              DEFAULT_SYSTEM_PROMPT={DEFAULT_SYSTEM_PROMPT}
            />
          )}

          {/* API Keys Tab Content */}
          {activeTab === "api-keys" && (
            <ApiKeysTab
              apiKeys={apiKeys}
              fetcher={fetcher}
              newApiKey={fetcher.data?.apiKey}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
