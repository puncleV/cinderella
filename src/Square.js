import Polygon from './Polygon'
const defaultVertices = [
  1.0, 1.0, 0.0,
  -1.0, 1.0, 0.0,
  1.0, -1.0, 0.0,
  -1.0, -1.0, 0.0
]
export default class Square extends Polygon {
  constructor (webGl, vertices) {
    super(webGl, vertices || defaultVertices)
    this.positionBuffer.itemSize = 3
    this.positionBuffer.numItems = 4
  }
}
