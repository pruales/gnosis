import { getApiKeys, createApiKey, revokeApiKey } from "./actions";
import { ApiKeysTable } from "@/components/api-keys/api-key-manager";
import { ApiKeyCreationFlow } from "@/components/api-keys/api-key-creation-flow";
import { ApiKey } from "gnosis-client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ApiKeysPage() {
  let apiKeys: ApiKey[] = [];

  try {
    apiKeys = await getApiKeys();
  } catch (error) {
    console.error("Error fetching API keys:", error);
    toast.error("Error fetching API keys");
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
