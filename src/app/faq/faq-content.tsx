"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { GlassCard } from "@/components/ui/glass-card"

const faqItems = [
  {
    question: "What is Frostlytics?",
    answer:
      "Frostlytics is an all-in-one dashboard for the Walrus protocol, providing key analytics such as staking APY, staking trends, net inflows and outflows, and network fees.",
  },
  {
    question: "Why does the APY appear low?",
    answer:
      "Stakers on Walrus are rewarded from storage fees paid by users. A portion of these fees goes to operators, and the remainder is distributed to stakers. As the network is still in its early stage, usage is limited and APY appears modest. Over time, as more Web2 and Web3 projects adopt Walrus, rewards are expected to increase in a sustainable manner.",
  },
  {
    question: "How is Frostlytics different from the official dashboard?",
    answer:
      "In addition to enabling staking and unstaking like the official site, Frostlytics provides a clear timeline of when tokens will be released after unstaking, includes a reward calculator, and offers additional insights not yet available on the official dashboard.",
  },
  {
    question: "How do I connect my wallet?",
    answer:
      "Simply connect your wallet to view your data and manage your staking positions directly through Frostlytics.",
  },
  {
    question: "Does Frostlytics charge additional fees?",
    answer:
      "No. Frostlytics does not charge extra fees. All transactions function the same as staking directly through Walrus.",
  },
  {
    question: "Is the data real-time?",
    answer:
      "Yes. Staking data, APY, inflows/outflows, and fees are sourced directly from the blockchain and update automatically.",
  },
  {
    question: "When will I receive my WAL after unstaking?",
    answer: `After you unstake, tokens are not released right away.

If you unstake in the first half of an epoch, you will receive your WAL in the next epoch.
If you unstake in the second half of an epoch, you will receive your WAL in two epochs.

For example, unstaking at epoch 13 early means your WAL comes back at epoch 14, but unstaking late in epoch 13 means it will come back at epoch 15.`,
  },
  {
    question: "What features are coming next?",
    answer: `Insights into which projects in the ecosystem are storing data on Walrus
Detailed fee contributions by each project
Broader analytics covering the Walrus ecosystem`,
  },
] as const

function FaqItem({
  question,
  answer,
  defaultOpen = false,
}: {
  question: string
  answer: string
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <GlassCard tone="chart" contentClassName="p-0" className="rounded-3xl">
        <CollapsibleTrigger className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left md:px-5">
          <span className="font-heading text-foreground text-base font-semibold tracking-[-0.01em]">
            {question}
          </span>
          <ChevronDown
            className={cn(
              "text-tertiary mt-0.5 size-5 shrink-0 transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t border-white/5 px-4 pb-4 pt-3 md:px-5">
          <p className="text-secondary-foreground text-sm leading-relaxed whitespace-pre-wrap">
            {answer}
          </p>
        </CollapsibleContent>
      </GlassCard>
    </Collapsible>
  )
}

export function FaqContent() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-foreground text-2xl font-bold tracking-[-0.01em]">
          FAQ
        </h1>
        <p className="text-tertiary mt-1 text-sm">
          Everything you need to know about Frostlytics and Walrus staking.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {faqItems.map((item, index) => (
          <FaqItem
            key={item.question}
            question={item.question}
            answer={item.answer}
            defaultOpen={index === 0}
          />
        ))}
      </div>
    </div>
  )
}
