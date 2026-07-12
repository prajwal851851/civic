import Header from "@/components/Header"
import OfficialSidebar from "./official-sidebar"
import Footer from "@/components/Footer"
import RoleRoute from "@/components/RoleRoute"

export default function OfficialLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleRoute allowedRoles={["official"]} fallback="/community-feed">
      <Header />
      <div className="layout">
        <OfficialSidebar />
        <main className="feed-panel">
          {children}
          <Footer />
        </main>
      </div>
    </RoleRoute>
  )
}
