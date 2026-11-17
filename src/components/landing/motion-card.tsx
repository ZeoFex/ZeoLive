"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

const CardHoverContext = createContext(false);
/** null = this block watches itself. false = the section is not on screen yet. */
const RevealContext = createContext<boolean | null>(null);

export function RevealGroup({
  children,
  className,
  connect = "row",
  lineClassName,
}: {
  children: ReactNode;
  className?: string;
  connect?: "row" | "column" | "spine" | "none";
  lineClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, amount: 0.32 });
  const active = Boolean(reduce) || inView;

  return (
    <RevealContext.Provider value={active}>
      <div ref={ref} className={cn("relative", className)}>
        {connect === "row" && (
          <>
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-x-[8%] z-0 hidden h-[2px] origin-left rounded-full bg-gradient-to-r from-transparent via-[#0066CC] to-transparent md:block",
                lineClassName ?? "top-1/2",
                active ? "scale-x-100" : "scale-x-0"
              )}
              style={{ transition: "transform 1.15s cubic-bezier(0.22,1,0.36,1)" }}
            />
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute bottom-3 left-3 top-3 z-0 w-[2px] origin-top rounded-full bg-[#0066CC]/55 md:hidden",
                active ? "scale-y-100" : "scale-y-0"
              )}
              style={{ transition: "transform 1.15s cubic-bezier(0.22,1,0.36,1)" }}
            />
          </>
        )}
        {connect === "spine" && (
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute bottom-2 left-0 top-2 z-0 w-px origin-top bg-foreground/25",
              active ? "scale-y-100" : "scale-y-0"
            )}
            style={{ transition: "transform 1.2s cubic-bezier(0.22,1,0.36,1)" }}
          />
        )}
        {connect === "column" && (
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute bottom-3 left-3 top-3 z-0 w-[2px] origin-top rounded-full bg-[#0066CC]/55 sm:left-1/2 sm:-translate-x-1/2",
              active ? "scale-y-100" : "scale-y-0"
            )}
            style={{ transition: "transform 1.2s cubic-bezier(0.22,1,0.36,1)" }}
          />
        )}
        {children}
      </div>
    </RevealContext.Provider>
  );
}

export function MotionCard({
  children,
  index = 0,
  className,
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const revealed = useContext(RevealContext);
  const ownRef = useRef<HTMLDivElement>(null);
  const ownView = useInView(ownRef, { once: true, amount: 0.45 });
  const show = Boolean(reduce) || (revealed === null ? ownView : revealed);
  const [hover, setHover] = useState(false);

  return (
    <CardHoverContext.Provider value={hover && show && !reduce}>
      <motion.div
        ref={ownRef}
        className={cn("relative z-10 group", !show && "pointer-events-none", className)}
        initial={{ opacity: 0, y: 48, scale: 0.92 }}
        animate={
          show
            ? { opacity: 1, y: 0, scale: 1 }
            : { opacity: 0, y: 48, scale: 0.92 }
        }
        transition={
          reduce
            ? { duration: 0 }
            : { type: "spring", stiffness: 230, damping: 20, delay: index * 0.12 }
        }
        whileHover={reduce ? undefined : { y: -6 }}
        onHoverStart={() => setHover(true)}
        onHoverEnd={() => setHover(false)}
      >
        {children}
      </motion.div>
    </CardHoverContext.Provider>
  );
}

export function MotionTitle({
  text,
  className,
  as: Tag = "h2",
}: {
  text: string;
  className?: string;
  as?: "h2" | "h3" | "p";
}) {
  const reduce = useReducedMotion();
  const hovered = useContext(CardHoverContext);
  const revealed = useContext(RevealContext);
  const titleRef = useRef<HTMLSpanElement>(null);
  const ownView = useInView(titleRef, { once: true, amount: 0.8 });
  const [ownHover, setOwnHover] = useState(false);
  const words = text.trim().split(/\s+/).filter(Boolean);
  const seen = revealed === null ? ownView : revealed;

  if (reduce) {
    return <Tag className={className}>{text}</Tag>;
  }

  const sliding = hovered || ownHover;

  return (
    <Tag
      className={className}
      onMouseEnter={() => setOwnHover(true)}
      onMouseLeave={() => setOwnHover(false)}
    >
      <motion.span
        ref={titleRef}
        className="inline-flex flex-wrap gap-x-[0.28em]"
        initial="hidden"
        animate={sliding ? "hover" : seen ? "show" : "hidden"}
      >
        {words.map((word, wordIndex) => (
          <span key={`${word}-${wordIndex}`} className="inline-flex whitespace-nowrap">
            {word.split("").map((char, charIndex) => (
              <span
                key={`${char}-${charIndex}`}
                className="inline-block h-[1.15em] overflow-hidden align-bottom leading-[1.15]"
              >
                <motion.span
                  className="flex flex-col"
                  variants={{
                    hidden: { y: "100%" },
                    show: {
                      y: "0%",
                      transition: {
                        duration: 0.7,
                        ease,
                        delay: (wordIndex * 4 + charIndex) * 0.018,
                      },
                    },
                    hover: {
                      y: "-50%",
                      transition: { duration: 0.45, ease, delay: charIndex * 0.012 },
                    },
                  }}
                >
                  <span className="block h-[1.15em]">{char}</span>
                  <span aria-hidden className="block h-[1.15em]">
                    {char}
                  </span>
                </motion.span>
              </span>
            ))}
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}
