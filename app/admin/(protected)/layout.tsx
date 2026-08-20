import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";

import { logoutAction } from "@/src/features/resume/actions";
import { getAdminSession } from "@/src/features/resume/auth";

export default function ProtectedAdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <Suspense fallback={<AdminShellFallback />}>
      <ProtectedAdminShell>{children}</ProtectedAdminShell>
    </Suspense>
  );
}

async function ProtectedAdminShell({ children }: { children: ReactNode }) {
  await connection();
  if (!(await getAdminSession())) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-[#120f17] text-white">
      <header className="border-b border-white/10 bg-[#120f17]/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
          <Link href="/admin" className="font-semibold tracking-tight">
            Nicetomeetu <span className="text-cyan-300">Admin</span>
          </Link>
          <form action={logoutAction}>
            <button className="text-sm text-slate-400 transition hover:text-white" type="submit">
              退出登录
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}

function AdminShellFallback() {
  return <div className="min-h-screen bg-[#120f17]" aria-hidden="true" />;
}
