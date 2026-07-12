import Header from "@/components/Header"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="auth-page">
      <Header />
      <main>
        <div className="auth-container">
          {children}
        </div>
      </main>
    </div>
  )
}
