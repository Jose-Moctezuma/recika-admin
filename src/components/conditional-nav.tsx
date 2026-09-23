"use client";

import { usePathname } from "next/navigation";
import { NavSidebar } from "@/components/nav-sidebar";

export function ConditionalNav() {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return <NavSidebar />;
}
