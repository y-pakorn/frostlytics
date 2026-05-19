import { cn } from "@/lib/utils"

export const STAKE_CTA_CLASS = cn(
  "h-10 rounded-full border-2 border-white/[0.12] px-3 text-sm font-semibold",
  "[box-shadow:var(--shadow-xs),var(--shadow-skeu-inner-border),var(--shadow-skeu-inner)]"
)

export const UNSTAKE_CTA_CLASS = cn(
  "h-auto flex-1 rounded-full border-2 border-white/[0.12] px-4 py-2.5 text-base font-semibold",
  "[box-shadow:var(--shadow-xs),var(--shadow-skeu-inner-border),var(--shadow-skeu-inner)]"
)

export const WITHDRAW_CTA_CLASS = UNSTAKE_CTA_CLASS

export const DIALOG_OPERATOR_BOX_CLASS =
  "space-y-3 rounded-xl border border-brand-400 p-4"

export const DIALOG_SUMMARY_BOX_CLASS =
  "space-y-2 rounded-xl border border-white/5 bg-surface-elevated/40 p-3"
