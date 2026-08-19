"use client";

import {
  ArrowUpRight,
  Building2,
  ChevronDown,
  LogOut,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useState, useTransition } from "react";
import { signOutAction } from "@/app/auth/actions";
import { ProfileAvatar } from "@/components/dashboard/profile-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { StaffContext } from "@/lib/dashboard/dal";

type ProfileMenuProps = {
  staff: StaffContext;
  email: string | null;
};

export function ProfileMenu({ staff, email }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [signingOut, startSignOut] = useTransition();
  const role = staff.role.replaceAll("_", " ");

  return (
    <DropdownMenuTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button
        className="ops-profile-trigger"
        variant="ghost"
        aria-label={`Open profile menu for ${staff.fullName}`}
      >
        <ProfileAvatar fullName={staff.fullName} email={email} avatarUrl={staff.avatarUrl} />
        <span className="ops-profile-trigger-copy">
          <strong>{staff.fullName}</strong>
          <small>{role} · account</small>
        </span>
        <ChevronDown aria-hidden="true" />
      </Button>

      <DropdownMenu placement="bottom end" offset={8} className="ops-profile-menu">
        <DropdownMenuLabel className="ops-profile-menu-identity">
          <ProfileAvatar
            fullName={staff.fullName}
            email={email}
            avatarUrl={staff.avatarUrl}
            size="lg"
          />
          <span>
            <strong>{staff.fullName}</strong>
            <small>{email || "Verified staff account"}</small>
            <em>{staff.organizationName} · {role}</em>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem href="/dashboard/settings#profile" textValue="Profile settings">
          <UserRound aria-hidden="true" />
          Profile and photo
        </DropdownMenuItem>
        <DropdownMenuItem href="/dashboard/settings#workspace" textValue="Workspace settings">
          <Building2 aria-hidden="true" />
          Workspace settings
        </DropdownMenuItem>
        <DropdownMenuItem href="/dashboard/settings#security" textValue="Security settings">
          <ShieldCheck aria-hidden="true" />
          Security and sessions
        </DropdownMenuItem>
        <DropdownMenuItem href="/dashboard/settings" textValue="All settings">
          <Settings aria-hidden="true" />
          All settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          textValue="Open buyer experience in a new tab"
        >
          <ArrowUpRight aria-hidden="true" />
          Open buyer experience
          <span className="ops-profile-menu-meta">New tab</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          textValue="Sign out"
          isDisabled={signingOut}
          onAction={() => {
            setIsOpen(false);
            startSignOut(() => signOutAction());
          }}
        >
          <LogOut aria-hidden="true" />
          {signingOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenu>
    </DropdownMenuTrigger>
  );
}
