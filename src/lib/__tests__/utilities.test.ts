import { expect, test } from "vitest"
import { convertToBigInt, formatBigIntWithDecimals } from "../utilities"

test.each([
  // Simple Algo conversions
  ["1", 6, 1000000n],
  ["1.", 6, 1000000n],
  ["1.0", 6, 1000000n],
  ["1.00", 6, 1000000n],
  ["1.000", 6, 1000000n],
  ["1.0000", 6, 1000000n],
  ["1.00000", 6, 1000000n],
  ["1.000000", 6, 1000000n],
  // Max uint64 variants
  ["18446744073709551615", 0, 18446744073709551615n],
  ["18446744073709551615.", 0, 18446744073709551615n],
  ["18446744073709551615.0", 0, Error("Too many decimal places")],
  ["1844674407370955161.5", 1, 18446744073709551615n],
  ["184467440737095516.15", 2, 18446744073709551615n],
  ["18446744073709551.615", 3, 18446744073709551615n],
  ["1844674407370955.1615", 4, 18446744073709551615n],
  ["184467440737095.51615", 5, 18446744073709551615n],
  ["18446744073709.551615", 6, 18446744073709551615n],
  ["1844674407370.9551615", 7, 18446744073709551615n],
  ["184467440737.09551615", 8, 18446744073709551615n],
  ["18446744073.709551615", 9, 18446744073709551615n],
  // Bad quantity input
  [null, 6, Error("Quantity must be a string or a number")],
  [undefined, 6, Error("Quantity must be a string or a number")],
  // Bad decimals input
  ["1.000000", -1, Error("Decimals must be a non-negative integer")],
  ["1.000000", 0.5, Error("Decimals must be a non-negative integer")],
  ["1.000000", null, Error("Decimals must be a non-negative integer")],
  ["1.000000", undefined, Error("Decimals must be a non-negative integer")],
])("Str-BigInt(%s, %d) -> %s", (input, decimals, output) => {
  try {
    const resultingBigInt = convertToBigInt(input, decimals)
    expect(resultingBigInt).toBe(output)
  } catch (e) {
    expect(e).toEqual(output)
  }
})

test.each([
  // Simple cases
  [1000000n, 6, "1"],
  [1000000n, 3, "1000"],
  [1000001n, 3, "1000.001"],
  [1000100n, 3, "1000.1"],
  [1000000n, 0, "1000000"],
  [1000000000000000000n, 18, "1"],
  [1234567890123456789n, 18, "1.234567890123456789"],
  // Max uint64
  [18446744073709551615n, 1, "1844674407370955161.5"],
  [18446744073709551615n, 2, "184467440737095516.15"],
  [18446744073709551615n, 3, "18446744073709551.615"],
  [18446744073709551615n, 4, "1844674407370955.1615"],
  [18446744073709551615n, 5, "184467440737095.51615"],
  [18446744073709551615n, 6, "18446744073709.551615"],
  [18446744073709551615n, 7, "1844674407370.9551615"],
  [18446744073709551615n, 8, "184467440737.09551615"],
  [18446744073709551615n, 9, "18446744073.709551615"],
  // Leading zeros
  [1n, 6, "0.000001"],
  [100000n, 6, "0.1"],
  [123n, 6, "0.000123"],
  [123456n, 6, "0.123456"],
  // No decimal places
  [123456n, 0, "123456"],
  // Negative decimal places
  [1000000n, -1, Error("Decimal places must be a non-negative integer.")],
])("BigInt-Str(%s, %d) -> %s", (value, decimalPlaces, output) => {
  try {
    const formattedString = formatBigIntWithDecimals(value, decimalPlaces)
    expect(formattedString).toBe(output)
  } catch (e) {
    expect(e).toEqual(output)
  }
})
