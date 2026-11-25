import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "shadcn-lib/dist/components/ui/card";
import { Button } from "shadcn-lib/dist/components/ui/button";
import { Input } from "shadcn-lib/dist/components/ui/input";
import { Toast } from "shadcn-lib/dist/components/ui/sonner";
import { Loader } from "@/components/common/storybook/loader";
import SettingsService from "@/services/SettingsService";
import { IUserSettings } from "common-types/types/expenses";
import { Settings, CalendarDays, Wallet, Save } from "lucide-react";

export function UserSettings() {
  const queryClient = useQueryClient();
  const settingsService = new SettingsService();

  const { data: settings, isLoading } = useQuery<IUserSettings>({
    queryKey: ["userSettings"],
    queryFn: () => settingsService.getSettings(),
    refetchOnWindowFocus: false,
    retry: false,
  });

  const [startYear, setStartYear] = useState<number>(2021);
  const [initialBalance, setInitialBalance] = useState<number>(0);

  useEffect(() => {
    if (settings) {
      setStartYear(settings.startYear);
      setInitialBalance(settings.initialBalance);
    }
  }, [settings]);

  const { mutateAsync: saveMutation, isPending } = useMutation({
    mutationFn: async (payload: IUserSettings) => {
      return await settingsService.saveSettings(payload);
    },
    onSuccess: (data: any) => {
      Toast.success(data?.message || "Settings saved");
      queryClient.invalidateQueries({ queryKey: ["userSettings"] });
    },
    onError: (error: any) => {
      Toast.error(error?.message || "Could not save settings");
    },
  });

  const handleSave = async () => {
    await saveMutation({ startYear, initialBalance });
  };

  const hasChanges =
    settings && (settings.startYear !== startYear || settings.initialBalance !== initialBalance);

  if (isLoading) return <Loader />;

  return (
    <Card className='mx-3 my-8 border-0'>
      <CardHeader>
        <div className='flex items-center gap-2'>
          <Settings className='w-5 h-5 text-muted-foreground' />
          <CardTitle>User Settings</CardTitle>
        </div>
        <CardDescription>
          Configure the start year and initial balance used across all financial tracking —
          expense charts, income reports, export/import, and multi-year trajectory.
        </CardDescription>
      </CardHeader>

      <CardContent className='space-y-6 max-w-lg'>
        {/* Start Year */}
        <div className='space-y-2'>
          <label className='text-sm font-medium flex items-center gap-2'>
            <CalendarDays className='w-4 h-4 text-muted-foreground' />
            Start Year
          </label>
          <Input
            id='start-year-input'
            type='number'
            min={2000}
            max={2100}
            value={startYear}
            onChange={(e) => setStartYear(Number(e.target.value))}
            className='max-w-[200px]'
          />
          <p className='text-xs text-muted-foreground'>
            The earliest year shown in expense/income visualizations, year-range selectors, and export filters.
          </p>
        </div>

        {/* Initial Balance */}
        <div className='space-y-2'>
          <label className='text-sm font-medium flex items-center gap-2'>
            <Wallet className='w-4 h-4 text-muted-foreground' />
            Initial Balance (₹)
          </label>
          <Input
            id='initial-balance-input'
            type='number'
            min={0}
            step={1000}
            value={initialBalance}
            onChange={(e) => setInitialBalance(Number(e.target.value))}
            className='max-w-[200px]'
          />
          <p className='text-xs text-muted-foreground'>
            The starting cash balance used in the Multi-Year Trajectory chart
            (as of January of the Start Year).
          </p>
        </div>

        {/* Save Button */}
        <Button
          id='save-settings-button'
          onClick={handleSave}
          disabled={isPending || !hasChanges}
          className='gap-2'
        >
          <Save className='w-4 h-4' />
          {isPending ? "Saving…" : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}
