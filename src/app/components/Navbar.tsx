"use client";

import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { HomeIcon, UserIcon, BicepsFlexed, Phone } from "lucide-react";
import Link from "next/link";

const Navbar = () => {
  const { isSignedIn } = useUser();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-md border-b border-lime-500 py-3">
      <div className="container mx-auto flex items-center justify-between">
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2">
          <div className="p-1 bg-primary/10 rounded">
            <BicepsFlexed className="w-10 h-10 text-lime-500" />
          </div>
          <span className="text-4xl font-bold Geist Mono">
            Nutri<span className="text-lime-500">Fit</span>
          </span>
        </Link>

        {/* NAVIGATION */}
        <nav className="flex items-center gap-5">
          {isSignedIn ? (
            <>
              <Link
                href="/"
                className="flex items-center gap-1.5 text-sm hover:text-lime-300 transition-colors"
              >
                <HomeIcon size={16} />
                <span className="hidden md:inline">Home</span>
              </Link>

              <Link
                href="/generate-program"
                className="flex items-center gap-1.5 text-sm hover:text-lime-300 transition-colors"
              >
                <Phone size={16} />
                <span className="hidden md:inline">Generate</span>
              </Link>

              <Link
                href="/profile"
                className="flex items-center gap-1.5 text-sm hover:text-lime-300 transition-colors"
              >
                <UserIcon size={16} />
                <span className="hidden md:inline">Profile</span>
              </Link>
              <Button
                asChild
                variant="outline"
                className="ml-2 border-lime-500/50 text-lime-500 hover:text-white hover:bg-lime-500/10"
              >
                <Link href="/generate-program">Get Started</Link>
              </Button>
              <UserButton />
            </>
          ) : (
            <>
              <SignInButton>
                <Button
                  variant={"outline"}
                  className="border-lime-500/50 text-lime-500 hover:text-white hover:bg-lime-500/10"
                >
                  Sign In
                </Button>
              </SignInButton>

              <SignUpButton>
                <Button className="bg-lime-500 text-lime-500-foreground hover:bg-lime-500/90">
                  Sign Up
                </Button>
              </SignUpButton>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
export default Navbar;
