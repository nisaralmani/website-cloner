import type { Metadata } from "next";
import { Suspense } from "react";
import ResetPasswordPage from "@/components/auth/ResetPasswordPage";
import { loginMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = loginMetadata();

export default function InitiateResetPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPage />
    </Suspense>
  );
}
