export default class Polygon {
  constructor (webGl, vertices) {
    this.webGl = webGl
    this.positionBuffer = webGl.createBuffer()
    this.webGl.bindBuffer(webGl.ARRAY_BUFFER, this.positionBuffer)
    this.webGl.bufferData(this.webGl.ARRAY_BUFFER, new Float32Array(vertices), this.webGl.STATIC_DRAW)
  }
  bufferData () {
  }
  getPositionBuffer () {
    return this.positionBuffer
  }
}
