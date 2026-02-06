import {
  keepPreviousData,
  useQuery,
  type QueryKey,
  type UseQueryResult
} from "@tanstack/react-query";

import type { PaginatedResponse } from "@/shared/types/api";

type PaginatedArgs<TItem, TParams extends Record<string, unknown>> = {
  queryKey: QueryKey;
  queryFn: (input: TParams & { page: number; pageSize: number }) => Promise<PaginatedResponse<TItem>>;
  page: number;
  pageSize: number;
  params?: TParams;
  enabled?: boolean;
};

export function useApiPaginated<TItem, TParams extends Record<string, unknown> = Record<string, never>>(
  args: PaginatedArgs<TItem, TParams>
): UseQueryResult<PaginatedResponse<TItem>, Error> {
  const { queryKey, queryFn, page, pageSize, params, enabled = true } = args;

  return useQuery({
    queryKey: [...queryKey, page, pageSize, params],
    queryFn: () => queryFn({ ...(params ?? ({} as TParams)), page, pageSize }),
    placeholderData: keepPreviousData,
    enabled,
    staleTime: 0,
    gcTime: 0
  });
}
