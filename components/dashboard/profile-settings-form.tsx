"use client";

import { Camera, Check, KeyRound, LogOut, Trash2, Upload } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { signOutAction } from "@/app/auth/actions";
import {
  removeAvatarAction,
  updatePasswordAction,
  updateProfileAction,
  uploadAvatarAction,
} from "@/app/dashboard/settings/actions";
import { ProfileAvatar } from "@/components/dashboard/profile-avatar";
import { initialActionState } from "@/lib/dashboard/validation";
import type { StaffContext } from "@/lib/dashboard/dal";

type ProfileSettingsFormProps = {
  staff: StaffContext;
  email: string | null;
  children?: React.ReactNode;
};

function FormMessage({ state }: { state: typeof initialActionState }) {
  if (!state.message) return null;
  return <p className="ops-settings-message" data-status={state.status} role="status">{state.message}</p>;
}

function SignOutButton() {
  const { pending } = useFormStatus();
  return (
    <button className="ops-settings-remove" type="submit" disabled={pending}>
      <LogOut aria-hidden="true" />{pending ? "Signing out…" : "Sign out of this device"}
    </button>
  );
}

export function ProfileSettingsForm({ staff, email, children }: ProfileSettingsFormProps) {
  const [profileState, profileAction, profilePending] = useActionState(updateProfileAction, initialActionState);
  const [avatarState, avatarAction, avatarPending] = useActionState(uploadAvatarAction, initialActionState);
  const [removeState, removeAction, removePending] = useActionState(removeAvatarAction, initialActionState);
  const [passwordState, passwordAction, passwordPending] = useActionState(updatePasswordAction, initialActionState);
  const [preview, setPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const passwordFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  useEffect(() => {
    if (passwordState.status === "success") passwordFormRef.current?.reset();
  }, [passwordState.status]);

  function previewAvatar(file: File | undefined) {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  return (
    <>
      <section id="profile" className="ops-settings-section" aria-labelledby="profile-heading">
        <header><span>01</span><div><p>Personal profile</p><h2 id="profile-heading">How you appear in the workspace</h2></div></header>
        <div className="ops-settings-avatar-row" id="avatar">
          <ProfileAvatar
            fullName={staff.fullName}
            email={email}
            avatarUrl={preview || staff.avatarUrl}
            size="lg"
          />
          <div><strong>Profile photo</strong><small>JPG, PNG, or WebP. Maximum 2 MB.</small></div>
          <form action={avatarAction} className="ops-settings-avatar-form">
            <input
              ref={avatarInputRef}
              className="sr-only"
              type="file"
              name="avatar"
              accept="image/jpeg,image/png,image/webp"
              aria-hidden="true"
              tabIndex={-1}
              required
              onChange={(event) => previewAvatar(event.currentTarget.files?.[0])}
            />
            <button className="ops-file-control" type="button" onClick={() => avatarInputRef.current?.click()}>
              <Camera aria-hidden="true" />
              <span>{preview ? "Choose another" : "Choose image"}</span>
            </button>
            <button type="submit" disabled={avatarPending || !preview}><Upload aria-hidden="true" />{avatarPending ? "Uploading…" : "Upload"}</button>
          </form>
          {staff.avatarPath ? <form action={removeAction}><button className="ops-settings-remove" type="submit" disabled={removePending}><Trash2 aria-hidden="true" />{removePending ? "Removing…" : "Remove"}</button></form> : null}
        </div>
        <FormMessage state={avatarState} />
        <FormMessage state={removeState} />

        <form action={profileAction} className="ops-settings-form">
          <label>
            Full name
            <input name="fullName" defaultValue={staff.fullName} required minLength={2} maxLength={120} aria-invalid={Boolean(profileState.fieldErrors?.fullName)} />
            {profileState.fieldErrors?.fullName ? <small>{profileState.fieldErrors.fullName}</small> : null}
          </label>
          <label>
            Email
            <input value={email || "Verified Supabase account"} readOnly aria-describedby="email-note" />
            <small id="email-note">Email changes require a verified Supabase confirmation.</small>
          </label>
          <label>
            Timezone
            <select name="timezone" defaultValue={staff.timezone} aria-invalid={Boolean(profileState.fieldErrors?.timezone)}>
              <option value="Asia/Dubai">Dubai · Gulf Standard Time</option>
              <option value="Etc/UTC">UTC</option>
              <option value="Europe/London">London</option>
              <option value="America/New_York">New York</option>
            </select>
            {profileState.fieldErrors?.timezone ? <small>{profileState.fieldErrors.timezone}</small> : null}
          </label>
          <label>
            Interface language
            <select name="locale" defaultValue={staff.locale} aria-invalid={Boolean(profileState.fieldErrors?.locale)}>
              <option value="en">English</option>
              <option value="ar" disabled>Arabic · coming later</option>
            </select>
            {profileState.fieldErrors?.locale ? <small>{profileState.fieldErrors.locale}</small> : null}
          </label>
          <div className="ops-settings-form-footer">
            <span>Profile preferences are private to this account.</span>
            <button type="submit" disabled={profilePending}><Check aria-hidden="true" />{profilePending ? "Saving…" : "Save profile"}</button>
          </div>
        </form>
        <FormMessage state={profileState} />
      </section>

      {children}

      <section id="security" className="ops-settings-section" aria-labelledby="security-heading">
        <header><span>04</span><div><p>Account security</p><h2 id="security-heading">Password and verified identity</h2></div></header>
        <form ref={passwordFormRef} action={passwordAction} className="ops-settings-form ops-settings-form--security">
          <label>New password<input name="password" type="password" autoComplete="new-password" minLength={12} required aria-invalid={Boolean(passwordState.fieldErrors?.password)} />{passwordState.fieldErrors?.password ? <small>{passwordState.fieldErrors.password}</small> : null}</label>
          <label>Confirm password<input name="confirmation" type="password" autoComplete="new-password" minLength={12} required aria-invalid={Boolean(passwordState.fieldErrors?.confirmation)} />{passwordState.fieldErrors?.confirmation ? <small>{passwordState.fieldErrors.confirmation}</small> : null}</label>
          <div className="ops-settings-form-footer"><span>Use at least 12 characters. A recent login may be required.</span><button type="submit" disabled={passwordPending}><KeyRound aria-hidden="true" />{passwordPending ? "Updating…" : "Update password"}</button></div>
        </form>
        <FormMessage state={passwordState} />
        <div className="ops-settings-avatar-row">
          <ProfileAvatar fullName={staff.fullName} email={email} avatarUrl={staff.avatarUrl} size="sm" />
          <div><strong>Current session</strong><small>{email || "Verified Supabase account"}</small></div>
          <form action={signOutAction}><SignOutButton /></form>
        </div>
      </section>
    </>
  );
}
