import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query";

export function useApi<TData, TError = Error>(
  options: UseQueryOptions<TData, TError>
): UseQueryResult<TData, TError> {
  return useQuery({
    ...options,
    staleTime: 0,
    gcTime: 0
  });
}
