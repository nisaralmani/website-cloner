import Link from "next/link";
import { APP_INBOX_PATH, marketingHomeUrl } from "@/lib/marketing-paths";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F4F6FB] px-6 text-center">
      <p className="text-sm font-bold uppercase tracking-wide text-[#1972F5]">404</p>
      <h1 className="mt-3 text-[32px] font-semibold text-[#19253B] md:text-[40px]">
        Page not found
      </h1>
      <p className="mt-3 max-w-[480px] text-lg text-[#5F6D7F]">
        The page you are looking for does not exist or may have been moved.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a
          href={marketingHomeUrl()}
          className="inline-flex h-11 items-center rounded-xl bg-[#1972F5] px-6 text-[15px] font-medium text-white hover:bg-[#1565DB]"
        >
          Go to marketing home
        </a>
        <Link
          href={APP_INBOX_PATH}
          className="inline-flex h-11 items-center rounded-xl border border-[#E8EAEB] bg-white px-6 text-[15px] font-medium text-[#242F47] hover:border-[#1972F5] hover:text-[#1972F5]"
        >
          Open inbox
        </Link>
      </div>
    </div>
  );
}
