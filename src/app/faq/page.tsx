import { Fragment } from "react"
import { Metadata } from "next"

import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions for Frostlytics. View our FAQ to learn more about our platform.",
  openGraph: {
    title: "FAQ",
    description:
      "Frequently asked questions for Frostlytics. View our FAQ to learn more about our platform.",
  },
}

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

- If you unstake in the first half of an epoch, you will receive your WAL in the next epoch.
- If you unstake in the second half of an epoch, you will receive your WAL in two epochs.

For example, unstaking at epoch 13 early means your WAL comes back at epoch 14, but unstaking late in epoch 13 means it will come back at epoch 15.`,
  },
  {
    question: "What features are coming next?",
    answer: `- Insights into which projects in the ecosystem are storing data on Walrus
- Detailed fee contributions by each project
- Broader analytics covering the Walrus ecosystem`,
  },
  {
    question: "What is the Report Card?",
    answer:
      "The Report Card is a fun feature that displays how long you have been staking WAL. It can be shared on Twitter or with friends as a way to showcase your long-term commitment.",
  },
]

export default function FAQPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-accent-purple-light text-4xl font-semibold">
          Frequently asked questions (FAQ)
        </h1>
        <p className="text-tertiary text-xl">
          Everything you need to know about Frostlytics
        </p>
      </div>
      <div className="space-y-6">
        {faqItems.map((item, i) => (
          <Fragment key={item.question}>
            <div>
              <h2 className="text-lg font-semibold">
                {i + 1}. {item.question}
              </h2>
              <p className="text-tertiary text-wrap whitespace-pre-wrap">
                {item.answer}
              </p>
            </div>
            <Separator className="bg-border-secondary" />
          </Fragment>
        ))}
      </div>
    </div>
  )
}
