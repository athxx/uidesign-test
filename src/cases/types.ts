import {
  SoulmaDriver,
  MastergoDriver,
  XiaopiuDriver,
  FigmaDriver,
  PixsoDriver,
} from '../drivers/index'

export type DriverMap = Partial<{
  soulma: SoulmaDriver
  mastergo: MastergoDriver
  xiaopiu: XiaopiuDriver
  figma: FigmaDriver
  pixso: PixsoDriver
  local: SoulmaDriver
}>
