import Triangle from './Triangle'
// import mat4 from 'gl-matrix'
import Square from './Square'
export default class WebGl {
  constructor () {
    this.canvas = null
    this.webGl = null
    this.shaderProgram = null
    this.mvMatrix = mat4.create()
    this.pMatrix = mat4.create()
    this.mvMatrixStack = []

    try {
      this.initGl()
      this.initShaders()
      this.initTexture(() => {
        this.loadWorld((worldText) => {
          this.webGl.enable(this.webGl.DEPTH_TEST)
          this.drawScene(this.handleLoadedWorld(worldText))
          console.info('SUCCESS: webGl initialized!')
        })
      })
    } catch (error) {
      console.error(error)
    }
  }
  initGl () {
    this.canvas = document.getElementById('glcanvas')
    this.webGl = this.canvas.getContext('webgl', { antialias: false, stencil: true })
    this.webGl.clearColor(0.0, 0.0, 0.0, 1)
    this.webGl.clear(this.webGl.COLOR_BUFFER_BIT)
    this.webGl.viewportWidth = this.canvas.width
    this.webGl.viewportHeigth = this.canvas.height
  }
  degToRad (degrees) {
    return degrees * Math.PI / 180
  }
  drawScene (worldVertices) {
    this.webGl.viewport(0, 0, this.webGl.viewportWidth, this.webGl.viewportHeigth)
    this.webGl.clear(this.webGl.COLOR_BUFFER_BIT | this.webGl.DEPTH_BUFFER_BIT)

    mat4.perspective(45, this.webGl.viewportWidth / this.webGl.viewportHeigth, 0.1, 100.0, this.pMatrix)
    mat4.identity(this.mvMatrix)

    var pitch = 0
    var pitchRate = 0

    var yaw = 0
    var yawRate = 0

    var xPos = -0.5
    var yPos = 0.4
    var zPos = 2

    var speed = 0

    mat4.rotate(this.mvMatrix, this.degToRad(-pitch), [1, 0, 0])
    mat4.rotate(this.mvMatrix, this.degToRad(-yaw), [0, 1, 0])
    mat4.translate(this.mvMatrix, [-xPos, -yPos, -zPos])
    // mat4.translate(this.mvMatrix, [0.5, -0.5, -1.6])

    this.webGl.activeTexture(this.webGl.TEXTURE0)
    this.webGl.bindTexture(this.webGl.TEXTURE_2D, this.mainTexture)
    this.webGl.uniform1i(this.shaderProgram.samplerUniform, 0)
    worldVertices.forEach(triangleVertices => {
      let triangle = new Triangle(this.webGl, triangleVertices.vertices, triangleVertices.textureVertices)
      this.webGl.bindBuffer(this.webGl.ARRAY_BUFFER, triangle.getTextureCoordsBuffer())
      this.webGl.vertexAttribPointer(this.shaderProgram.textureCoordAttribute, triangle.getTextureCoordsBuffer().itemSize, this.webGl.FLOAT, false, 0, 0)
      this.bindAndDrawArray('TRIANGLES', triangle.getPositionBuffer())
    })
    //
    // gl.bindBuffer(gl.ARRAY_BUFFER, worldVertexPositionBuffer);
    // gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, worldVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    //
    // setMatrixUniforms();
    // gl.drawArrays(gl.TRIANGLES, 0, worldVertexPositionBuffer.numItems);

    // this.webGl.drawArrays(this.webGl.TRIANGLES, 0, triangle.getPositionBuffer().numItems)

    // mat4.translate(this.mvMatrix, [3.0, 0.0, 0.0])
    // let square = new Square(this.webGl)
    // this.bindAndDrawArray('TRIANGLE_STRIP', square.getPositionBuffer())
  }

  bindAndDrawArray (arrayType, vertexPositionBuffer) {
    this.webGl.bindBuffer(this.webGl.ARRAY_BUFFER, vertexPositionBuffer)
    this.webGl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, this.webGl.FLOAT, false, 0, 0)
    this.setMatrixUniform()
    this.webGl.drawArrays(this.webGl[arrayType], 0, vertexPositionBuffer.numItems)
  }

  handleLoadedWorld (worldText) {
    let normalizedTriangles = []
    let verticesBuf = []
    let textureVerticesBuf = []
    console.log(worldText.split('\n').filter(line => line.indexOf('//') === -1).map(line => line.split(/\s+/)))
    worldText.split('\n').filter(line => line.indexOf('//') === -1)
      .map(line => line.split(/\s+/).filter(value => value !== ""))
      .filter(line => line.length === 5)
      .forEach((line, i) => {
        console.log(line)
        if (i !== 0 && i % 3 === 0) {
          normalizedTriangles.push({
            vertices: verticesBuf,
            textureVertices: textureVerticesBuf
          })
          verticesBuf = []
          textureVerticesBuf = []
        }
        verticesBuf = verticesBuf.concat(line.splice(0, 3))
        textureVerticesBuf = textureVerticesBuf.concat(line)
      })
    return normalizedTriangles
  }

  initTexture (callback) {
    this.mainTexture = this.webGl.createTexture()
    this.mainTexture.image = new Image()
    this.mainTexture.image.onload = () => {
      this.handleLoadedTexture(this.mainTexture)
      callback()
    }

    this.mainTexture.image.src = 'mud.gif'
  }

  handleLoadedTexture (texture) {
    this.webGl.pixelStorei(this.webGl.UNPACK_FLIP_Y_WEBGL, true)
    this.webGl.bindTexture(this.webGl.TEXTURE_2D, texture)
    this.webGl.texImage2D(this.webGl.TEXTURE_2D, 0, this.webGl.RGBA, this.webGl.RGBA, this.webGl.UNSIGNED_BYTE, texture.image)
    this.webGl.texParameteri(this.webGl.TEXTURE_2D, this.webGl.TEXTURE_MAG_FILTER, this.webGl.LINEAR)
    this.webGl.texParameteri(this.webGl.TEXTURE_2D, this.webGl.TEXTURE_MIN_FILTER, this.webGl.LINEAR)

    this.webGl.bindTexture(this.webGl.TEXTURE_2D, null)
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

  loadWorld (callback) {
    let request = new XMLHttpRequest()
    request.open('GET', 'world.txt')
    request.onreadystatechange = function () {
      if (request.readyState === 4) {
        // handleLoadedWorld(request.responseText)
        callback(request.responseText)
      }
    }
    request.send()
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

    this.shaderProgram.textureCoordAttribute = this.webGl.getAttribLocation(this.shaderProgram, 'aTextureCoord')
    this.webGl.enableVertexAttribArray(this.shaderProgram.textureCoordAttribute)

    this.shaderProgram.pMatrixUniform = this.webGl.getUniformLocation(this.shaderProgram, 'uPMatrix')
    this.shaderProgram.mvMatrixUniform = this.webGl.getUniformLocation(this.shaderProgram, 'uMVMatrix')
    this.shaderProgram.samplerUniform = this.webGl.getUniformLocation(this.shaderProgram, 'uSampler')
  }
  tick () {
    this.requestAnimFrame(tick)
    this.handleKeys()
    this.drawScene()
    this.animate()
  }
}
