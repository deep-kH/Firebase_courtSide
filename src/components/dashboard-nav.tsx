
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutGrid, User, CalendarCheck, Flame, Users } from "lucide-react";

const links = [
  { name: "Facilities", href: "/dashboard", icon: LayoutGrid },
  { name: "My Bookings", href: "/dashboard/bookings", icon: CalendarCheck },
  { name: "Interest Hub", href: "/dashboard/hub", icon: Flame },
  { name: "My Teams", href: "/dashboard/teams", icon: Users },
  { name: "My Profile", href: "/dashboard/profile", icon: User },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="grid items-start gap-2">
      {links.map((link, index) => {
        const isActive = pathname.startsWith(link.href) && (link.href !== '/dashboard' || pathname === '/dashboard');
        return (
          <Link
            key={index}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              isActive && "bg-muted text-primary"
            )}
          >
            <link.icon className="h-4 w-4" />
            {link.name}
          </Link>
        );
      })}
    </nav>
  );
}
