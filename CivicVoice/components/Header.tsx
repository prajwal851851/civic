"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSearch } from "@/lib/search-context";
import { useAuth } from "@/lib/auth-context";
import { getNotifications } from "@/lib/api/notifications";

export default function Header() {
  const pathname = usePathname();
  const { searchQuery, setSearchQuery } = useSearch();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    const stored = localStorage.getItem("cv-dark-mode");
    if (
      stored === "true" ||
      (!stored &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark-mode");
    }
  }, []);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  function toggleSidebar() {
    const next = !sidebarOpen;
    setSidebarOpen(next);
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    if (sidebar) sidebar.classList.toggle("open", next);
    if (overlay) overlay.classList.toggle("show", next);
  }

  function closeSidebar() {
    if (!sidebarOpen) return;
    setSidebarOpen(false);
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    if (sidebar) sidebar.classList.remove("open");
    if (overlay) overlay.classList.remove("show");
  }

  useEffect(() => {
    closeSidebar();
  }, [pathname]);

  function toggleDarkMode() {
    document.documentElement.classList.toggle("dark-mode");
    localStorage.setItem(
      "cv-dark-mode",
      String(document.documentElement.classList.contains("dark-mode"))
    );
  }

  const isFeedPage = pathname === "/community-feed"

  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) { setUnreadCount(0); return }
    let cancelled = false
    getNotifications().then((data: any) => {
      if (cancelled) return
      const arr = Array.isArray(data) ? data : (data?.results ?? [])
      setUnreadCount(arr.filter((n: any) => !n.is_read).length)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [user])

  return (
    <header className="site-header">
      <div className="header-inner">
        <button
          className="menu-toggle"
          id="menuToggle"
          aria-label="Toggle navigation"
          aria-expanded={sidebarOpen}
          onClick={toggleSidebar}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <Link href={user?.role === "official" ? "/official-dashboard" : "/"} className="logo" id="logoLink">
          Civic<span className="logo-accent">Voice</span>
        </Link>
        {isFeedPage && (
          <div className="search-box">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/>
              <line x1="16.3" y1="16.3" x2="21" y2="21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search..."
              aria-label="Search reports"
              id="searchInput"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
        <button
          className="dm-toggle"
          id="dmToggle"
          title="Toggle dark mode"
          onClick={toggleDarkMode}
        >
          <svg className="dm-sun" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          <svg className="dm-moon" viewBox="0 0 24 24" fill="none">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="header-actions">
          {user ? (
            <>
              {user.role !== "official" && (
                <Link href="/notifications" className="notif-btn" id="notifBtn" title="Notifications" style={{ position: 'relative' }}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="notif-badge-count">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  )}
                </Link>
              )}
              <div className="user-dropdown" ref={dropdownRef}>
                <button className="user-avatar-btn" onClick={() => setDropdownOpen(!dropdownOpen)} title="Profile">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="user-avatar-img" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </button>
                {dropdownOpen && (
                  <div className="user-dropdown-menu">
                    <div className="user-dropdown-header">
                      <span className="user-dropdown-name">{user.name}</span>
                      {user.username && <span className="user-dropdown-username">@{user.username}</span>}
                    </div>
                    <Link href={user.role === "official" ? "/official-profile" : "/profile"} className="user-dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-3.6 3.6-6 8-6s8 2.4 8 6" />
                      </svg>
                      Profile
                    </Link>
                    {user.role !== "official" && (
                      <Link href="/notifications" className="user-dropdown-item" onClick={() => setDropdownOpen(false)}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        Notifications
                      </Link>
                    )}
                    <button className="user-dropdown-item" onClick={() => { logout(); setDropdownOpen(false); }}>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-text" id="loginBtn">Login</Link>
              <Link href="/signup" className="btn btn-primary" id="signupBtn">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
