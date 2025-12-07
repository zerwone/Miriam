"use client";

import Link from "next/link";
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
          ? "border-blue-500 text-gray-900 dark:text-white"
          : "border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200"
      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link href="/app" className="flex items-center px-2 py-4 text-xl font-bold text-gray-900 dark:text-white">
                Miriam Lab
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
