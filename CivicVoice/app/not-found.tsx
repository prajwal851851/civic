import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center not-found-page">
      <h1 className="text-6xl font-bold mb-4 not-found-title" style={{ color: '#18181b' }}>
        404
      </h1>
      <h2 className="text-2xl font-semibold mb-2 not-found-subtitle" style={{ color: '#27272a' }}>
        Page Not Found
      </h2>
      <p className="mb-8 max-w-md not-found-text" style={{ color: '#71717a' }}>
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
}
