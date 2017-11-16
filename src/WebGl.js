export default class WebGl {
  constructor () {
    this.canvas = null
    this.webGl = null
    try {
      this.initGl()
      console.info('SUCCESS: webGl initialized!')
      // console.log(this.webGl)
      this.drawTriangle()
      // this.initShaders();
    } catch (error) {
      console.error(error)
    }
  }
  initGl () {
    this.canvas = document.getElementById('glcanvas')
    this.webGl = this.canvas.getContext('webgl', { antialias: false, stencil: true })
    this.webGl.clearColor(0.9, 0.9, 0.8, 1)
    this.webGl.clear(this.webGl.COLOR_BUFFER_BIT)
  }
  // drawCube () {
  //
  // }
  drawTriangle () {
    /* Step1: Prepare the canvas and get WebGL context */

    let canvas = this.canvas
    let gl = this.webGl

    let vertices = [
      -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1,
      -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1,
      -1, -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1,
      1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1,
      -1, -1, -1, -1, -1, 1, 1, -1, 1, 1, -1, -1,
      -1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, -1
    ]

    let colors = [
      5, 3, 7, 5, 3, 7, 5, 3, 7, 5, 3, 7,
      1, 1, 3, 1, 1, 3, 1, 1, 3, 1, 1, 3,
      0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1,
      1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
      1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0,
      0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0
    ]

    let indices = [
      0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7,
      8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15,
      16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23
    ]

    // Create and store data into vertex buffer
    let vertexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)

    // Create and store data into color buffer
    let colorBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW)

    // Create and store data into index buffer
    let indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)

    /* =================== SHADERS =================== */

    let vertCode = 'attribute vec3 position;' +
          'uniform mat4 Pmatrix;' +
          'uniform mat4 Vmatrix;' +
          'uniform mat4 Mmatrix;' +
          'attribute vec3 color;' +// the color of the point
          'varying vec3 vColor;' +
          'void main(void) { ' +// pre-built function
          'gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);' +
          'vColor = color;' +
          '}'

    let fragCode = 'precision mediump float;' +
          'varying vec3 vColor;' +
          'void main(void) {' +
          'gl_FragColor = vec4(vColor, 1.);' +
          '}'

    let vertShader = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vertShader, vertCode)
    gl.compileShader(vertShader)

    let fragShader = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(fragShader, fragCode)
    gl.compileShader(fragShader)

    let shaderprogram = gl.createProgram()
    gl.attachShader(shaderprogram, vertShader)
    gl.attachShader(shaderprogram, fragShader)
    gl.linkProgram(shaderprogram)

    /* ======== Associating attributes to vertex shader ===== */
    let _Pmatrix = gl.getUniformLocation(shaderprogram, 'Pmatrix')
    let _Vmatrix = gl.getUniformLocation(shaderprogram, 'Vmatrix')
    let _Mmatrix = gl.getUniformLocation(shaderprogram, 'Mmatrix')

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    let _position = gl.getAttribLocation(shaderprogram, 'position')
    gl.vertexAttribPointer(_position, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(_position)

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
    let _color = gl.getAttribLocation(shaderprogram, 'color')
    gl.vertexAttribPointer(_color, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(_color)
    gl.useProgram(shaderprogram)

    /* ==================== MATRIX ====================== */

    function getProjection (angle, a, zMin, zMax) {
      let ang = Math.tan((angle * 0.5) * Math.PI / 180)// angle*.5
      return [
        0.5 / ang, 0, 0, 0,
        0, 0.5 * a / ang, 0, 0,
        0, 0, -(zMax + zMin) / (zMax - zMin), -1,
        0, 0, (-2 * zMax * zMin) / (zMax - zMin), 0
      ]
    }

    let projMatrix = getProjection(40, canvas.width / canvas.height, 1, 100)
    let moMatrix = [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ]
    let viewMatrix = [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ]

    viewMatrix[14] = viewMatrix[14] - 6

    /* ================= Mouse events ====================== */

    let AMORTIZATION = 0.95
    let drag = false
    let oldX, oldY
    let dX = 0
    let dY = 0

    let mouseDown = function (e) {
      drag = true
      oldX = e.pageX
      oldY = e.pageY
      e.preventDefault()
      return false
    }

    let mouseUp = function () {
      drag = false
    }

    let mouseMove = function (e) {
      if (!drag) return false
      dX = (e.pageX - oldX) * 2 * Math.PI / canvas.width
      dY = (e.pageY - oldY) * 2 * Math.PI / canvas.height
      THETA += dX
      PHI += dY
      oldX = e.pageX
      oldY = e.pageY
      e.preventDefault()
    }

    canvas.addEventListener('mousedown', mouseDown, false)
    canvas.addEventListener('mouseup', mouseUp, false)
    canvas.addEventListener('mouseout', mouseUp, false)
    canvas.addEventListener('mousemove', mouseMove, false)

    /* =========================rotation================ */

    function rotateX (m, angle) {
      let c = Math.cos(angle)
      let s = Math.sin(angle)
      let mv1 = m[1]
      let mv5 = m[5]
      let mv9 = m[9]

      m[1] = m[1] * c - m[2] * s
      m[5] = m[5] * c - m[6] * s
      m[9] = m[9] * c - m[10] * s

      m[2] = m[2] * c + mv1 * s
      m[6] = m[6] * c + mv5 * s
      m[10] = m[10] * c + mv9 * s
    }

    function rotateY (m, angle) {
      let c = Math.cos(angle)
      let s = Math.sin(angle)
      let mv0 = m[0]
      let mv4 = m[4]
      let mv8 = m[8]

      m[0] = c * m[0] + s * m[2]
      m[4] = c * m[4] + s * m[6]
      m[8] = c * m[8] + s * m[10]

      m[2] = c * m[2] - s * mv0
      m[6] = c * m[6] - s * mv4
      m[10] = c * m[10] - s * mv8
    }

    /* =================== Drawing =================== */

    let THETA = 0
    let PHI = 0
    // let timeOld = 0

    let animate = function (time) {
      // let dt = time - timeOld

      if (!drag) {
        dX *= AMORTIZATION
        dY *= AMORTIZATION
        THETA += dX
        PHI += dY
      }

      // set model matrix to I4

      moMatrix[0] = 1
      moMatrix[1] = 0
      moMatrix[2] = 0
      moMatrix[3] = 0

      moMatrix[4] = 0
      moMatrix[5] = 1
      moMatrix[6] = 0
      moMatrix[7] = 0

      moMatrix[8] = 0
      moMatrix[9] = 0
      moMatrix[10] = 1
      moMatrix[11] = 0

      moMatrix[12] = 0
      moMatrix[13] = 0
      moMatrix[14] = 0
      moMatrix[15] = 1

      rotateY(moMatrix, THETA)
      rotateX(moMatrix, PHI)

      // timeOld = time
      gl.enable(gl.DEPTH_TEST)

      // gl.depthFunc(gl.LEQUAL);

      gl.clearColor(0.5, 0.5, 0.5, 0.9)
      gl.clearDepth(1.0)
      gl.viewport(0.0, 0.0, canvas.width, canvas.height)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

      gl.uniformMatrix4fv(_Pmatrix, false, projMatrix)
      gl.uniformMatrix4fv(_Vmatrix, false, viewMatrix)
      gl.uniformMatrix4fv(_Mmatrix, false, moMatrix)

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0)

      window.requestAnimationFrame(animate)
    }

    animate(0)
  }
}
