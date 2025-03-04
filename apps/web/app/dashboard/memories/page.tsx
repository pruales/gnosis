"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { X } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Memory } from "@gnosis.dev/sdk";
import { getMemories, MemoriesFilter } from "./actions";

// Define the columns for the table
const columns: ColumnDef<Memory>[] = [
  {
    accessorKey: "userId",
    header: "User",
    cell: ({ row }) => (
      <div className="truncate max-w-[150px] font-medium">
        {row.getValue("userId")}
      </div>
    ),
  },
  {
    accessorKey: "agentId",
    header: "Agent",
    cell: ({ row }) => (
      <div className="truncate max-w-[150px] text-muted-foreground">
        {row.getValue("agentId") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "memoryText",
    header: "Memory",
    cell: ({ row, table }) => {
      const text = row.getValue("memoryText") as string;
      return (
        <div
          className="cursor-pointer"
          onClick={() => {
            const state = table.options.meta as {
              setSelectedMemory: (memory: Memory) => void;
            };
            state.setSelectedMemory(row.original);
          }}
        >
          <div className="line-clamp-2 text-sm">
            {text || "No content available"}
          </div>
        </div>
      );
    },
    size: 500,
  },
];

export default function MemoriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State management
  const [userIdFilter, setUserIdFilter] = useState(
    searchParams.get("userId") || ""
  );
  const [agentIdFilter, setAgentIdFilter] = useState(
    searchParams.get("agentId") || ""
  );
  const [limitFilter, setLimitFilter] = useState(
    searchParams.get("limit") || "10"
  );
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [pagination, setPagination] = useState<{
    has_more: boolean;
    firstItemId?: string;
    lastItemId?: string;
    firstPageFirstId?: string;
    isFirstPage: boolean;
    pageHistory: string[]; // Track IDs of first items in our page history
  }>({
    has_more: false,
    isFirstPage: true,
    pageHistory: [],
  });
  const [liveUpdateEnabled, setLiveUpdateEnabled] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const lastFetchTime = useRef<number>(0);
  const MIN_FETCH_INTERVAL = 2000; // Minimum 2 seconds between fetches

  // Create memoized table instance
  const table = useReactTable({
    data: memories,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    meta: {
      setSelectedMemory,
    },
  });

  // Update URL with current filters
  const updateUrlParams = useCallback(
    (params: { userId?: string; agentId?: string; limit?: string }) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());

      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          newSearchParams.set(key, value);
        } else {
          newSearchParams.delete(key);
        }
      });

      // Create the new URL
      const newUrl =
        window.location.pathname +
        (newSearchParams.toString() ? `?${newSearchParams.toString()}` : "");
      router.push(newUrl);
    },
    [searchParams, router]
  );

  // Fetch data function
  const fetchData = useCallback(
    async (filter: MemoriesFilter, isLiveUpdate = false) => {
      const now = Date.now();
      if (isLiveUpdate && now - lastFetchTime.current < MIN_FETCH_INTERVAL) {
        return; // Skip this update if it's too soon after the last one
      }

      if (!isLiveUpdate) {
        setLoading(true);
      }

      try {
        lastFetchTime.current = now;
        const result = await getMemories(filter);
        setErrorCount(0); // Reset error count on successful fetch

        // For live updates, only update if we have new data
        if (isLiveUpdate) {
          setMemories((prev) => {
            // If the first ID is different, we have new data
            if (result.data[0]?.id !== prev[0]?.id) {
              return result.data;
            }
            return prev;
          });
        } else {
          setMemories(result.data);
        }

        const firstId = result.data[0]?.id;
        const lastId = result.data[result.data.length - 1]?.id;

        setPagination((prev) => {
          // Initialize firstPageFirstId on first load
          const firstPageFirstId = !prev.firstPageFirstId
            ? firstId
            : prev.firstPageFirstId;

          // Update page history based on navigation
          let newPageHistory = [...prev.pageHistory];
          if (filter.ending_before) {
            // Remove the current page and any forward pages from history when going back
            const currentIndex = newPageHistory.indexOf(filter.ending_before);
            if (currentIndex !== -1) {
              newPageHistory = newPageHistory.slice(0, currentIndex);
            }
          } else if (filter.starting_after && firstId) {
            // Add new page to history when going forward
            newPageHistory.push(firstId);
          } else if (!filter.starting_after && !filter.ending_before) {
            // Reset history when applying filters or initial load
            newPageHistory = firstId ? [firstId] : [];
          }

          // We're on first page if:
          // 1. We're not paginating (no starting_after or ending_before), or
          // 2. We've gone back to the start of our page history
          const isFirstPage =
            (!filter.starting_after && !filter.ending_before) ||
            firstId === firstPageFirstId ||
            newPageHistory.length === 0;

          return {
            has_more: result.has_more,
            firstItemId: firstId,
            lastItemId: lastId,
            firstPageFirstId,
            isFirstPage,
            pageHistory: newPageHistory,
          };
        });
      } catch (error) {
        console.error("Failed to fetch memories:", error);
        setErrorCount((prev) => {
          const newCount = prev + 1;
          // If we've had multiple errors in a row during live updates, disable them
          if (isLiveUpdate && newCount > 3) {
            setLiveUpdateEnabled(false);
          }
          return newCount;
        });
      } finally {
        if (!isLiveUpdate) {
          setLoading(false);
        }
      }
    },
    []
  );

  // Live update effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (liveUpdateEnabled && pagination.isFirstPage) {
      intervalId = setInterval(() => {
        fetchData(
          {
            userId: userIdFilter || undefined,
            agentId: agentIdFilter || undefined,
            limit: parseInt(limitFilter),
          },
          true
        );
      }, 5000); // Keep 5 second interval, but we'll debounce actual fetches
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [
    fetchData,
    liveUpdateEnabled,
    pagination.isFirstPage,
    userIdFilter,
    agentIdFilter,
    limitFilter,
  ]);

  // Initial data fetch
  useEffect(() => {
    fetchData({ limit: parseInt(limitFilter) });
  }, [fetchData, limitFilter]);

  // Handle filter submission
  const handleFilterSubmit = () => {
    const filter: MemoriesFilter = {
      limit: parseInt(limitFilter),
    };
    if (userIdFilter) filter.userId = userIdFilter;
    if (agentIdFilter) filter.agentId = agentIdFilter;

    // Update URL params
    updateUrlParams({
      userId: userIdFilter,
      agentId: agentIdFilter,
      limit: limitFilter,
    });

    fetchData(filter);
  };

  // Handle clearing filters
  const handleClearFilters = () => {
    setUserIdFilter("");
    setAgentIdFilter("");
    setLimitFilter("10");

    // Clear URL params
    updateUrlParams({});

    fetchData({ limit: 10 });
  };

  // Update limit filter with URL
  const handleLimitChange = (value: string) => {
    setLimitFilter(value);
    updateUrlParams({
      userId: userIdFilter,
      agentId: agentIdFilter,
      limit: value,
    });
    fetchData({
      userId: userIdFilter || undefined,
      agentId: agentIdFilter || undefined,
      limit: parseInt(value),
    });
  };

  // Handle pagination
  const handlePagination = (direction: "next" | "prev") => {
    const filter: MemoriesFilter = {
      userId: userIdFilter || undefined,
      agentId: agentIdFilter || undefined,
      limit: parseInt(limitFilter),
    };

    if (direction === "next" && pagination.lastItemId) {
      filter.starting_after = pagination.lastItemId;
    } else if (direction === "prev" && pagination.firstItemId) {
      filter.ending_before = pagination.firstItemId;
    }

    fetchData(filter);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-body text-muted-foreground">
            View and manage your memories stored in the Gnosis API
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={liveUpdateEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setLiveUpdateEnabled(!liveUpdateEnabled);
              setErrorCount(0); // Reset error count when toggling
            }}
            className={
              liveUpdateEnabled ? "bg-green-600 hover:bg-green-700" : ""
            }
            disabled={errorCount > 3} // Disable button if we've had too many errors
          >
            {liveUpdateEnabled ? "Live Updates: On" : "Live Updates: Off"}
            {errorCount > 3 && " (Disabled due to errors)"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-0">
          {/* Filters section */}
          <div className="flex flex-wrap items-end gap-4 mb-4">
            <div>
              <Label htmlFor="userId" className="mb-2 block">
                User ID
              </Label>
              <Input
                id="userId"
                placeholder="Filter by User ID"
                value={userIdFilter}
                onChange={(e) => setUserIdFilter(e.target.value)}
                className="w-[200px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFilterSubmit();
                }}
              />
            </div>

            <div>
              <Label htmlFor="agentId" className="mb-2 block">
                Agent ID
              </Label>
              <Input
                id="agentId"
                placeholder="Filter by Agent ID"
                value={agentIdFilter}
                onChange={(e) => setAgentIdFilter(e.target.value)}
                className="w-[200px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFilterSubmit();
                }}
              />
            </div>

            <div>
              <Label htmlFor="limit" className="mb-2 block">
                Items per page
              </Label>
              <Select value={limitFilter} onValueChange={handleLimitChange}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Select limit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="default"
              onClick={handleFilterSubmit}
              className="mb-0.5"
            >
              Apply Filters
            </Button>

            {(userIdFilter || agentIdFilter) && (
              <Button
                variant="ghost"
                size="sm"
                className="mb-0.5"
                onClick={handleClearFilters}
              >
                <X size={16} className="mr-1" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* Active filters display */}
          {(userIdFilter || agentIdFilter) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {userIdFilter && (
                <div className="flex items-center bg-muted rounded-md px-3 py-1 text-sm">
                  <span className="font-medium mr-1">User ID:</span>{" "}
                  {userIdFilter}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-1 -mr-1"
                    onClick={() => {
                      setUserIdFilter("");
                      fetchData({ agentId: agentIdFilter || undefined });
                    }}
                  >
                    <X size={12} />
                  </Button>
                </div>
              )}
              {agentIdFilter && (
                <div className="flex items-center bg-muted rounded-md px-3 py-1 text-sm">
                  <span className="font-medium mr-1">Agent ID:</span>{" "}
                  {agentIdFilter}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-1 -mr-1"
                    onClick={() => {
                      setAgentIdFilter("");
                      fetchData({ userId: userIdFilter || undefined });
                    }}
                  >
                    <X size={12} />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent>
          {loading ? (
            <MemoriesTableSkeleton />
          ) : (
            <>
              {memories.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No memories found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                          <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                              <TableHead key={header.id}>
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                              </TableHead>
                            ))}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        {table.getRowModel().rows.map((row) => (
                          <TableRow
                            key={row.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => {
                              const state = table.options.meta as {
                                setSelectedMemory: (memory: Memory) => void;
                              };
                              state.setSelectedMemory(row.original);
                            }}
                          >
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id}>
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePagination("prev")}
                        disabled={pagination.isFirstPage}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePagination("next")}
                        disabled={
                          !pagination.has_more || !pagination.lastItemId
                        }
                      >
                        Next
                      </Button>
                    </div>
                    {liveUpdateEnabled && pagination.isFirstPage && (
                      <div className="text-sm text-muted-foreground">
                        Checking for new records...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Memory Details Dialog */}
      {selectedMemory && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedMemory(null)}
        >
          <div
            className="bg-card p-6 rounded-lg max-w-3xl w-full max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Memory from
                  </div>
                  <div className="text-lg">{selectedMemory.userId}</div>
                  {selectedMemory.agentId && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Agent: {selectedMemory.agentId}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedMemory(null)}
                  className="p-2 hover:bg-muted rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="prose prose-sm dark:prose-invert max-w-none">
                {selectedMemory.memoryText || "No content available"}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MemoriesTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
      </div>
    </div>
  );
}
