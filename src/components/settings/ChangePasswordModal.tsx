"use client";

import { useEffect, useId, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password-rules";

type ChangePasswordModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const titleId = useId();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Unable to change password.");
        return;
      }

      onClose();
    } catch {
      setError("Unable to change password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c293b]/40 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-[420px] rounded-lg border border-[#E8EAEB] bg-white shadow-[0_16px_48px_rgba(28,41,59,0.18)]"
      >
        <div className="flex items-center justify-between border-b border-[#E8EAEB] px-5 py-4">
          <h3 id={titleId} className="text-lg font-semibold text-[#1c293b]">
            Change password
          </h3>
          <button
            type="button"
            aria-label="Close"
            className="rounded p-1 text-[#828EA1] hover:bg-[#F4F6FB] hover:text-[#1C293B]"
            onClick={onClose}
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <form className="space-y-4 px-5 py-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-[#606976]">Current password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="flex h-10 w-full rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3 text-sm text-[#1c293b] outline-none focus:border-[#1972F5]"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-[#606976]">New password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="flex h-10 w-full rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3 text-sm text-[#1c293b] outline-none focus:border-[#1972F5]"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-[#606976]">
              Confirm new password
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="flex h-10 w-full rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3 text-sm text-[#1c293b] outline-none focus:border-[#1972F5]"
            />
          </label>

          {error && (
            <p className="text-sm font-medium text-[#E34850]">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="h-9 rounded border border-[#E6EAF0] bg-white px-4 text-sm font-bold text-[#1c293b]"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                submitting ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
              className={cn(
                "h-9 rounded border border-transparent bg-[#1972F5] px-4 text-sm font-bold text-white",
                submitting && "opacity-70",
              )}
            >
              Save password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
