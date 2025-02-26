import { useSearchParams } from "@remix-run/react";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useEffect } from "react";

type Tab = {
  id: string;
  label: string;
};

type TabNavProps = {
  tabs: Tab[];
  defaultTab?: string;
  searchParamName?: string;
  className?: string;
  children?: React.ReactNode;
};

export function TabNav({
  tabs,
  defaultTab = tabs[0]?.id,
  searchParamName = "tab",
  className = "",
  children,
}: TabNavProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get(searchParamName) || defaultTab;

  // Handle tab change
  const handleTabChange = (value: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set(searchParamName, value);
    setSearchParams(newSearchParams, {
      preventScrollReset: true,
      replace: true,
    });
  };

  // If the active tab doesn't exist in the tabs list, reset to default
  useEffect(() => {
    if (activeTab && !tabs.some((tab) => tab.id === activeTab)) {
      handleTabChange(defaultTab);
    }
  }, [activeTab, tabs, defaultTab]);

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className={className}
    >
      <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 h-auto">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="rounded-none border-b-2 border-transparent px-4 py-3 font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none transition-all duration-200"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
}
