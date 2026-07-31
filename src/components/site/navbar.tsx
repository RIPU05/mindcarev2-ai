import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Menu } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const links = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Dashboard", href: "#dashboard" },
  { label: "Stories", href: "#stories" },
  { label: "FAQ", href: "#faq" },
];

function Wordmark() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="MindCare AI home">
      <span
        aria-hidden
        className="grid size-8 place-items-center rounded-full border border-border bg-primary-soft"
      >
        <span className="block size-2.5 rounded-full bg-primary" />
      </span>
      <span className="font-display text-lg tracking-tight">MindCare AI</span>
    </Link>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md"
    >
      <nav className="mx-auto flex h-18 w-full max-w-6xl items-center justify-between px-6 py-4 sm:px-8">
        <Wordmark />

        <ul className="hidden items-center gap-8 text-sm md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-muted-foreground transition-colors duration-300 hover:text-foreground"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghostLink" size="sm" asChild>
            <a href="#cta">Sign in</a>
          </Button>
          <Button variant="solid" size="sm" className="h-10 px-5" asChild>
            <a href="#cta">Start journaling</a>
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="quiet" size="icon" aria-label="Open menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85vw] max-w-xs bg-background">
            <SheetTitle className="font-display text-lg font-normal">Menu</SheetTitle>
            <ul className="mt-8 space-y-5">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="text-lg text-foreground/80 transition-colors hover:text-primary"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <Button variant="solid" size="pill" className="mt-10 w-full" asChild>
              <a href="#cta" onClick={() => setOpen(false)}>
                Start journaling
              </a>
            </Button>
          </SheetContent>
        </Sheet>
      </nav>
    </motion.header>
  );
}
