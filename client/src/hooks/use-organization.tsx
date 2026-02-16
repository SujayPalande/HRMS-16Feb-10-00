import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface OrganizationSettings {
  organizationName: string;
  organizationEmail: string;
  timeZone: string;
  dateFormat: string;
  workingHours: {
    start: string;
    end: string;
  };
  notifications: {
    email: boolean;
    push: boolean;
    attendance: boolean;
    leave: boolean;
  };
  systemLimits: {
    maxEmployees: number;
    contactEmail: string;
    contactPhone: string;
    upgradeLink: string;
  };
}

export function useOrganization() {
  const { data: settings, isLoading, error } = useQuery<OrganizationSettings>({
    queryKey: ["/api/settings/system"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/settings/system");
        if (!res.ok) {
          throw new Error("Failed to fetch organization settings");
        }
        return await res.json();
      } catch (error) {
        // Return default settings if API fails
        return {
          organizationName: "HR Connect",
          organizationEmail: "admin@hrconnect.com",
          timeZone: "UTC",
          dateFormat: "MM/dd/yyyy",
          workingHours: {
            start: "09:00",
            end: "17:00"
          },
          notifications: {
            email: true,
            push: false,
            attendance: true,
            leave: true
          },
          systemLimits: {
            maxEmployees: 10,
            contactEmail: "support@hrconnect.com",
            contactPhone: "+1-555-0123",
            upgradeLink: "https://example.com/upgrade"
          }
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    organizationName: settings?.organizationName || "HR Connect",
    organizationEmail: settings?.organizationEmail || "admin@hrconnect.com",
    settings,
    isLoading,
    error
  };
}