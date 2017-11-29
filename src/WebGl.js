import Triangle from './Triangle'
// import mat4 from 'gl-matrix'
import Square from './Square'

const objects = ['maze', '228']
export default class WebGl {
  constructor () {
    this.canvas = null
    this.webGl = null
    this.shaderProgram = null
    // this.mvMatrix = mat4.create()
    this.pMatrix = mat4.create()
    this.worldVertices = []
    this.displayedObjects = {}
    this.walls = {
      x: [],
      z: []
    }

    this.currentlyPressedKeys = {}
    this.pitch = 0
    this.pitchRate = 0
    this.yaw = 90
    this.yawRate = 0
    this.xPos = 4.7
    this.yPos = 0.4
    this.zPos = 2.43
    this.speed = 0
    this.lastTime = 0
    this.joggingAngle = 0

    try {
      this.initGl()
      this.initShaders()
      this.webGl.enable(this.webGl.DEPTH_TEST)
      console.info('SUCCESS: webGl initialized!')
      this.initWorld()
    } catch (error) {
      console.error(error)
    }
  }
  async initWorld () {
    await this.initTexture()
    let allVertices = []

    for (let objectName of objects) {
      const objectText = await this.loadObject(objectName)
      const objectVertices = this.objectTextToVertices(objectText)
      this.displayedObjects[objectName] = {
        mvMatrix: mat4.create(),
        vertices: objectVertices
      }
      allVertices = allVertices.concat(objectVertices)
    }

    this.getWalls(allVertices)
    this.tick()
  }
  initGl () {
    this.canvas = document.getElementById('glcanvas')
    this.webGl = this.canvas.getContext('webgl', { antialias: false, stencil: true })
    this.webGl.clearColor(0.0, 0.0, 0.0, 1)
    this.webGl.clear(this.webGl.COLOR_BUFFER_BIT)
    this.webGl.viewportWidth = this.canvas.width
    this.webGl.viewportHeigth = this.canvas.height
    document.onkeydown = this.handleKeyDown.bind(this)
    document.onkeyup = this.handleKeyUp.bind(this)
  }

  degToRad (degrees) {
    return degrees * Math.PI / 180
  }

  drawScene () {
    this.webGl.viewport(0, 0, this.webGl.viewportWidth, this.webGl.viewportHeigth)
    this.webGl.clear(this.webGl.COLOR_BUFFER_BIT | this.webGl.DEPTH_BUFFER_BIT)

    mat4.perspective(90, this.webGl.viewportWidth / this.webGl.viewportHeigth, 0.1, 100.0, this.pMatrix)

    for (let objectName in this.displayedObjects) {
      this.drawSomeBitch(this.displayedObjects[objectName])
    }
  }
  // todo rename this bitch
  drawSomeBitch (bitch) {
    const mvMatrix = bitch.mvMatrix
    this.setMatrix(mvMatrix)

    this.webGl.activeTexture(this.webGl.TEXTURE0)
    this.webGl.bindTexture(this.webGl.TEXTURE_2D, this.mainTexture)
    this.webGl.uniform1i(this.shaderProgram.samplerUniform, 0)

    bitch.vertices.forEach(triangleVertices => {
      let triangle = new Triangle(this.webGl, triangleVertices.vertices, triangleVertices.textureVertices)
      this.webGl.bindBuffer(this.webGl.ARRAY_BUFFER, triangle.getTextureCoordsBuffer())
      this.webGl.vertexAttribPointer(this.shaderProgram.textureCoordAttribute, triangle.getTextureCoordsBuffer().itemSize, this.webGl.FLOAT, false, 0, 0)
      this.bindAndDrawArray('TRIANGLES', triangle.getPositionBuffer(), mvMatrix)
    })
  }

  setMatrix (matrix) {
    mat4.identity(matrix)
    mat4.rotate(matrix, this.degToRad(-this.pitch), [1, 0, 0])
    mat4.rotate(matrix, this.degToRad(-this.yaw), [0, 1, 0])
    mat4.translate(matrix, [-this.xPos, -this.yPos, -this.zPos])
  }

  bindAndDrawArray (arrayType, vertexPositionBuffer, mvMatrix) {
    this.webGl.bindBuffer(this.webGl.ARRAY_BUFFER, vertexPositionBuffer)
    this.webGl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, this.webGl.FLOAT, false, 0, 0)
    this.setMatrixUniform(mvMatrix)
    this.webGl.drawArrays(this.webGl[arrayType], 0, vertexPositionBuffer.numItems)
  }

  getWalls (worldVertices) {
    worldVertices.forEach( triangleVertices => {
      let verticesMap = {}
      let positionVertices = triangleVertices.vertices.slice()
      let normalizedTriangleVertices = []
      normalizedTriangleVertices.push(positionVertices.splice(0, 3))
      normalizedTriangleVertices.push(positionVertices.splice(0, 3))
      normalizedTriangleVertices.push(positionVertices)

      normalizedTriangleVertices.forEach(vertices => {
        if (verticesMap[vertices[1]]) {
          verticesMap[vertices[1]].push(vertices)
        } else {
          verticesMap[vertices[1]] = [vertices]
        }
      })

      for (let yPos in verticesMap) {
        if (verticesMap[yPos].length === 2) {
          let xWall = parseFloat(verticesMap[yPos][0][0]) - parseFloat(verticesMap[yPos][1][0])
          if (xWall) {
            this.walls.x.push((x, z) => {
              let x0 = parseFloat(verticesMap[yPos][0][0])
              let x1 = parseFloat(verticesMap[yPos][1][0])
              let z0 = parseFloat(verticesMap[yPos][0][2])
              let distance = Math.abs(z0 - z)

              if (x0 > x1) {
                distance = (x - 0.1 > x0 || x - 0.1 < x1) ? null : distance
              } else {
                distance = (x - 0.1 < x0 || x - 0.1 > x1) ? null : distance
              }

              return distance
            })
          } else {
            this.walls.z.push((x, z) => {
              let x0 = parseFloat(verticesMap[yPos][0][0])
              let z0 = parseFloat(verticesMap[yPos][0][2])
              let z1 = parseFloat(verticesMap[yPos][1][2])
              let distance = Math.abs(x0 - x)

              if (z0 > z1) {
                distance = (z - 0.1 > z0 || z - 0.1 < z1) ? null : distance
              } else {
                distance = (z - 0.1 < z0 || z - 0.1 > z1) ? null : distance
              }

              return distance
            })
          }

        }
      }
    })
  }

  animate () {
    const timeNow = new Date().getTime()
    if (this.lastTime !== 0) {
      const elapsed = timeNow - this.lastTime
      const newPitch = this.pitch + this.pitchRate * elapsed


      if (this.speed !== 0) {
        const dX = Math.sin(this.degToRad(this.yaw)) * this.speed * elapsed
        const dZ = Math.cos(this.degToRad(this.yaw)) * this.speed * elapsed
        const newX = this.xPos - dX
        const newZ = this.zPos - dZ

        let zCollision = this.walls.x.some(straightFn => straightFn(newX, newZ) !== null && straightFn(newX, newZ) < 0.2)
        let xCollision = this.walls.z.some(straightFn => straightFn(newX, newZ) !== null && straightFn(newX, newZ) < 0.2)
        if (!xCollision){
          this.xPos = newX
        }
        if (!zCollision) {
          this.zPos = newZ
        }
        this.joggingAngle += elapsed * 0.6
        this.yPos = Math.sin(this.degToRad(this.joggingAngle)) / 20 + 0.4
      }

      this.yaw += this.yawRate * elapsed

      this.pitch = Math.abs(newPitch) <= 90 ? newPitch : this.pitch
    }
    this.lastTime = timeNow
  }

  objectTextToVertices (objectText) {
    let normalizedTriangles = []
    let verticesBuf = []
    let textureVerticesBuf = []
    objectText.split('\n').filter(line => line.indexOf('//') === -1)
      .map(line => line.split(/\s+/).filter(value => value !== ''))
      .filter(line => line.length === 5)
      .forEach((line, i) => {
        if (i !== 0 && i % 3 === 0) {
          normalizedTriangles.push({
            vertices: verticesBuf,
            textureVertices: textureVerticesBuf
          })
          verticesBuf = []
          textureVerticesBuf = []
        }

        const vertices = line.splice(0, 3)
        verticesBuf = verticesBuf.concat(vertices)
        textureVerticesBuf = textureVerticesBuf.concat(line)
      })
    return normalizedTriangles
  }

  initTexture () {
    return new Promise(resolve => {
      this.mainTexture = this.webGl.createTexture()
      this.mainTexture.image = new Image()
      this.mainTexture.image.onload = () => {
        this.handleLoadedTexture(this.mainTexture)
        resolve()
      }
      this.mainTexture.image.src = 'mud.gif'
    })
  }

  handleLoadedTexture (texture) {
    this.webGl.pixelStorei(this.webGl.UNPACK_FLIP_Y_WEBGL, true)
    this.webGl.bindTexture(this.webGl.TEXTURE_2D, texture)
    this.webGl.texImage2D(this.webGl.TEXTURE_2D, 0, this.webGl.RGBA, this.webGl.RGBA, this.webGl.UNSIGNED_BYTE, texture.image)
    this.webGl.texParameteri(this.webGl.TEXTURE_2D, this.webGl.TEXTURE_MAG_FILTER, this.webGl.LINEAR)
    this.webGl.texParameteri(this.webGl.TEXTURE_2D, this.webGl.TEXTURE_MIN_FILTER, this.webGl.LINEAR)

    this.webGl.bindTexture(this.webGl.TEXTURE_2D, null)
  }

  setMatrixUniform (mvMatrix) {
    this.webGl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, this.pMatrix)
    this.webGl.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform, false, mvMatrix)
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

  loadObject (objectName) {
    return new Promise(resolve => {
      let request = new XMLHttpRequest()
      request.open('GET', `objects/${objectName}.txt`)
      request.onreadystatechange = function () {
        if (request.readyState === 4) {
          resolve(request.responseText)
        }
      }
      request.send()
    })
  }

  // loadObjects (callback) {
  //   let request = new XMLHttpRequest()
  //   request.open('GET', 'objects/maze.txt')
  //   request.onreadystatechange = function () {
  //     if (request.readyState === 4) {
  //       // handleLoadedWorld(request.responseText)
  //       callback(request.responseText)
  //     }
  //   }
  //   request.send()
  // }

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
    requestAnimFrame(this.tick.bind(this))
    this.handleKeys()
    this.drawScene()
    this.animate()
  }
  handleKeyDown (event) {
    this.currentlyPressedKeys[event.keyCode] = true
  }

  handleKeyUp (event) {
    this.currentlyPressedKeys[event.keyCode] = false
  }

  handleKeys () {
    if (this.currentlyPressedKeys[33]) {
      // Page Up
      this.pitchRate = 0.1
    } else if (this.currentlyPressedKeys[34]) {
      // Page Down
      this.pitchRate = -0.1
    } else {
      this.pitchRate = 0
    }

    if (this.currentlyPressedKeys[37] || this.currentlyPressedKeys[65]) {
      // Left cursor key or A
      this.yawRate = 0.1
    } else if (this.currentlyPressedKeys[39] || this.currentlyPressedKeys[68]) {
      // Right cursor key or D
      this.yawRate = -0.1
    } else {
      this.yawRate = 0
    }

    if (this.currentlyPressedKeys[38] || this.currentlyPressedKeys[87]) {
      // Up cursor key or W
      this.speed = 0.001
    } else if (this.currentlyPressedKeys[40] || this.currentlyPressedKeys[83]) {
      // Down cursor key
      this.speed = -0.001
    } else {
      this.speed = 0
    }
  }
}
