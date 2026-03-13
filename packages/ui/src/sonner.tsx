"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--card)",
          "--normal-text": "var(--card-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--success-bg": "var(--success-bg)",
          "--success-border": "var(--success)",
          "--success-text": "var(--success)",
          "--error-bg": "#FEF2F2",
          "--error-border": "var(--destructive)",
          "--error-text": "var(--destructive)",
          "--warning-bg": "#FFF7ED",
          "--warning-border": "var(--accent-orange)",
          "--warning-text": "var(--accent-orange)",
          "--info-bg": "var(--brand-primary-light)",
          "--info-border": "var(--brand-primary)",
          "--info-text": "var(--brand-primary)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };


