"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NavLink } from "./NavLink";
import { AuthButton } from "@/components/auth/AuthButton";
import { BalanceDisplay } from "@/components/wallet/BalanceDisplay";
import { motion, AnimatePresence } from "framer-motion";

interface MobileNavProps {
  links: { href: string; label: string }[];
}

export function MobileNav({ links }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Toggle menu"
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 right-0 top-16 border-b border-white/10 bg-[#0a0a0f]/95 p-4 backdrop-blur-xl"
          >
            <nav className="flex flex-col gap-4">
              {links.map((link) => (
                <NavLink key={link.href} href={link.href} className="text-base" onClick={() => setOpen(false)}>
                  {link.label}
                </NavLink>
              ))}
              <div className="flex items-center gap-3 border-t border-white/10 pt-4">
                <BalanceDisplay />
                <AuthButton />
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
