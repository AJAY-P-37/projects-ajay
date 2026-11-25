import { useQuery } from "@tanstack/react-query";
import SettingsService from "@/services/SettingsService";
import { IUserSettings } from "common-types/types/expenses";

const DEFAULT_SETTINGS: IUserSettings = {
  startYear: 2021,
  initialBalance: 0,
};

export function useUserSettings() {
  const { data, isLoading } = useQuery({
    queryKey: ["userSettings"],
    queryFn: () => new SettingsService().getSettings(),
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    startYear: data?.startYear ?? DEFAULT_SETTINGS.startYear,
    initialBalance: data?.initialBalance ?? DEFAULT_SETTINGS.initialBalance,
    isLoading,
  };
}
