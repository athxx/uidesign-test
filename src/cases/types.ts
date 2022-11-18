import {
  MastergoDriver,
  JsDesignerDriver,
  FigmaDriver,
  PixsoDriver,
} from '../drivers/index'

export type DriverMap = Partial<{
  mastergo: MastergoDriver
  jsDesigner: JsDesignerDriver
  figma: FigmaDriver
  pixso: PixsoDriver
}>
