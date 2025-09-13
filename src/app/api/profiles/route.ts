import { NextResponse } from "next/server"
import _ from "lodash"

import { getOperatorProfileCached } from "@/services"

export const revalidate = 86400 // 24 hours
export const dynamic = "force-static"

export async function GET() {
  try {
    const operators = await getOperatorProfileCached()
    return NextResponse.json({
      total: operators.length,
      operators,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: (error as Error).message,
      },
      {
        status: 500,
      }
    )
  }
}
