import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-6xl font-black text-[#FFD700]/20">404</div>
      <h1 className="text-2xl font-bold text-white">Page Not Found</h1>
      <p className="text-white/40">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link
        href="/"
        className="mt-4 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#FFA500] px-6 py-3 text-sm font-bold text-black transition-all hover:scale-105"
      >
        Back to Home
      </Link>
    </div>
  );
}
