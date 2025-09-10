"use client"

import { MinimalOperatorWithMetadata } from "@/types/operator"

export function Operator({
  operator,
}: {
  operator: MinimalOperatorWithMetadata
}) {
  return <div>Operator {operator.name}</div>
}
