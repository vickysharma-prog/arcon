import Link from "next/link";
import { Logo } from "./Logo";
import { ProfileMenu } from "./ProfileMenu";

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between px-4 py-5 sm:px-8">
      <Link href="/" aria-label="Arcon home">
        <Logo size={26} />
      </Link>
      <ProfileMenu />
    </header>
  );
}
