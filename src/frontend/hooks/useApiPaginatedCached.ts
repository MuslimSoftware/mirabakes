import {
  keepPreviousData,
  useQuery,
  type QueryKey,
  type UseQueryResult
} from "@tanstack/react-query";

import type { PaginatedResponse } from "@/shared/types/api";

type PaginatedCachedArgs<TItem, TParams extends Record<string, unknown>> = {
  queryKey: QueryKey;
  queryFn: (input: TParams & { page: number; pageSize: number }) => Promise<PaginatedResponse<TItem>>;
  page: number;
  pageSize: number;
  params?: TParams;
  enabled?: boolean;
};

export function useApiPaginatedCached<
  TItem,
  TParams extends Record<string, unknown> = Record<string, never>
>(args: PaginatedCachedArgs<TItem, TParams>): UseQueryResult<PaginatedResponse<TItem>, Error> {
  const { queryKey, queryFn, page, pageSize, params, enabled = true } = args;

  return useQuery({
    queryKey: [...queryKey, page, pageSize, params],
    queryFn: () => queryFn({ ...(params ?? ({} as TParams)), page, pageSize }),
    placeholderData: keepPreviousData,
    enabled,
    staleTime: 60_000,
    gcTime: 10 * 60_000
  });
}
