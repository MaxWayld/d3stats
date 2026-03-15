import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-32">
      <p className="text-[80px] font-extralight text-text-muted">404</p>
      <p className="text-text-secondary mt-2">Page not found</p>
      <Link href="/" className="text-accent hover:underline mt-4 text-sm">
        Go to Dashboard
      </Link>
    </div>
  );
}
