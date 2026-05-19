import { Metadata } from "next"

import { FaqContent } from "./faq-content"

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

export default function FAQPage() {
  return <FaqContent />
}
