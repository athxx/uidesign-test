import { Mouse } from 'puppeteer'

interface Point {
  x: number
  y: number
}

export async function mousemoveInRetanglePath(
  mouse: Mouse,
  options: {
    start: Point
    steps: number
    delta: number
  }
) {
  const { start: startPoint, steps, delta } = options
  let x = startPoint.x
  let y = startPoint.y

  await mouse.move(x, y)
  await mouse.down()

  // to topLeft
  for (let i = 0; i < steps; i++) {
    x -= delta
    y -= delta
    await mouse.move(x, y)
  }

  // to topRight
  for (let i = 0; i < steps; i++) {
    x += delta
    await mouse.move(x, y)
  }

  // to bottomRight
  for (let i = 0; i < steps; i++) {
    y += delta
    await mouse.move(x, y)
  }

  // to bottomLeft
  for (let i = 0; i < steps; i++) {
    x -= delta
    await mouse.move(x, y)
  }

  // to topLeft
  for (let i = 0; i < steps; i++) {
    y -= delta
    await mouse.move(x, y)
  }

  // to origin
  for (let i = 0; i < steps; i++) {
    x += delta
    y += delta
    await mouse.move(x, y)
  }

  await mouse.up()
}

export async function mousemoveInDiagonalPath(
  mouse: Mouse,
  options: {
    start: Point
    end: Point
    delta: number
  }
) {
  const { start: startPoint, delta, end: endPoint } = options
  let x = startPoint.x
  let y = startPoint.y
  const dx = endPoint.x - x
  const dy = endPoint.y - y
  const xSteps = dx / delta
  const ySteps = dy / delta
  const steps = Math.min(xSteps, ySteps)
  const deltaX = dx / steps
  const deltaY = dy / steps

  await mouse.move(x, y)
  await mouse.down()

  for (let i = 0; i < steps; i++) {
    x += deltaX
    y += deltaY
    await mouse.move(x, y)
  }

  await mouse.up()
}

export async function mouseWheelZoom(mouse: Mouse, deltas?: number[]) {
  if (deltas?.length) {
    for (let i = 0, l = deltas.length; i < l; i++) {
      await mouse.wheel({ deltaY: deltas[i] })
    }

    return
  }

  for (let i = 0, l = 20; i < l; i++) {
    await mouse.wheel({ deltaY: -i * 10 - 1 })
  }

  for (let i = 0, l = 20; i < l; i++) {
    await mouse.wheel({ deltaY: i * 10 + 1 })
  }
}
