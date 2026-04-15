'use client';

import { useEffect, useState } from 'react';
import { SessionGuard } from '@/components/auth/session-guard';
import { UserSidebar, UserSidebarMobile } from '@/components/dashboard/user-sidebar';
import { UserTopLogoHeader } from '@/components/dashboard/user-top-logo-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  fetchUserProfile,
  saveUserProfile,
  type UserProfile,
  type UserSidebarContent,
} from '@/lib/api';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Bell,
  Settings,
  Camera,
} from 'lucide-react';

type Props = {
  sidebar: UserSidebarContent;
};

const EMPTY_PROFILE: UserProfile = {
  fullName: '',
  email: '',
  phone: '',
  avatarUrl: '',
  bio: '',
  addressLine: '',
  city: '',
  state: '',
  postalCode: '',
};

export function ProfileClient({ sidebar }: Props) {
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    email?: string;
    avatarUrl?: string;
  }>({});

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await fetchUserProfile();
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    void loadProfile();
  }, []);

  function updateField<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  function validateForm() {
    const nextErrors: { fullName?: string; email?: string; avatarUrl?: string } = {};
    if (!profile.fullName.trim()) {
      nextErrors.fullName = 'Full name is required';
    }
    if (profile.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) {
      nextErrors.email = 'Enter a valid email';
    }
    if (profile.avatarUrl.trim() && !/^https?:\/\/.+/i.test(profile.avatarUrl.trim())) {
      nextErrors.avatarUrl = 'Avatar URL must start with http:// or https://';
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!validateForm()) return;

    setSaving(true);
    try {
      await saveUserProfile({
        fullName: profile.fullName,
        email: profile.email,
        avatarUrl: profile.avatarUrl,
        bio: profile.bio,
        addressLine: profile.addressLine,
        city: profile.city,
        state: profile.state,
        postalCode: profile.postalCode,
      });
      setMessage('Profile saved successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-screen bg-[#f2f5fa]">
      <SessionGuard requiredRole="user" />
      <UserSidebarMobile activeItem="profile" content={sidebar} />
      <div className="hidden lg:block">
        <UserSidebar activeItem="profile" content={sidebar} />
      </div>
      <section className="flex-1 overflow-y-auto bg-[#f8fafe]">
        <div className="mx-auto w-full max-w-[1280px] px-6 py-5">
          <UserTopLogoHeader sidebar={sidebar} />
          
          <div className="mb-6 flex items-center gap-2">
            <span className="h-6 w-1 rounded-full bg-[#4ec2ed]" />
            <h1 className="text-3xl font-semibold tracking-tight text-[#0f2244]">My Profile</h1>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading profile...</p>
          ) : (
            <form className="space-y-6" onSubmit={onSubmit}>
              {/* Profile Header Card */}
              <Card className="rounded-3xl border-[#dfe7f1] bg-white shadow-none">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                    <div className="relative group">
                      <div className="grid h-24 w-24 place-items-center rounded-full bg-[#f3f8ff] text-[#63b0ff]">
                        {profile.avatarUrl ? (
                          <img
                            src={profile.avatarUrl}
                            alt="Profile"
                            className="h-24 w-24 rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-12 w-12" />
                        )}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <Camera className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h2 className="text-2xl font-bold text-[#0f2244]">{profile.fullName || 'Your Name'}</h2>
                      <p className="mt-1 text-sm text-[#6f7f9b]">{profile.email || 'email@example.com'}</p>
                      <p className="mt-2 text-sm text-[#9aabc2]">Member since 2024</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Personal Information */}
                <div className="lg:col-span-2 space-y-6">
                  <Card className="rounded-3xl border-[#dfe7f1] bg-white shadow-none">
                    <CardHeader className="border-b border-[#e6ebf2] pb-4">
                      <CardTitle className="flex items-center gap-2 text-xl font-semibold text-[#0f2244]">
                        <User className="h-5 w-5 text-[#0989d8]" />
                        Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="fullName" className="text-sm font-medium text-[#6f7f9b]">Full Name *</Label>
                          <Input
                            id="fullName"
                            value={profile.fullName}
                            onChange={(e) => updateField('fullName', e.target.value)}
                            className={fieldErrors.fullName ? 'border-destructive' : 'h-11 rounded-xl border-[#dce4ef]'}
                          />
                          {fieldErrors.fullName ? (
                            <p className="text-sm text-destructive">{fieldErrors.fullName}</p>
                          ) : null}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium text-[#6f7f9b]">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={profile.email}
                            onChange={(e) => updateField('email', e.target.value)}
                            className={fieldErrors.email ? 'border-destructive' : 'h-11 rounded-xl border-[#dce4ef]'}
                          />
                          {fieldErrors.email ? (
                            <p className="text-sm text-destructive">{fieldErrors.email}</p>
                          ) : null}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm font-medium text-[#6f7f9b]">Phone</Label>
                          <div className="relative">
                            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ba9bf]" />
                            <Input
                              id="phone"
                              value={profile.phone}
                              disabled
                              className="h-11 rounded-xl border-[#dce4ef] bg-[#f8fafe] pl-10"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="avatarUrl" className="text-sm font-medium text-[#6f7f9b]">Avatar URL</Label>
                          <Input
                            id="avatarUrl"
                            placeholder="https://..."
                            value={profile.avatarUrl}
                            onChange={(e) => updateField('avatarUrl', e.target.value)}
                            className={fieldErrors.avatarUrl ? 'border-destructive' : 'h-11 rounded-xl border-[#dce4ef]'}
                          />
                          {fieldErrors.avatarUrl ? (
                            <p className="text-sm text-destructive">{fieldErrors.avatarUrl}</p>
                          ) : null}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio" className="text-sm font-medium text-[#6f7f9b]">Bio</Label>
                        <Input
                          id="bio"
                          value={profile.bio}
                          onChange={(e) => updateField('bio', e.target.value)}
                          placeholder="Tell us a little about yourself"
                          className="h-11 rounded-xl border-[#dce4ef]"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Address Information */}
                  <Card className="rounded-3xl border-[#dfe7f1] bg-white shadow-none">
                    <CardHeader className="border-b border-[#e6ebf2] pb-4">
                      <CardTitle className="flex items-center gap-2 text-xl font-semibold text-[#0f2244]">
                        <MapPin className="h-5 w-5 text-[#0989d8]" />
                        Address Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                      <div className="space-y-2">
                        <Label htmlFor="addressLine" className="text-sm font-medium text-[#6f7f9b]">Street Address</Label>
                        <Input
                          id="addressLine"
                          value={profile.addressLine}
                          onChange={(e) => updateField('addressLine', e.target.value)}
                          className="h-11 rounded-xl border-[#dce4ef]"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="city" className="text-sm font-medium text-[#6f7f9b]">City</Label>
                          <Input
                            id="city"
                            value={profile.city}
                            onChange={(e) => updateField('city', e.target.value)}
                            className="h-11 rounded-xl border-[#dce4ef]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state" className="text-sm font-medium text-[#6f7f9b]">State</Label>
                          <Input
                            id="state"
                            value={profile.state}
                            onChange={(e) => updateField('state', e.target.value)}
                            className="h-11 rounded-xl border-[#dce4ef]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="postalCode" className="text-sm font-medium text-[#6f7f9b]">Postal Code</Label>
                          <Input
                            id="postalCode"
                            value={profile.postalCode}
                            onChange={(e) => updateField('postalCode', e.target.value)}
                            className="h-11 rounded-xl border-[#dce4ef]"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <Card className="rounded-3xl border-[#dfe7f1] bg-white shadow-none">
                    <CardContent className="p-6">
                      <h3 className="mb-4 text-lg font-semibold text-[#0f2244]">Quick Stats</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-[#0989d8]" />
                            <span className="text-sm text-[#6f7f9b]">Member Since</span>
                          </div>
                          <span className="text-sm font-medium text-[#0f2244]">2024</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-[#0989d8]" />
                            <span className="text-sm text-[#6f7f9b]">Account Status</span>
                          </div>
                          <span className="text-sm font-medium text-[#58c487]">Active</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Account Settings */}
                  <Card className="rounded-3xl border-[#dfe7f1] bg-white shadow-none">
                    <CardContent className="p-6">
                      <h3 className="mb-4 text-lg font-semibold text-[#0f2244]">Quick Actions</h3>
                      <div className="space-y-2">
                        <Button variant="ghost" className="w-full justify-start gap-3 text-[#6f7f9b] hover:bg-[#f3f8ff] hover:text-[#0f2244]">
                          <Bell className="h-4 w-4" />
                          Notification Settings
                        </Button>
                        <Button variant="ghost" className="w-full justify-start gap-3 text-[#6f7f9b] hover:bg-[#f3f8ff] hover:text-[#0f2244]">
                          <Shield className="h-4 w-4" />
                          Security Settings
                        </Button>
                        <Button variant="ghost" className="w-full justify-start gap-3 text-[#6f7f9b] hover:bg-[#f3f8ff] hover:text-[#0f2244]">
                          <Settings className="h-4 w-4" />
                          App Preferences
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              {message ? <p className="text-sm text-primary">{message}</p> : null}

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" className="rounded-xl border-[#dce4ef]">
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="rounded-xl bg-[#0989d8] hover:bg-[#0874b8]">
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
