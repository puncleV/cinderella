import Polygon from './Polygon'
const defaultVertices = [
  0.0, 1.0, 0.0,
  -1.0, -1.0, 0.0,
  1.0, -1.0, 0.0
]
const defaultTextureVertices = [
  0, 1, 0, 0, 1, 0
]
export default class Triangle extends Polygon {
  constructor (webGl, vertices, textureVertices) {
    super(webGl, vertices || defaultVertices, textureVertices || defaultTextureVertices)
    this.positionBuffer.itemSize = 3
    this.positionBuffer.numItems = 3
  }
}
