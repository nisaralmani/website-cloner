import type { Metadata } from "next";
import { Suspense } from "react";
import ForgotPasswordPage from "@/components/auth/ForgotPasswordPage";
import { loginMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = loginMetadata();

export default function InitiateForgotPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordPage />
    </Suspense>
  );
}
