import * as THREE from 'three';
import imagesLoaded from "imagesloaded"
import FontFaceObserver from "fontfaceobserver"
import gsap from 'gsap'
import Scroll from './scroll';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import vertexShader from './shaders/vertex.glsl'
import fragmentShader from './shaders/fragment.glsl'
import noise from './shaders/noise.glsl'


import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';




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
      this.composerPass()
      this.render()
    })
  }

  composerPass() {
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    //custom shader pass
    var counter = 0.0;
    this.myEffect = {
      uniforms: {
        "tDiffuse": { value: null },
        "uScrollSpeed": { value: null },
        "uTime": { value: null },
      },
      vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix 
          * modelViewMatrix 
          * vec4( position, 1.0 );
      }
      `,
      fragmentShader: `
      uniform sampler2D tDiffuse;
      varying vec2 vUv;
      uniform float uScrollSpeed;
      uniform float uTime;
      ${noise}
      void main(){
        vec2 newUV = vUv;
        float area = smoothstep(1.,0.8,vUv.y)*2. - 1.;
        float area1 = smoothstep(0.4,0.0,vUv.y);
        area1 = pow(area1,4.);
        float noise = 0.5*(cnoise(vec3(vUv*10.,uTime/5.)) + 1.);
        float n = smoothstep(0.5,0.51, noise + area/2.);
        newUV.x -= (vUv.x - 0.5)*0.1*area1*uScrollSpeed;
        gl_FragColor = texture2D( tDiffuse, newUV);
      gl_FragColor = mix(vec4(1.),texture2D( tDiffuse, newUV),n);
      }
      `
    }

    this.customPass = new ShaderPass(this.myEffect);
    this.customPass.renderToScreen = true;

    this.composer.addPass(this.customPass);
  }

  mouseMovement() {
    window.addEventListener('mousemove', (event) => {
      this.mouse.x = (event.clientX / this.width) * 2 - 1;
      this.mouse.y = - (event.clientY / this.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);

      const intersects = this.raycaster.intersectObjects(this.scene.children);

      if (intersects.length > 0) {
        let obj = intersects[0].object;
        obj.material.uniforms.uHover.value = intersects[0].uv;
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

      img.addEventListener('mouseenter', () => {
        gsap.to(mat.uniforms.uHoverState, {
          duration: 1,
          value: 1,
        })
      })
      img.addEventListener('mouseout', () => {
        gsap.to(mat.uniforms.uHoverState, {
          duration: 1,
          value: 0,
        })
      })

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
        uImage: { value: 0 },
        uHover: { value: new THREE.Vector2(0.5, 0.5) },
        uHoverState: { value: 0 },
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
    this.customPass.uniforms.uScrollSpeed.value = this.scroll.speedTarget
    this.customPass.uniforms.uTime.value = this.time

    this.materials.forEach(mat => {
      mat.uniforms.uTime.value = this.time
    })

    // this.material.uniforms.uTime.value = this.time

    this.renderer.render(this.scene, this.camera)
    this.composer.render()
    window.requestAnimationFrame(this.render.bind(this))
  }
}

new Sketch({
  dom: document.getElementById('container')
})