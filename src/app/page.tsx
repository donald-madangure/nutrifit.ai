import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import TerminalOverlay from "./components/TerminalOverlay";
import UserPrograms from "./components/UserPrograms";

const HomePage = () => {
  return (
    <div className="flex flex-col min-h-screen text-foreground overflow-hidden">
      <section className="relative z-10 py-24 flex-grow">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative">
            {/* CORNER DECARATION */}
            {/* <div className="absolute -top-10 left-0 w-40 h-40 border-l-2 border-t-2 border-lime-500 border-t-lime-500"/>            */}

            {/* RIGHT SIDE CONTENT */}
            <div className="lg:col-span-5 relative mr-4">
              {/* CORNER PIECES */}
              <div className="absolute -inset-4 pointer-events-none">
                <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2  border-lime-500" />
                <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-lime-500" />
                <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-lime-500" />
                <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-lime-500" />
              </div>

              {/* IMAGE CONTANINER */}
              <div className="relative aspect-square max-w-lg mx-auto">
                <div className="relative overflow-hidden rounded-lg bg-cyber-black">
                  <img
                    src="/fit.png"
                    alt="AI Fitness Coach"
                    className="size-full object-cover object-center"
                  />

                  {/* SCAN LINE */}
                  <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,transparent_calc(50%-1px),var(--cyber-glow-primary)_50%,transparent_calc(50%+1px),transparent_100%)]
                   bg-[length:100%_8px] animate-scanline pointer-events-none " />

                  {/* DECORATIONS ON TOP THE IMAGE */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/3 left-1/3 w-1/3 h-1/3 border border-lime-500/40 rounded-full" />

                    {/* Targeting lines */}
                    <div className="absolute top-1/2 left-0 w-1/4 h-px bg-lime-500/50" />
                    <div className="absolute top-1/2 right-0 w-1/4 h-px bg-lime-500/50" />
                    <div className="absolute top-0 left-1/2 h-1/4 w-px bg-lime-500/50" />
                    <div className="absolute bottom-0 left-1/2 h-1/4 w-px bg-lime-500/50" />
                  </div>

                  6<div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                </div>

                {/* TERMINAL OVERLAY */}
                <TerminalOverlay />
              </div>
            </div>

            {/* RIGHT SIDE CONTENT */}
            <div className="lg:col-span-7 space-y-8 relative">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                <div>
                  <span className="text-foreground">Achieve</span>
                </div>
                <div>
                  <span className="text-lime-500">Your Peak Health</span>
                </div>
                <div className="pt-2">
                  <span className="text-foreground">through</span>
                </div>
                <div className="pt-2">
                  <span className="text-lime-500">Intelligent</span>
                  <span className="text-foreground"> Coaching</span>
                </div>
              </h1>

              {/* SEPERATOR LINE */}
              <div className="h-px w-full bg-gradient-to-r from-lime-500 via-lime-500 to-lime-500 opacity-100"></div>

              <p className="text-xl text-muted-foreground w-2/3">
                Talk to our AI Nutrition and Fitness Coach and get personalized diet and workout routines
                designed just for you
              </p>

              {/* STATS */}
              <div className="flex items-center gap-10 py-6 Geist Mono">
                <div className="flex flex-col">
                  <div className="text-2xl text-lime-500">1000+</div>
                  <div className="text-xs uppercase tracking-wider">ACTIVE USERS</div>
                </div>
                <div className="h-12 w-px bg-gradient-to-b from-transparent via-border to-transparent"></div>
                <div className="flex flex-col">
                  <div className="text-2xl text-lime-500"> &#x3C; 3min</div>
                  <div className="text-xs uppercase tracking-wider">GENERATION TIME</div>
                </div>
                <div className="h-12 w-px bg-gradient-to-b from-transparent via-border to-transparent"></div>
                <div className="flex flex-col">
                  <div className="text-2xl text-lime-500">100%</div>
                  <div className="text-xs uppercase tracking-wider">PERSONALIZED</div>
                </div>
              </div>

              {/* BUTTON */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button
                  size="lg"
                  asChild
                  className="overflow-hidden bg-lime-500 hover:bg-lime-600 text-white text-black-foreground px-8 py-6 text-lg font-medium"
                >
                  <Link href={"/generate-program"} className="flex items-center Geist Mono">
                    Build Your Program
                    <ArrowRightIcon className="ml-2 size-5" />
                  </Link>
                </Button>
              </div>
            </div>            
          </div>
        </div>
      </section>

      <UserPrograms />
    </div>
  );
};
export default HomePage;
