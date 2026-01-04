"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { vapi } from "@/lib/vapi";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";

const GenerateProgramPage = () => {
  const [callActive, setCallActive] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [callEnded, setCallEnded] = useState(false);
  const [volume, setVolume] = useState(0);

  const { user, isLoaded } = useUser();
  const router = useRouter();
  const messageContainerRef = useRef<HTMLDivElement>(null);

  // Stable Message Handler to prevent closure issues and duplication
  const handleMessage = useCallback((message: any) => {
    if (message.type === "transcript") {
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        const isPartial = message.transcriptType === "partial";

        // If the last message is from the same person and was partial, update it
        if (lastMsg && lastMsg.role === message.role && lastMsg.isPartial) {
          return [
            ...prev.slice(0, -1),
            { content: message.transcript, role: message.role, isPartial: isPartial }
          ];
        }
        
        // Prevent adding the exact same final message twice
        if (lastMsg && lastMsg.content === message.transcript && !isPartial) {
            return prev;
        }

        // Otherwise, add as a new message
        return [...prev, { content: message.transcript, role: message.role, isPartial: isPartial }];
      });
    }
  }, []);

  // Suppress specific console errors
  useEffect(() => {
    const originalError = console.error;
    console.error = function (msg, ...args) {
      if (msg && (msg.includes("Meeting has ended") || (args[0]?.toString().includes("Meeting has ended")))) {
        return;
      }
      return originalError.call(console, msg, ...args);
    };
    return () => { console.error = originalError; };
  }, []);

  // Auto-scroll on message update
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTo({
        top: messageContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // Handle Redirection
  useEffect(() => {
    if (callEnded) {
      const timer = setTimeout(() => router.push("/profile"), 1000);
      return () => clearTimeout(timer);
    }
  }, [callEnded, router]);

  // Vapi Event Listeners Setup
  useEffect(() => {
    const onCallStart = () => {
      setConnecting(false);
      setCallActive(true);
      setCallEnded(false);
    };

    const onCallEnd = () => {
      setCallActive(false);
      setConnecting(false);
      setIsSpeaking(false);
      setCallEnded(true);
    };

    const onVolumeUpdate = (vol: number) => setVolume(vol);

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("speech-start", () => setIsSpeaking(true));
    vapi.on("speech-end", () => setIsSpeaking(false));
    vapi.on("volume-level", onVolumeUpdate);
    vapi.on("message", handleMessage);
    vapi.on("error", (err) => {
      console.error("Vapi Error:", err);
      setConnecting(false);
      setCallActive(false);
    });

    return () => {
      vapi.removeAllListeners();
    };
  }, [handleMessage]); // Critical: Only re-bind if handleMessage changes

  const toggleCall = async () => {
    if (callActive) {
      vapi.stop();
    } else {
      if (!isLoaded || !user) return;
      try {
        setConnecting(true);
        setMessages([]);
        setCallEnded(false);

        const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Guest";
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

        await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!, {
          variableValues: {
            full_name: fullName,
            user_id: user.id,
            current_day: today,
            // Updated instructions for the Coach persona:
            role_persona: "Nutrition and Fitness Coach",
            day_format_instruction: "Please refer to workout days by their name (e.g., Monday, Tuesday) starting from today, rather than saying Day 1 or Day 2."
          },
        });
      } catch (error) {
        console.error("Failed to start call", error);
        setConnecting(false);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-foreground bg-background pb-6 pt-24">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold Geist-mono tracking-tight">
            Generate your <span className="text-lime-500">nutrition and fitness program</span>
          </h1>
          <p className="text-muted-foreground mt-2">Talk to our coach to build your customized nutrition and wellness programs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* COACH CARD */}
          <Card className="bg-card/50 backdrop-blur-md border-lime-500/30 overflow-hidden relative">
            <div className="aspect-video flex flex-col items-center justify-center p-6">
              <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                <div className="flex items-center gap-1 h-32">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-lime-500 rounded-full transition-all duration-75"
                      style={{ height: isSpeaking ? `${Math.max(10, volume * 100 * Math.random() + 10)}%` : "4px" }}
                    />
                  ))}
                </div>
              </div>

              <div className={`relative size-32 mb-4 rounded-full p-1 border-2 transition-all duration-500 ${isSpeaking ? "border-lime-500 shadow-[0_0_20px_rgba(132,204,22,0.3)]" : "border-transparent"}`}>
                <img src="/avata.png" alt="Coach" className="size-full object-cover rounded-full bg-muted" />
              </div>
              <h2 className="text-xl font-bold">NutriFit Coach</h2>
              <p className="text-sm text-muted-foreground">AI Expert Assistant</p>
              
              <div className="mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-background/50 border border-lime-500/20">
                <div className={`size-2 rounded-full ${isSpeaking ? "bg-lime-500 animate-pulse" : "bg-muted"}`} />
                <span className="text-[10px] uppercase font-medium tracking-widest text-muted-foreground">
                  {isSpeaking ? "Speaking" : callActive ? "Listening" : "Standby"}
                </span>
              </div>
            </div>
          </Card>

          {/* USER CARD */}
          <Card className="bg-card/50 backdrop-blur-md border-border overflow-hidden relative">
            <div className="aspect-video flex flex-col items-center justify-center p-6">
              <div className="size-32 mb-4 rounded-full overflow-hidden border-2 border-border">
                <img src={user?.imageUrl} alt="User" className="size-full object-cover" />
              </div>
              <h2 className="text-xl font-bold">{user?.fullName || "Guest"}</h2>
              <p className="text-sm text-muted-foreground">Elite Achiever</p>
              <div className="mt-4 px-3 py-1 rounded-full bg-background/50 border border-border text-[10px] uppercase tracking-widest text-muted-foreground">
                Ready
              </div>
            </div>
          </Card>
        </div>

        {/* TRANSCRIPT AREA */}
        {messages.length > 0 && (
          <div ref={messageContainerRef} className="w-full bg-card/30 backdrop-blur-xl border border-lime-500/20 rounded-2xl p-6 mb-8 h-80 overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div key={`${msg.role}-${i}`} className={`flex flex-col ${msg.role === 'assistant' ? 'items-start' : 'items-end'}`}>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                    {msg.role === 'assistant' ? 'Coach' : 'You'}
                  </span>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'assistant' ? 'bg-secondary/50 rounded-tl-none' : 'bg-lime-500 text-black rounded-tr-none font-medium'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <Button
            onClick={toggleCall}
            disabled={connecting || callEnded || !isLoaded}
            className={`h-16 px-12 rounded-full text-lg font-bold transition-all duration-300 ${
              callActive ? "bg-red-300 hover:bg-red-800 shadow-lg shadow-red-500/20" : "bg-lime-500 hover:bg-lime-600 text-black shadow-lg shadow-lime-500/20"
            }`}
          >
            {connecting ? "CONNECTING..." : callActive ? "END CALL" : callEnded ? "REDIRECTING..." : "START CALL"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GenerateProgramPage;