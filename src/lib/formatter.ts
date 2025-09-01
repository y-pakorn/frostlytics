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
  numberReadable: (v?: any, mantissa = 2) =>
    numbro(v).format({
      mantissa,
      average: true,
      lowPrecision: false,
      thousandSeparated: true,
    }),
  percentage: (v?: any, { mantissa = 2, percent = true } = {}) =>
    numbro(v * 100).format({
      mantissa,
      thousandSeparated: true,
      trimMantissa: true,
      optionalMantissa: true,
      postfix: percent ? "%" : "",
    }),
}
