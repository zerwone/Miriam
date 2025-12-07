"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { CreditsDisplay } from "@/components/CreditsDisplay";
import { UserMenu } from "@/components/UserMenu";
import "./app.css";

export const dynamic = "force-dynamic";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/app" && pathname?.startsWith(href));
  
  return (
    <Link
      href={href}
      className={`${
        isActive
          ? "border-miriam-purple text-miriam-text font-semibold"
          : "border-transparent text-miriam-text/60 hover:border-miriam-gray/50 hover:text-miriam-text/80"
      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium font-heading transition-colors`}
    >
      {children}
    </Link>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-miriam-bg">
      <nav className="bg-miriam-bg/90 backdrop-blur-sm border-b border-miriam-bgSoft/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/app" className="flex items-center gap-2 mr-8">
                <Image
                  src="/logo-miriam-icon.svg"
                  alt="Miriam Lab"
                  width={24}
                  height={24}
                  className="w-6 h-6"
                />
                <span className="font-heading text-lg font-bold text-miriam-text">
                  Miriam Lab
                </span>
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <NavLink href="/app">Miriam</NavLink>
                <NavLink href="/app/compare">Compare</NavLink>
                <NavLink href="/app/judge">Judge</NavLink>
                <NavLink href="/app/research">Research</NavLink>
                <NavLink href="/app/analytics">Analytics</NavLink>
                <NavLink href="/app/account">Account</NavLink>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <CreditsDisplay />
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
