import { getApiKeys, createApiKey, revokeApiKey } from "./actions";
import { ApiKeysTable } from "@/components/api-keys/api-key-manager";
import { ApiKeyCreationFlow } from "@/components/api-keys/api-key-creation-flow";
import { ApiKey } from "@gnosis.dev/sdk";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ApiKeysPage() {
  let apiKeys: ApiKey[] = [];
  let errorMessage: string | null = null;

  try {
    apiKeys = await getApiKeys();
  } catch (error) {
    console.error("Error fetching API keys:", error);
    errorMessage = "Failed to load API keys. Please try again.";
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="w-full">
          <p className="text-body text-muted-foreground">
            Create and manage your API keys to interact with the Gnosis API
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
          {errorMessage}
        </div>
      )}

      <div className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>API Keys</CardTitle>
              </div>
              <div>
                <ApiKeyCreationFlow onCreate={createApiKey} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ApiKeysTable apiKeys={apiKeys} onRevoke={revokeApiKey} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
