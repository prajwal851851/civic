"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { href: "/official-dashboard", label: "Dashboard", icon: "M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" },
  { href: "/official-issues", label: "All Issues", icon: "M3 4h18v16H3V4Zm0 5h18" },
  { href: "/official-notices", label: "Notices", icon: "M18 8V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v2M4 8h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" },
  { href: "/official-moderation", label: "Moderation", icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
  { href: "/official-profile", label: "Profile", icon: "M12 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4 20c0-3.6 3.6-6 8-6s8 2.4 8 6" },
]

export default function OfficialSidebar() {
  const pathname = usePathname()

  function closeSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    if (sidebar) sidebar.classList.remove("open");
    if (overlay) overlay.classList.remove("show");
  }

  return (
    <>
      <aside className="sidebar" id="sidebar">
        <nav className="side-nav">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={"side-link" + (pathname.startsWith(link.href) ? " active" : "")}
              onClick={closeSidebar}
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path d={link.icon} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <div className="sidebar-overlay" id="sidebarOverlay" onClick={closeSidebar}></div>
    </>
  )
}
