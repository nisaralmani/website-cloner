import type { Metadata } from "next";
import { Suspense } from "react";
import VerifyEmailPage from "@/components/auth/VerifyEmailPage";
import { loginMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = loginMetadata();

export default function InitiateVerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailPage />
    </Suspense>
  );
}
