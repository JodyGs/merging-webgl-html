import * as THREE from 'three';
import imagesLoaded from "imagesloaded"
import FontFaceObserver from "fontfaceobserver"
import Scroll from './scroll';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import vertexShader from './shaders/vertex.glsl'
import fragmentShader from './shaders/fragment.glsl'
import textureTest from './img/texture.jpg'


export default class Sketch {
  constructor(options) {
    this.time = 0
    this.container = options.dom
    this.scene = new THREE.Scene()

    this.width = this.container.offsetWidth
    this.height = this.container.offsetHeight

    this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 100, 1000)
    this.camera.position.z = 600

    this.camera.fov = 2 * Math.atan((this.height / 2) / 600) * (180 / Math.PI)

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)

    this.images = [...document.querySelectorAll('img')]

    const fontAilerons = new Promise(resolve => {
      new FontFaceObserver("Ailerons").load().then(() => {
        resolve()
      })
    })

    const preloadImages = new Promise((resolve, reject) => {
      imagesLoaded(document.querySelectorAll("img"), { background: true }, resolve)
    })

    let allDone = [fontAilerons, preloadImages]
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()


    Promise.all(allDone).then(() => {
      this.scroll = new Scroll()
      this.addObjects()
      this.addImages()
      this.setPosition()
      this.mouseMovement()

      this.resize()
      this.setupResize()
      this.render()
    })
  }

  mouseMovement() {
    window.addEventListener('mousemove', (event) => {
      this.mouse.x = (event.clientX / this.width) * 2 - 1
      this.mouse.y = (event.clientY / this.height) * 2 + 1

      this.raycaster.setFromCamera(this.mouse, this.camera)

      const intersects = this.raycaster.intersectObjects( this.scene.children)

      if(intersects.length > 0){

      }
    }, false)
  }

  setupResize() {
    window.addEventListener('resize', this.resize.bind(this))
  }

  resize() {
    this.width = this.container.offsetWidth
    this.height = this.container.offsetHeight
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()
  }

  addImages() {
    this.materials = []
    this.imageStore = this.images.map(img => {
      let bounds = img.getBoundingClientRect()
      let texture = new THREE.Texture(img)
      texture.needsUpdate = true

      let mat = this.material.clone()
      this.materials.push(mat)

      mat.uniforms.uImage.value = texture

      let mesh = new THREE.Mesh(this.geometry, mat)
      this.scene.add(mesh)
      mesh.scale.set(bounds.width, bounds.height)


      return {
        img: img,
        mesh: mesh,
        top: bounds.top,
        left: bounds.left,
        width: bounds.width,
        height: bounds.height
      }
    })
  }

  setPosition() {
    this.imageStore.forEach(obj => {
      obj.mesh.position.y = this.currentScroll - obj.top + this.height / 2 - obj.height / 2
      obj.mesh.position.x = obj.left - this.width / 2 + obj.width / 2
    })
  }

  addObjects() {
    this.geometry = new THREE.PlaneGeometry(1, 1, 10, 10)
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uImage: {value: 0},
        uHover: {value: new THREE.Vector2(0.5, 0.5)},
        uTexture: {value: new THREE.TextureLoader().load(textureTest)},
      },
      fragmentShader,
      vertexShader,
      // wireframe: true
    })
  }

  render() {
    this.time += 0.05
    this.scroll.render()
    this.currentScroll = this.scroll.scrollToRender
    this.setPosition()

    this.materials.forEach(mat => {
      mat.uniforms.uTime.value = this.time
    })

    // this.material.uniforms.uTime.value = this.time

    this.renderer.render(this.scene, this.camera)
    window.requestAnimationFrame(this.render.bind(this))
  }
}

new Sketch({
  dom: document.getElementById('container')
})