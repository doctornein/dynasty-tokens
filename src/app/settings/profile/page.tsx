"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuthStore } from "@/stores/authStore";
import { createClient } from "@/lib/supabase/client";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlowButton } from "@/components/ui/GlowButton";
import { AvatarCropModal } from "@/components/profile/AvatarCropModal";
import { User, Camera, AlertCircle, Check } from "lucide-react";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { user, profile, isAuthenticated, loading, refreshProfile } = useAuthStore();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [twitter, setTwitter] = useState("");
  const [instagram, setInstagram] = useState("");
  const [youtube, setYoutube] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [headerPreview, setHeaderPreview] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [showCrop, setShowCrop] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated()) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setUsername(profile.username ?? "");
      setBio(profile.bio ?? "");
      setTwitter(profile.social_twitter ?? "");
      setInstagram(profile.social_instagram ?? "");
      setYoutube(profile.social_youtube ?? "");
      setAvatarPreview(profile.avatar_url);
      setHeaderPreview(profile.header_url);
    }
  }, [profile]);

  const uploadFile = async (file: File | Blob, path: string): Promise<string | null> => {
    const supabase = createClient();
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) return null;
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setShowCrop(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCroppedAvatar = async (blob: Blob) => {
    if (!user) return;
    const url = await uploadFile(blob, `${user.id}/avatar.webp`);
    if (url) setAvatarPreview(url + "?t=" + Date.now());
  };

  const handleHeaderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const ext = file.name.split(".").pop();
    const url = await uploadFile(file, `${user.id}/header.${ext}`);
    if (url) setHeaderPreview(url + "?t=" + Date.now());
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    const trimmedUsername = username.trim();
    if (!trimmedUsername || trimmedUsername.length < 3) {
      setError("Username must be at least 3 characters");
      setSaving(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      setError("Username can only contain letters, numbers, and underscores");
      setSaving(false);
      return;
    }

    const supabase = createClient();

    // Check username uniqueness if changed
    if (trimmedUsername.toLowerCase() !== profile?.username?.toLowerCase()) {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", trimmedUsername)
        .neq("id", user!.id)
        .maybeSingle();

      if (existing) {
        setError("Username is already taken");
        setSaving(false);
        return;
      }
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        username: trimmedUsername,
        bio: bio.trim() || null,
        social_twitter: twitter.trim() || null,
        social_instagram: instagram.trim() || null,
        social_youtube: youtube.trim() || null,
        avatar_url: avatarPreview,
        header_url: headerPreview,
      })
      .eq("id", user!.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    await refreshProfile();
    setSuccess(true);
    setSaving(false);
  };

  if (loading || !profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-white/40">Loading...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-white">Edit Profile</h1>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Header image */}
        <GlassPanel className="overflow-hidden">
          <div className="relative h-40">
            {headerPreview ? (
              <Image src={headerPreview} alt="" fill className="object-cover" sizes="100vw" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-blue-600/40 via-[#12121a] to-red-600/40" />
            )}
            <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
              <Camera className="h-8 w-8 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handleHeaderChange} />
            </label>
          </div>
        </GlassPanel>

        {/* Avatar */}
        <div className="-mt-12 ml-6">
          <label className="group relative inline-block cursor-pointer">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-[#0a0a0f] bg-[#12121a]">
              {avatarPreview ? (
                <Image src={avatarPreview} alt="" width={96} height={96} className="h-full w-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-white/20" />
              )}
            </div>
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-6 w-6 text-white" />
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
          </label>
        </div>

        {cropSrc && (
          <AvatarCropModal
            open={showCrop}
            onOpenChange={setShowCrop}
            imageSrc={cropSrc}
            onCropComplete={handleCroppedAvatar}
          />
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
            <Check className="h-4 w-4 shrink-0" />
            Profile updated!
          </div>
        )}

        <GlassPanel className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm text-white/60">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-[#FFD700]/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-white/60">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={30}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-[#FFD700]/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-white/60">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={280}
              rows={3}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-[#FFD700]/50 focus:outline-none"
              placeholder="Tell people about yourself..."
            />
            <p className="mt-1 text-xs text-white/30">{bio.length}/280</p>
          </div>
        </GlassPanel>

        <GlassPanel className="space-y-4 p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/60">Social Links</h2>

          <div>
            <label className="mb-1.5 block text-sm text-white/60">Twitter / X</label>
            <input
              type="text"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              placeholder="username (without @)"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-[#FFD700]/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-white/60">Instagram</label>
            <input
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="username"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-[#FFD700]/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-white/60">YouTube</label>
            <input
              type="text"
              value={youtube}
              onChange={(e) => setYoutube(e.target.value)}
              placeholder="channel handle"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-[#FFD700]/50 focus:outline-none"
            />
          </div>
        </GlassPanel>

        <GlowButton type="submit" variant="gold" className="w-full" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </GlowButton>
      </form>
    </div>
  );
}
