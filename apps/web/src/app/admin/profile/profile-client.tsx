'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  fetchUserProfile,
  saveUserProfile,
  type UserProfile,
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

export function ProfileClient() {
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">My Profile</h1>
        <p className="mt-2 text-sm text-slate-500 sm:text-base">Manage your admin profile and account settings</p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading profile...</p>
      ) : (
        <form className="space-y-4 sm:space-y-6" onSubmit={onSubmit}>
          {/* Profile Header Card */}
          <Card className="rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
                <div className="relative group">
                  <div className="grid h-20 w-20 place-items-center rounded-full bg-[#f3f8ff] text-[#63b0ff] sm:h-24 sm:w-24">
                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt="Profile"
                        className="h-20 w-20 rounded-full object-cover sm:h-24 sm:w-24"
                      />
                    ) : (
                      <User className="h-10 w-10 sm:h-12 sm:w-12" />
                    )}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Camera className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{profile.fullName || 'Admin User'}</h2>
                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">{profile.email || 'admin@wrectifai.com'}</p>
                  <p className="mt-1 text-xs text-slate-400 sm:mt-2 sm:text-sm">Administrator</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
            {/* Personal Information */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <Card className="rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl">
                <CardHeader className="border-b border-[#e6ebf2] pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 sm:text-xl">
                    <User className="h-4 w-4 text-[#0989d8] sm:h-5 sm:w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-4 sm:p-6">
                  <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-xs font-medium text-slate-500 sm:text-sm">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={profile.fullName}
                        onChange={(e) => updateField('fullName', e.target.value)}
                        className={fieldErrors.fullName ? 'border-destructive' : 'h-10 rounded-xl border-[#dce4ef] sm:h-11'}
                      />
                      {fieldErrors.fullName ? (
                        <p className="text-xs text-destructive sm:text-sm">{fieldErrors.fullName}</p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-medium text-slate-500 sm:text-sm">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        className={fieldErrors.email ? 'border-destructive' : 'h-10 rounded-xl border-[#dce4ef] sm:h-11'}
                      />
                      {fieldErrors.email ? (
                        <p className="text-xs text-destructive sm:text-sm">{fieldErrors.email}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-xs font-medium text-slate-500 sm:text-sm">Phone</Label>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="phone"
                          value={profile.phone}
                          disabled
                          className="h-10 rounded-xl border-[#dce4ef] bg-[#f8fafe] pl-10 sm:h-11"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="avatarUrl" className="text-xs font-medium text-slate-500 sm:text-sm">Avatar URL</Label>
                      <Input
                        id="avatarUrl"
                        placeholder="https://..."
                        value={profile.avatarUrl}
                        onChange={(e) => updateField('avatarUrl', e.target.value)}
                        className={fieldErrors.avatarUrl ? 'border-destructive' : 'h-10 rounded-xl border-[#dce4ef] sm:h-11'}
                      />
                      {fieldErrors.avatarUrl ? (
                        <p className="text-xs text-destructive sm:text-sm">{fieldErrors.avatarUrl}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-xs font-medium text-slate-500 sm:text-sm">Bio</Label>
                    <Input
                      id="bio"
                      value={profile.bio}
                      onChange={(e) => updateField('bio', e.target.value)}
                      placeholder="Tell us a little about yourself"
                      className="h-10 rounded-xl border-[#dce4ef] sm:h-11"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Address Information */}
              <Card className="rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl">
                <CardHeader className="border-b border-[#e6ebf2] pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 sm:text-xl">
                    <MapPin className="h-4 w-4 text-[#0989d8] sm:h-5 sm:w-5" />
                    Address Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-4 sm:p-6">
                  <div className="space-y-2">
                    <Label htmlFor="addressLine" className="text-xs font-medium text-slate-500 sm:text-sm">Street Address</Label>
                    <Input
                      id="addressLine"
                      value={profile.addressLine}
                      onChange={(e) => updateField('addressLine', e.target.value)}
                      className="h-10 rounded-xl border-[#dce4ef] sm:h-11"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-xs font-medium text-slate-500 sm:text-sm">City</Label>
                      <Input
                        id="city"
                        value={profile.city}
                        onChange={(e) => updateField('city', e.target.value)}
                        className="h-10 rounded-xl border-[#dce4ef] sm:h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-xs font-medium text-slate-500 sm:text-sm">State</Label>
                      <Input
                        id="state"
                        value={profile.state}
                        onChange={(e) => updateField('state', e.target.value)}
                        className="h-10 rounded-xl border-[#dce4ef] sm:h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode" className="text-xs font-medium text-slate-500 sm:text-sm">Postal Code</Label>
                      <Input
                        id="postalCode"
                        value={profile.postalCode}
                        onChange={(e) => updateField('postalCode', e.target.value)}
                        className="h-10 rounded-xl border-[#dce4ef] sm:h-11"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4 sm:space-y-6">
              {/* Quick Stats */}
              <Card className="rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl">
                <CardContent className="p-4 sm:p-6">
                  <h3 className="mb-3 text-base font-semibold text-slate-900 sm:mb-4 sm:text-lg">Quick Stats</h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#0989d8]" />
                        <span className="text-xs text-slate-500 sm:text-sm">Member Since</span>
                      </div>
                      <span className="text-xs font-medium text-slate-900 sm:text-sm">2024</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-[#0989d8]" />
                        <span className="text-xs text-slate-500 sm:text-sm">Role</span>
                      </div>
                      <span className="text-xs font-medium text-[#0989d8] sm:text-sm">Admin</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account Settings */}
              <Card className="rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl">
                <CardContent className="p-4 sm:p-6">
                  <h3 className="mb-3 text-base font-semibold text-slate-900 sm:mb-4 sm:text-lg">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start gap-3 text-slate-500 hover:bg-[#f3f8ff] hover:text-slate-900">
                      <Bell className="h-4 w-4" />
                      <span className="text-sm">Notification Settings</span>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-3 text-slate-500 hover:bg-[#f3f8ff] hover:text-slate-900">
                      <Shield className="h-4 w-4" />
                      <span className="text-sm">Security Settings</span>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-3 text-slate-500 hover:bg-[#f3f8ff] hover:text-slate-900">
                      <Settings className="h-4 w-4" />
                      <span className="text-sm">App Preferences</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {error ? <p className="text-xs text-destructive sm:text-sm">{error}</p> : null}
          {message ? <p className="text-xs text-primary sm:text-sm">{message}</p> : null}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" className="rounded-xl border-[#dce4ef] px-3 text-xs sm:px-4 sm:text-sm">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="rounded-xl bg-[#0989d8] px-3 text-xs hover:bg-[#0874b8] sm:px-4 sm:text-sm">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
