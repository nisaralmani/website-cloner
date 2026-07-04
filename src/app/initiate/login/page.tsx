import type { Metadata } from "next";
import { Suspense } from "react";
import LoginPage from "@/components/auth/LoginPage";
import { loginMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = loginMetadata();

export default function InitiateLoginPage() {
  return (
    <>
      <div style={{ display: "none" }}>
        <a href="https://help.bybelt.com/">Help Center</a>
        <a href="/api/auth/google">Google Sign In</a>
      </div>
      <Suspense fallback={null}>
        <LoginPage />
      </Suspense>
    </>
  );
}