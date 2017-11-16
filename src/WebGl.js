import Triangle from './Triangle'
// import mat4 from 'gl-matrix'
import Square from './Square'
export default class WebGl {
  constructor () {
    this.canvas = null
    this.webGl = null
    this.shaderProgram = null
    console.log(mat4)
    this.mvMatrix = mat4.create()
    this.pMatrix = mat4.create()
    try {
      this.initGl()
      this.initShaders()
      // this.initBuffers()
      this.webGl.enable(this.webGl.DEPTH_TEST)
      this.drawScene()
      console.info('SUCCESS: webGl initialized!')
    } catch (error) {
      console.error(error)
    }
  }
  initGl () {
    this.canvas = document.getElementById('glcanvas')
    this.webGl = this.canvas.getContext('webgl', { antialias: false, stencil: true })
    this.webGl.clearColor(0.0, 0.0, 0.0, 0.9)
    this.webGl.clear(this.webGl.COLOR_BUFFER_BIT)
    this.webGl.viewportWidth = this.canvas.width
    this.webGl.viewportHeigth = this.canvas.height
  }
  drawScene () {
    this.webGl.viewport(0, 0, this.webGl.viewportWidth, this.webGl.viewportHeigth)
    this.webGl.clear(this.webGl.COLOR_BUFFER_BIT | this.webGl.DEPTH_BUFFER_BIT)

    mat4.perspective(90, this.webGl.viewportWidth / this.webGl.viewportHeigth, 0.1, 100.0, this.pMatrix)
    mat4.identity(this.mvMatrix)
    mat4.translate(this.mvMatrix, [-1.5, 0.0, -7.0])

    let triangle = new Triangle(this.webGl)
    this.bindAndDrawArray('TRIANGLES', triangle.getPositionBuffer())
    // this.webGl.drawArrays(this.webGl.TRIANGLES, 0, triangle.getPositionBuffer().numItems)
    mat4.translate(this.mvMatrix, [3.0, 0.0, 0.0])

    let square = new Square(this.webGl)
    this.bindAndDrawArray('TRIANGLE_STRIP', square.getPositionBuffer())
  }
  bindAndDrawArray (arrayType, vertexPositionBuffer) {
    this.webGl.bindBuffer(this.webGl.ARRAY_BUFFER, vertexPositionBuffer)
    this.webGl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, this.webGl.FLOAT, false, 0, 0)
    this.setMatrixUniform()
    this.webGl.drawArrays(this.webGl[arrayType], 0, vertexPositionBuffer.numItems)
  }
  setMatrixUniform () {
    this.webGl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, this.pMatrix)
    this.webGl.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform, false, this.mvMatrix)
  }
  getShader (gl, id) {
    let shaderScript = document.getElementById(id)
    let shader = null

    if (shaderScript) {
      let str = ''
      let k = shaderScript.firstChild
      while (k) {
        if (k.nodeType === 3) {
          str += k.textContent
        }
        k = k.nextSibling
      }

      if (shaderScript.type === 'x-shader/x-fragment') {
        shader = gl.createShader(gl.FRAGMENT_SHADER)
      } else if (shaderScript.type === 'x-shader/x-vertex') {
        shader = gl.createShader(gl.VERTEX_SHADER)
      }

      if (shader !== null) {
        gl.shaderSource(shader, str)
        gl.compileShader(shader)
      }
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        shader = null
        throw new Error(gl.getShaderInfoLog(shader))
      }
    }

    return shader
  }

  initShaders () {
    let fragmentShader = this.getShader(this.webGl, 'shader-fs')
    let vertexShader = this.getShader(this.webGl, 'shader-vs')
    // let shaderProgram = this.shaderProgram

    this.shaderProgram = this.webGl.createProgram()
    this.webGl.attachShader(this.shaderProgram, vertexShader)
    this.webGl.attachShader(this.shaderProgram, fragmentShader)
    this.webGl.linkProgram(this.shaderProgram)

    if (!this.webGl.getProgramParameter(this.shaderProgram, this.webGl.LINK_STATUS)) {
      throw new Error('could not initialize shaders')
    }

    this.webGl.useProgram(this.shaderProgram)

    this.shaderProgram.vertexPositionAttribute = this.webGl.getAttribLocation(this.shaderProgram, 'aVertexPosition')
    this.webGl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute)

    this.shaderProgram.pMatrixUniform = this.webGl.getUniformLocation(this.shaderProgram, 'uPMatrix')
    this.shaderProgram.mvMatrixUniform = this.webGl.getUniformLocation(this.shaderProgram, 'uMVMatrix')
  }
}
