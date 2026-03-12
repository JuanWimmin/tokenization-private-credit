"use client";

import { FloatingDock } from "@tokenization/ui/floating-dock";
import { CircleDollarSign, SquaresExclude, TrendingUp, Wallet } from "lucide-react";
import { useEffect, useState } from "react";

export function FloatingDockDemo() {
  const links = [
    {
      title: "Invest",
      icon: (
        <CircleDollarSign className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/",
    },
    {
      title: "My Investments",
      icon: (
        <Wallet className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/investments",
    },
    {
      title: "ROI",
      icon: (
        <TrendingUp className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/roi",
    },
    {
      title: "Claim ROI",
      icon: (
        <SquaresExclude className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/claim-roi",
    },
  ];

  const [hide, setHide] = useState(false);

  useEffect(() => {
    const check = () => {
      const hasOpenDialog =
        typeof document !== "undefined" &&
        document.querySelector('[role="dialog"]');
      setHide(Boolean(hasOpenDialog));
    };

    const observer = new MutationObserver(check);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    check();
    return () => observer.disconnect();
  }, []);

  if (hide) return null;

  return <FloatingDock items={links} />;
}
