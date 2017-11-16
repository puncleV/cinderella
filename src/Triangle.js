import Polygon from './Polygon'
const defaultVertices = [
  0.0, 1.0, 0.0,
  -1.0, -1.0, 0.0,
  1.0, -1.0, 0.0
]
export default class Triangle extends Polygon {
  constructor (webGl, vertices) {
    super(webGl, vertices || defaultVertices)
    this.positionBuffer.itemSize = 3
    this.positionBuffer.numItems = 3
  }
}
