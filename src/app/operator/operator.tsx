"use client"

import { lazy, Suspense, useMemo, useState } from "react"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { useDelegators, useOperatorMetadatas, useOperatorWithSharesAndBaseApy } from "@/hooks"

import { OperatorBreadcrumbs } from "./_components/operator-breadcrumbs"
import { OperatorHistorySection } from "./_components/operator-history-section"
import { OperatorSidebar } from "./_components/operator-sidebar"
import {
  OperatorTabLabel,
  OperatorTabToolbar,
} from "./_components/operator-tab-toolbar"

const OperatorDelegators = lazy(() =>
  import("./delegators").then((m) => ({ default: m.OperatorDelegators }))
)
const OperatorDelegations = lazy(() =>
  import("./delegations").then((m) => ({ default: m.OperatorDelegations }))
)
const OperatorTransactions = lazy(() =>
  import("./transactions").then((m) => ({ default: m.OperatorTransactions }))
)

const tabs = [
  { label: "Delegators" as const, component: OperatorDelegators },
  { label: "Delegations" as const, component: OperatorDelegations },
  { label: "Transactions" as const, component: OperatorTransactions },
]

export function Operator({
  id,
  defaultTab,
}: {
  id: string
  defaultTab?: string
}) {
  const operatorMetadatas = useOperatorMetadatas()
  const operatorMetadata = operatorMetadatas.data?.[id]

  const operator = useOperatorWithSharesAndBaseApy({ id })

  const { data: delegatorsMeta } = useDelegators({
    pageIndex: 0,
    operatorId: id,
  })

  const [tab, setTab] = useState<OperatorTabLabel>(
    tabs.find((t) => t.label === defaultTab)?.label || tabs[0].label
  )
  const [searchQuery, setSearchQuery] = useState("")

  const TabComponent = useMemo(() => {
    return tabs.find((t) => t.label === tab)!.component
  }, [tab])

  const operatorMeta = {
    id,
    name: operator?.name ?? "",
    imageUrl: operatorMetadata?.imageUrl ?? "",
    description: operatorMetadata?.description ?? "",
    projectUrl: operatorMetadata?.projectUrl ?? "",
  }

  return (
    <div className="flex flex-col gap-3">
      <OperatorBreadcrumbs operatorName={operator?.name} />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
        <OperatorSidebar
          id={id}
          operator={operator ?? undefined}
          imageUrl={operatorMetadata?.imageUrl}
          name={operator?.name}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <OperatorHistorySection operatorId={id} />

          <OperatorTabToolbar
            operatorId={id}
            tab={tab}
            onTabChange={(value) => {
              setTab(value)
              setSearchQuery("")
            }}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            delegatorTotal={delegatorsMeta?.total}
          />

          <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
            <TabComponent operator={operatorMeta} searchQuery={searchQuery} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
