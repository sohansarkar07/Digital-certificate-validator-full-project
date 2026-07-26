// Public Certificate Verification Page — Feature 4
// Accessible without wallet. URL: /verify/[id]
// Renders full certificate status, institution info, QR code, and blockchain proof

import { Suspense } from "react";
import type { Metadata } from "next";
import PublicVerifyClient from "./PublicVerifyClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Certificate Verification | CertifyVal`,
    description: `Verify the authenticity of certificate ${id} on the Stellar blockchain via CertifyVal — Global Decentralized Credential Trust Platform.`,
  };
}

export default async function PublicVerifyPage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 opacity-40">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold uppercase tracking-widest">Loading verification...</span>
        </div>
      </div>
    }>
      <PublicVerifyClient certId={id} />
    </Suspense>
  );
}
