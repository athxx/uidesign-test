import { urlStorage } from './url-handler'

export function getTestFile(name: string): {
  mastergo: string
  jsDesigner: string
  figma: string
  pixso: string
} {
  const data = urlStorage.get(name)

  return data
}
