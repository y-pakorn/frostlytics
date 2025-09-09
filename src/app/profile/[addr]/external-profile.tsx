"use client"

import { use } from "react"

import { Profile } from "../profile"

export function ExternalProfile({
  params,
}: {
  params: Promise<{ addr: string }>
}) {
  const { addr } = use(params)

  return <Profile address={addr} readOnly />
}
