import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query";

export function useApiCached<TData, TError = Error>(
  options: UseQueryOptions<TData, TError>
): UseQueryResult<TData, TError> {
  return useQuery({
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    ...options
  });
}
