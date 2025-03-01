"use client";

import { OrganizationList } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function OrganizationSelection() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirectUrl") ?? "/dashboard";

  return (
    <div className="flex items-center justify-center min-h-screen bg-background/30">
      <div className="w-full max-w-lg">
        <div className="space-y-10">
          <div className="space-y-3 text-center">
            <h1 className="text-heading text-3xl">Organization Selection</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              To get started with Gnosis, you need to select or create an
              organization.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-full flex justify-center">
              <div className="w-[95%] mx-auto">
                <OrganizationList
                  hidePersonal={true}
                  afterCreateOrganizationUrl={redirectUrl}
                  afterSelectOrganizationUrl={redirectUrl}
                  appearance={{
                    elements: {
                      rootBox: "!w-full !flex !justify-center",
                      organizationSwitcherTrigger: "!hidden",
                      card: "!rounded-lg !bg-card/90 !backdrop-blur-sm !border !border-border/10 !shadow-sm !overflow-hidden !w-full",
                      organizationPreviewTextContainer: "!font-medium",
                      organizationPreviewAvatar: "!size-10 !rounded-md",
                      organizationSwitcherPopoverActionButtonIcon: "!h-5 !w-5",
                      createOrganizationButton: "!w-full",
                      organizationPreviewText: "!text-foreground",
                      createOrganizationBox:
                        "!border-t !border-border/10 !pt-3 !mt-3",
                      formButtonPrimary:
                        "!bg-primary !text-primary-foreground hover:!bg-primary/90",
                      formFieldInput: "!bg-card !border !border-border",
                      organizationPreviewAvatarContainer: "!h-auto",
                      organizationSwitcherPopoverActionButtonText:
                        "!text-foreground",
                      organizationSwitcherListedOrganization:
                        "!px-4 !py-3 hover:!bg-muted/50",
                      createOrganizationIconBox: "!bg-primary/10 !text-primary",
                    },
                    variables: {
                      colorBackground: "transparent",
                      borderRadius: "0.5rem",
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
