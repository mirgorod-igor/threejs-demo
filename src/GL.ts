import {
    AxesHelper, Box3, BoxGeometry, BoxHelper, CameraHelper, Clock,
    Color, DirectionalLight, DirectionalLightHelper, Mesh, MeshBasicMaterial, Object3D,
    PerspectiveCamera,
    Raycaster,
    Scene, SphereGeometry, sRGBEncoding,
    Vector3, WebGLRenderer
} from 'three'

import * as objs from './objects'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import {degToRad} from 'three/src/math/MathUtils'
import {createMainCharacter} from './objects'
import DirLightHelper from './DirLightImage'

// SCENE
const scene = new Scene()
scene.background = new Color(0xffffff)

const axesHelper = new AxesHelper(5)
scene.add(axesHelper)


// CAMERA
const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000)
camera.position.x = 0
camera.position.y = 5
camera.position.z = -25
scene.add(camera)



// RENDERER
const renderer = new WebGLRenderer({antialias: true})
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
//renderer.outputEncoding = sRGBEncoding
renderer.shadowMap.enabled = true


// CONTROLS
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
//controls.minPolarAngle = degToRad(70)
//controls.maxPolarAngle = degToRad(80)// - 0.05
//controls.enableRotate = false
controls.update()

delete controls.mouseButtons['RIGHT']


// LIGHTS
function createLight(target: Object3D) {
    //scene.add(new AmbientLight(0xffffff, 0.7))
    const light = new DirectionalLight(0xffffff, 1)
    light.castShadow = true
    light.target = target

    /*light.shadow.camera.top = 20
    light.shadow.camera.bottom = -20
    light.shadow.camera.left = -20
    light.shadow.camera.right = 20
    light.shadow.camera.near = 0.1
    light.shadow.camera.far = 40*/
    //light.shadow.mapSize.width = 4096
    //light.shadow.mapSize.height = 4096


    const lightObj = new DirLightHelper(light, 1, 0xff00FF)
    lightObj.translateZ(-10)
    //lightObj.add(light)
    //light.add(lightObj)
//light.add(lightObj)
    //scene.add(lightObj)
    camera
        .add(light)
        //.add(new CameraHelper(light.shadow.camera))

    //lightObj.rotateX(Math.PI / 2)

    return { light, lightObj }
}


// CONTROL KEYS
const keysPressed = {}
//const keyDisplayQueue = new KeyDisplay();
document.addEventListener('keydown', (event) => {
    //keyDisplayQueue.down(event.key)
    if (event.shiftKey && characterControls) {
        characterControls.switchRunToggle()
    } else {
        (keysPressed as any)[event.key.toLowerCase()] = true
    }
}, false)
document.addEventListener('keyup', (event) => {
    //keyDisplayQueue.up(event.key);
    (keysPressed as any)[event.key.toLowerCase()] = false
}, false)

let characterControls = await createMainCharacter(camera, controls)

scene.add(characterControls.object)


objs.load(scene, camera, controls)

const {light, lightObj} = createLight(characterControls.object)


const raycaster = new Raycaster(new Vector3(), new Vector3(0, -1, 0), 0, 10)


let prevTime = performance.now()


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}

window.addEventListener('resize', onWindowResize)


const objects: any[] = []


const clock = new Clock()
function animate() {
    let mixerUpdateDelta = clock.getDelta()
    characterControls?.update(mixerUpdateDelta, keysPressed)
    controls.update()
    lightObj.update()

    renderer.render(scene, camera)
    requestAnimationFrame(animate)
}

document.getElementById('root')!.appendChild(renderer.domElement)

animate()

