import { urlStorage } from './url-handler'

export function getTestFile(name: string): {
  soulma: string
  mastergo: string
  xiaopiu: string
  figma: string
  pixso: string
} {
  const data = urlStorage.get(name)

  return data
}
