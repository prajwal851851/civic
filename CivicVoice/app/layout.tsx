import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { SearchProvider } from "@/lib/search-context";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "CivicVoice — Community Issue Reporting",
  description:
    "CivicVoice connects Kathmandu residents with ward offices to report, track, and resolve community issues. Every report is publicly trackable.",
  icons: "/assets/icons/CivicVoice_fevicon.png",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <SearchProvider>
            {children}
          </SearchProvider>
        </AuthProvider>
        <div className="toast" id="toast">
          <span className="toast-icon" id="toastIcon"></span>
          <div>
            <div className="toast-title" id="toastTitle"></div>
            <div className="toast-sub" id="toastSub"></div>
          </div>
        </div>
      </body>
    </html>
  );
}
