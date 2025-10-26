import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline";
};

export function Button({ className, variant = "default", ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition active:scale-[.98]";
  const styles = variant === "outline"
    ? "border border-slate-300 dark:border-slate-700 bg-transparent hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
    : "bg-blue-600 hover:bg-blue-700 text-white";
  return <button className={cn(base, styles, className)} {...props} />;
}
