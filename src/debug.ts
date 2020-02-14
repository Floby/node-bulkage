import Debug from 'debug'
import prettyFormat from 'pretty-format'

export const debug = Debug('bulkage')
export const trace = Debug('bulkage:trace')

export function formatArgList (argList: any[]): string {
  return argList.map((arg) => {
    return prettyFormat(arg, {
      min: true,
      highlight: true,
      maxDepth: 2
    })
  }).join(', ')
}

