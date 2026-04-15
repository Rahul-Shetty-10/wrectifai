'use client';

import { useEffect, useState } from 'react';
import { SessionGuard } from '@/components/auth/session-guard';
import { UserSidebar, UserSidebarMobile } from '@/components/dashboard/user-sidebar';
import { UserTopLogoHeader } from '@/components/dashboard/user-top-logo-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchUserSettings, saveUserSettings, type UserSettings, type UserSidebarContent } from '@/lib/api';

type Props = { sidebar: UserSidebarContent };

export function SettingsClient({ sidebar }: Props) {
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
        setError(e instanceof Error ? e.message : 'Failed to load settings');
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
      setMessage('Settings saved');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <SessionGuard requiredRole="user" />
      <UserSidebarMobile activeItem="settings" content={sidebar} />
      <div className="hidden lg:block">
        <UserSidebar activeItem="settings" content={sidebar} />
      </div>
      <section className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl p-6">
          <UserTopLogoHeader sidebar={sidebar} />
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? <p className="text-sm text-muted-foreground">Loading settings...</p> : null}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.bookings}
                    onChange={(e) => setSettings((prev) => ({ ...prev, bookings: e.target.checked }))}
                  />
                  Booking updates
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.reminders}
                    onChange={(e) => setSettings((prev) => ({ ...prev, reminders: e.target.checked }))}
                  />
                  Appointment reminders
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.offers}
                    onChange={(e) => setSettings((prev) => ({ ...prev, offers: e.target.checked }))}
                  />
                  Offers and campaigns
                </label>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Preferred Check-in Mode</p>
                <select
                  value={settings.preferredCheckinMode}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      preferredCheckinMode: e.target.value as 'self_checkin' | 'home_pickup',
                    }))
                  }
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="self_checkin">Self Check-in</option>
                  <option value="home_pickup">Home Pickup</option>
                </select>
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              {message ? <p className="text-sm text-primary">{message}</p> : null}
              <Button onClick={onSave} disabled={saving || loading}>
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
