"use client";

import { motion } from "framer-motion";
import { UserPlus, Package, Trophy } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Create Account",
    description: "Sign up for free and get 300 DT tokens to start building your dynasty.",
    color: "#00D4FF",
  },
  {
    icon: Package,
    title: "Buy & Open Packs",
    description: "Choose from Starter to Dynasty tier packs. Tear them open and discover your cards.",
    color: "#8B5CF6",
  },
  {
    icon: Trophy,
    title: "Earn Rewards",
    description: "When your players hit real-game performance thresholds, DT rewards appear for you to claim and redeem.",
    color: "#FFD700",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.2 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export function HowItWorks() {
  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-12 text-center text-3xl font-bold text-white md:text-4xl">
          How It Works
        </h2>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 gap-8 md:grid-cols-3"
        >
          {steps.map((step, i) => (
            <motion.div
              key={i}
              variants={item}
              className="relative flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 p-8 text-center"
            >
              <div className="absolute -top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#0a0a0f] text-sm font-bold" style={{ color: step.color, border: `2px solid ${step.color}` }}>
                {i + 1}
              </div>
              <div
                className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${step.color}15` }}
              >
                <step.icon className="h-8 w-8" style={{ color: step.color }} />
              </div>
              <h3 className="mb-2 text-lg font-bold text-white">{step.title}</h3>
              <p className="text-sm text-white/40">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
