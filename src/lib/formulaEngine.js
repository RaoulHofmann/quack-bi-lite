import * as formulajs from '@formulajs/formulajs'

const FORMULA_RE = /^=/
const CELL_REF_RE = /\b([A-Z]+)(\d+)\b/g
const RANGE_REF_RE = /([A-Z]+)(\d+):([A-Z]+)(\d+)/g

export function isFormula(value) {
  return typeof value === 'string' && FORMULA_RE.test(value)
}

export function parseFormula(value) {
  if (!isFormula(value)) return null
  return value.substring(1).trim()
}

export function resolveCellRef(ref, data) {
  const match = ref.match(/^([A-Z]+)(\d+)$/)
  if (!match) return null
  const col = colIndex(match[1])
  const row = parseInt(match[2], 10) - 1
  if (row < 0 || col < 0) return null
  if (!data || !data[row]) return null
  return data[row][col]
}

function colIndex(letters) {
  let result = 0
  for (let i = 0; i < letters.length; i++) {
    result = result * 26 + (letters.charCodeAt(i) - 64)
  }
  return result - 1
}

function colLetter(n) {
  let s = ''
  n = Math.floor(n)
  while (n >= 0) { s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26) - 1 }
  return s
}

export function resolveRange(ref, data) {
  const match = ref.match(RANGE_REF_RE)
  if (!match) return null
  const col1 = colIndex(RegExp.$1)
  const row1 = parseInt(RegExp.$2, 10) - 1
  const col2 = colIndex(RegExp.$3)
  const row2 = parseInt(RegExp.$4, 10) - 1
  const values = []
  for (let r = row1; r <= row2; r++) {
    for (let c = col1; c <= col2; c++) {
      if (data && data[r] && data[r][c] != null) {
        const v = data[r][c]
        const num = Number(v)
        values.push(isNaN(num) ? v : num)
      }
    }
  }
  return values.length ? values : null
}

export function resolveRange2D(ref, data) {
  const match = ref.match(RANGE_REF_RE)
  if (!match) return null
  const col1 = colIndex(RegExp.$1)
  const row1 = parseInt(RegExp.$2, 10) - 1
  const col2 = colIndex(RegExp.$3)
  const row2 = parseInt(RegExp.$4, 10) - 1
  const result = []
  for (let r = row1; r <= row2; r++) {
    const row = []
    for (let c = col1; c <= col2; c++) {
      row.push(data && data[r] ? data[r][c] : '')
    }
    result.push(row)
  }
  return result
}

export function replaceCellRefs(expression, data) {
  if (!expression) return expression
  return expression.replace(CELL_REF_RE, (match, col, row) => {
    const val = resolveCellRef(match, data)
    return val != null ? val : 0
  })
}

export function evaluateFormula(formula, data) {
  const expr = parseFormula(formula)
  if (!expr) return formula

  const resolved = replaceCellRefs(expr, data)

  try {
    const fnMatch = resolved.match(/^([A-Z]+)\((.+)\)$/i)
    if (fnMatch) {
      const fnName = fnMatch[1].toUpperCase()
      const argsStr = fnMatch[2]
      const args = parseArgs(argsStr, data)

      if (typeof formulajs[fnName] === 'function') {
        const result = formulajs[fnName](...args)
        return formatResult(result)
      }
    }
    const evalResult = safeEval(resolved, data)
    return formatResult(evalResult)
  } catch {
    return formula
  }
}

function parseArgs(argsStr, data) {
  const args = []
  let depth = 0
  let current = ''
  for (const ch of argsStr) {
    if (ch === '(') depth++
    else if (ch === ')') depth--
    if (ch === ',' && depth === 0) {
      args.push(parseArg(current.trim(), data))
      current = ''
    } else {
      current += ch
    }
  }
  if (current.trim()) args.push(parseArg(current.trim(), data))
  return args
}

function parseArg(arg, data) {
  if (RANGE_REF_RE.test(arg)) {
    RANGE_REF_RE.lastIndex = 0
    return resolveRange(arg, data) || arg
  }
  if (CELL_REF_RE.test(arg)) {
    CELL_REF_RE.lastIndex = 0
    const val = resolveCellRef(arg, data)
    return val != null ? val : arg
  }
  const num = Number(arg)
  if (!isNaN(num)) return num
  const str = arg.replace(/^"(.*)"$/, '$1')
  return str
}

function safeEval(expression) {
  try {
    return new Function('return (' + expression + ')')()
  } catch {
    return expression
  }
}

function formatResult(result) {
  if (result == null) return ''
  if (typeof result === 'number') {
    if (Number.isInteger(result)) return result
    return Math.round(result * 100) / 100
  }
  if (result instanceof Date) return result.toISOString().split('T')[0]
  return String(result)
}

export function formulaToExcel(formula, sheetName) {
  if (!isFormula(formula)) return formula
  const expr = formula.substring(1)
  const converted = expr.replace(RANGE_REF_RE, (match, c1, r1, c2, r2) => {
    const sheet = sheetName ? `'${sheetName}'!` : ''
    return `${sheet}${c1}${r1}:${c2}${r2}`
  })
  return '=' + converted
}

export { formulajs }
