import _ from "lodash"
import numbro from "numbro"

export const formatter = {
  number: (v?: any, mantissa = 2) =>
    numbro(v).format({
      mantissa,
      thousandSeparated: true,
      trimMantissa: true,
      optionalMantissa: true,
    }),
  percentage: (v?: any, mantissa = 2) =>
    numbro(v * 100).format({
      mantissa,
      thousandSeparated: true,
      trimMantissa: true,
      optionalMantissa: true,
    }) + "%",
}
