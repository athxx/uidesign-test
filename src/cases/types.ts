import {SoulmaDriver, MastergoDriver} from '../drivers/index'

export type DriverMap = Partial<{
  soulma: SoulmaDriver,
  mastergo: MastergoDriver
}>
