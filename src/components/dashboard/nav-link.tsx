'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type NavLinkProps = {
  href: string;
  label: string;
};

export function NavLink({ href, label }: NavLinkProps) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "rounded-2xl px-4 py-3 text-sm font-semibold transition",
        active ? "bg-accent text-white shadow-lg shadow-accent/20" : "bg-white/70 text-foreground hover:bg-white",
      )}
    >
      {label}
    </Link>
  );
}
