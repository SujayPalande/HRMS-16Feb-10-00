import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Allow an optional API base to be injected at build time (VITE_API_BASE).
  // This is useful when the static client is hosted under a subpath (e.g. /hrms)
  // or when the API is hosted on a different origin.
  // Prefer an explicit VITE_API_BASE (e.g. https://api.example.com),
  // otherwise fall back to the built BASE_URL (useful when the app
  // is deployed under a subpath like /hrms so API should be requested
  // at `${BASE_URL}api/...`).
  const rawApiBase = import.meta.env.VITE_API_BASE ?? import.meta.env.BASE_URL ?? "";
  const apiBase = String(rawApiBase).replace(/\/$/, "");
  const fullUrl = url.startsWith("/api") && apiBase ? `${apiBase}${url}` : url;

  const res = await fetch(fullUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    let url = queryKey[0] as string;
    
    // If there are query parameters in the second element of queryKey
    if (queryKey.length > 1 && queryKey[1] && typeof queryKey[1] === 'object') {
      const params = new URLSearchParams();
      const queryParams = queryKey[1] as Record<string, any>;
      
      for (const [key, value] of Object.entries(queryParams)) {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }
    
    // Respect VITE_API_BASE when calling /api endpoints from the browser.
  const rawApiBase = import.meta.env.VITE_API_BASE ?? import.meta.env.BASE_URL ?? "";
  const apiBase = String(rawApiBase).replace(/\/$/, "");
    const fetchUrl = url.startsWith("/api") && apiBase ? `${apiBase}${url}` : url;

    const res = await fetch(fetchUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
