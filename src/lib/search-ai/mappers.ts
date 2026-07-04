import type { searchAiFrequentSearches } from "@/db/schema";
import type { SearchAiFrequentSearch } from "@/types/search-ai";

type FrequentSearchRow = typeof searchAiFrequentSearches.$inferSelect;

export function toSearchAiFrequentSearch(row: FrequentSearchRow): SearchAiFrequentSearch {
  return {
    id: row.id,
    query: row.query,
    createdAt: row.createdAt.toISOString(),
  };
}
