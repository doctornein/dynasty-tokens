import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileCollection } from "@/components/profile/ProfileCollection";
import type { Profile, OwnedCard } from "@/types";
import type { Metadata } from "next";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .ilike("username", username)
    .single();

  if (!profile) {
    return { title: "Profile Not Found — Dynasty Tokens" };
  }

  return {
    title: `${profile.display_name ?? profile.username} — Dynasty Tokens`,
    description: profile.bio ?? `Check out ${profile.display_name ?? profile.username}'s card collection on Dynasty Tokens.`,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .ilike("username", username)
    .single();

  if (!profile) notFound();

  const typedProfile = profile as Profile;

  const { data: cards } = await supabase
    .from("owned_cards")
    .select("*")
    .eq("user_id", profile.id)
    .order("acquired_at", { ascending: false });

  const ownedCards: OwnedCard[] = (cards ?? []).map((c) => ({
    instanceId: c.instance_id,
    playerId: c.player_id,
    acquiredAt: c.acquired_at,
    packId: c.pack_id,
  }));

  return (
    <div>
      <ProfileHeader profile={typedProfile} />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <ProfileCollection cards={ownedCards} />
      </div>
    </div>
  );
}
