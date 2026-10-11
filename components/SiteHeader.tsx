import { HomeLink } from "./landing/Intro";
import { Logo } from "./Logo";
import { ProfileMenu } from "./ProfileMenu";

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between px-4 py-5 sm:px-8">
      <HomeLink>
        <Logo size={26} />
      </HomeLink>
      <ProfileMenu />
    </header>
  );
}
