import _ from "lodash"
import numbro from "numbro"

import { dayjs } from "./dayjs"

export const formatter = {
  number: (v?: any, mantissa = 2) =>
    numbro(v).format({
      mantissa,
      thousandSeparated: true,
      trimMantissa: true,
      optionalMantissa: true,
    }),
  numberReadable: (v?: any, mantissa = 2) =>
    numbro(v).format({
      mantissa,
      average: true,
      lowPrecision: false,
      thousandSeparated: true,
    }),
  percentage: (
    v?: any,
    { mantissa = 2, percent = true, forceSign = false } = {}
  ) =>
    numbro(v * 100).format({
      mantissa,
      thousandSeparated: true,
      trimMantissa: true,
      optionalMantissa: true,
      postfix: percent ? "%" : "",
      forceSign: forceSign,
    }),
  date: (v?: any) => dayjs(v).format("DD MMM YYYY hh:mm A"),
  duration: (v?: any) => dayjs.duration(v).format("Y[Y] M[M] D[D]"),
}
