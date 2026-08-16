import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "K8Sage — AI SRE for your cluster",
  description:
    "Ask questions about your Kubernetes cluster in plain English. K8Sage answers with live evidence from the cluster itself.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-mono antialiased">{children}</body>
    </html>
  );
}
