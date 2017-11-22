export default class Polygon {
  constructor (webGl, vertices, textureVertices) {
    this.webGl = webGl
    this.positionBuffer = this.webGl.createBuffer()
    this.webGl.bindBuffer(webGl.ARRAY_BUFFER, this.positionBuffer)
    this.webGl.bufferData(this.webGl.ARRAY_BUFFER, new Float32Array(vertices), this.webGl.STATIC_DRAW)

    this.textureCoordsBuffer = this.webGl.createBuffer()
    this.webGl.bindBuffer(this.webGl.ARRAY_BUFFER, this.textureCoordsBuffer)
    this.webGl.bufferData(this.webGl.ARRAY_BUFFER, new Float32Array(textureVertices), this.webGl.STATIC_DRAW)
    this.textureCoordsBuffer.itemSize = 2
    this.textureCoordsBuffer.numItems = 1
  }
  getPositionBuffer () {
    return this.positionBuffer
  }
  getTextureCoordsBuffer () {
    return this.textureCoordsBuffer
  }
}
