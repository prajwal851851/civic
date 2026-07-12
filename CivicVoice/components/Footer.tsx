"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <div className="sv-footer">
      <Link href="/about">About</Link> &middot;{" "}
      <Link href="/contact">Contact</Link> &middot;{" "}
      <Link href="/faq">FAQ</Link> &middot;{" "}
      <Link href="/privacy-policy">Privacy Policy</Link> &middot;{" "}
      <Link href="/terms">Terms &amp; Conditions</Link>
      <br />
      <br />
      &copy; 2026 CivicVoice
    </div>
  );
}
