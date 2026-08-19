import type { CSSProperties } from "react";
import { profileInitials } from "@/lib/dashboard/profile";

type ProfileAvatarProps = {
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  size?: "sm" | "md" | "lg";
};

export function ProfileAvatar({ fullName, email, avatarUrl, size = "md" }: ProfileAvatarProps) {
  const style = avatarUrl
    ? ({ "--profile-avatar": `url("${avatarUrl}")` } as CSSProperties)
    : undefined;

  return (
    <span
      className="ops-profile-avatar"
      data-size={size}
      data-has-image={Boolean(avatarUrl)}
      style={style}
      aria-hidden="true"
    >
      {profileInitials(fullName, email)}
    </span>
  );
}
