import "./public-pages.css";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import RoleRoute from "@/components/RoleRoute";
import OfficialPendingBanner from "@/components/OfficialPendingBanner";

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleRoute allowedRoles={["citizen"]} fallback="/official-dashboard">
      <Header />
      <div className="layout">
        <Sidebar />
        <main className="feed-panel">
          <OfficialPendingBanner />
          {children}
          <Footer />
        </main>
      </div>
    </RoleRoute>
  );
}
