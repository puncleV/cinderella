export default class Polygon {
  constructor (webGl) {
    this.webGl = webGl
    this.positionBuffer = webGl.createBuffer()
    webGl.bindBuffer(webGl.ARRAY_BUFFER, this.positionBuffer)
  }
  bufferData () {
    this.webGl.bufferData(this.webGl.ARRAY_BUFFER, new Float32Array(this.vertices), this.webGl.STATIC_DRAW)
  }
  getPositionBuffer () {
    return this.positionBuffer
  }
}
