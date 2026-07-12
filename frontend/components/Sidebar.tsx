"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

const allLinks = [
  { href: "/", label: "Home", icon: "M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9", roles: ["citizen"] as const },
  { href: "/community-feed", label: "Community Feed", icon: "M3 4h18v16H3V4Zm0 5h18M9 4v14", roles: ["citizen"] as const },
  { href: "/explore-map", label: "Explore Map", icon: "M9 4 3 6.5v14L9 18l6 2.5 6-2.5v-14L15 6.5 9 4Zm0 0v14m6-11.5v14", roles: ["citizen"] as const },
  { href: "/submit-report", label: "Submit Report", icon: "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z M14 3v6h6 M8 13h8 M8 17h5", roles: ["citizen"] as const },
  { href: "/profile", label: "User Profile", icon: "M12 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4 20c0-3.6 3.6-6 8-6s8 2.4 8 6", roles: ["citizen"] as const },
]

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const role = user?.role || "citizen"

  const links = allLinks.filter((link) => link.roles.includes(role as "citizen"))

  function isActive(href: string) {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  function closeSidebar() {
    const sidebar = document.getElementById("sidebar")
    const overlay = document.getElementById("sidebarOverlay")
    if (sidebar) sidebar.classList.remove("open")
    if (overlay) overlay.classList.remove("show")
  }

  return (
    <>
      <aside className="sidebar" id="sidebar">
        <nav className="side-nav">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`side-link${isActive(link.href) ? " active" : ""}`}
              data-view={link.href.replace("/", "") || "home"}
              onClick={closeSidebar}
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d={link.icon}
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>
        <div
          className="sv-footer"
          style={{ border: "none", padding: "16px 20px" }}
        >
          {footerLinks.map((fl, i) => (
            <span key={fl.href}>
              {i > 0 && <span> &middot; </span>}
              <Link href={fl.href} onClick={closeSidebar}>{fl.label}</Link>
            </span>
          ))}
          <br />
          <br />
          &copy; 2026 CivicVoice
        </div>
      </aside>
      <div className="sidebar-overlay" id="sidebarOverlay" onClick={closeSidebar}></div>
    </>
  )
}
