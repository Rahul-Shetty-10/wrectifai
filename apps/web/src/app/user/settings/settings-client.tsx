'use client';

import { useEffect, useState } from 'react';
import { UserThemeShell } from '@/components/dashboard/user-theme-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  fetchUserSettings,
  saveUserSettings,
  type UserSettings,
  type UserSettingsContent,
  type UserSidebarContent,
} from '@/lib/api';

type Props = { sidebar: UserSidebarContent; content: UserSettingsContent };

export function SettingsClient({ sidebar, content }: Props) {
  const [settings, setSettings] = useState<UserSettings>({
    bookings: true,
    reminders: true,
    offers: true,
    preferredCheckinMode: 'self_checkin',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchUserSettings();
        setSettings(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : content.loadErrorLabel);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function onSave() {
    try {
      setSaving(true);
      setMessage(null);
      setError(null);
      await saveUserSettings(settings);
      setMessage(content.savedMessage);
    } catch (e) {
      setError(e instanceof Error ? e.message : content.saveErrorLabel);
    } finally {
      setSaving(false);
    }
  }

  return (
    <UserThemeShell activeItem="settings" sidebar={sidebar}>
      <section className="overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-[#4ec2ed] sm:h-6" />
            <h1 className="text-[23px] font-semibold tracking-tight text-[#0f2244]">{content.title}</h1>
          </div>

          <Card className="rounded-xl border-[#d9e2ef] bg-white shadow-[0_6px_16px_rgba(94,126,179,0.10)]">
            <CardHeader>
              <CardTitle className="text-[17px] font-medium text-slate-900">{content.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? <p className="text-sm text-muted-foreground">{content.loadingLabel}</p> : null}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.bookings}
                    onChange={(e) => setSettings((prev) => ({ ...prev, bookings: e.target.checked }))}
                  />
                  {content.bookingUpdatesLabel}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.reminders}
                    onChange={(e) => setSettings((prev) => ({ ...prev, reminders: e.target.checked }))}
                  />
                  {content.appointmentRemindersLabel}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.offers}
                    onChange={(e) => setSettings((prev) => ({ ...prev, offers: e.target.checked }))}
                  />
                  {content.offersLabel}
                </label>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">{content.preferredCheckinModeLabel}</p>
                <select
                  value={settings.preferredCheckinMode}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      preferredCheckinMode: e.target.value as 'self_checkin' | 'home_pickup',
                    }))
                  }
                  className="h-10 rounded-xl border border-[#d9e2ef] bg-white px-3 text-sm text-slate-700"
                >
                  <option value="self_checkin">{content.selfCheckinLabel}</option>
                  <option value="home_pickup">{content.homePickupLabel}</option>
                </select>
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              {message ? <p className="text-sm text-primary">{message}</p> : null}
              <Button className="h-9 rounded-xl bg-[#1976f2] px-4 text-[13px] font-medium text-white hover:bg-[#0d62d4]" onClick={onSave} disabled={saving || loading}>
                {saving ? content.savingLabel : content.saveButtonLabel}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </UserThemeShell>
  );
}
