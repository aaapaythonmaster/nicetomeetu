import type { ReactNode } from "react";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[#120f17] text-white">{children}</div>;
}
