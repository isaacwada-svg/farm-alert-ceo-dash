import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getErpOverview } from "@/lib/erp.functions";

export function useErpOverview() {
  const fetcher = useServerFn(getErpOverview);
  return useQuery({
    queryKey: ["erp", "overview"],
    queryFn: () => fetcher(),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });
}
