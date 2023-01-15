import {
    AmbientLight, AxesHelper, Clock,
    Color, DirectionalLight,
    PerspectiveCamera,
    Raycaster,
    Scene,
    Vector3, WebGLRenderer
} from 'three'

import * as objs from './objects'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import {degToRad} from 'three/src/math/MathUtils'
import {createMainCharacter} from './objects'

// SCENE
const scene = new Scene()
scene.background = new Color(0xffffff)

const axesHelper = new AxesHelper( 5 )
scene.add(axesHelper)


// CAMERA
const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000)
camera.position.x = 0
camera.position.y = 5
camera.position.z = -25


// RENDERER
const renderer = new WebGLRenderer({antialias: true})
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true


// CONTROLS
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.minPolarAngle = degToRad(70)
controls.maxPolarAngle = degToRad(80)// - 0.05
//controls.enableRotate = false
controls.update()


// LIGHTS
function light() {
    scene.add(new AmbientLight(0xffffff, 0.7))

    const dirLight = new DirectionalLight(0xffffff, 1)
    dirLight.position.set(-60, 100, -10)
    dirLight.castShadow = true
    dirLight.shadow.camera.top = 50
    dirLight.shadow.camera.bottom = -50
    dirLight.shadow.camera.left = -50
    dirLight.shadow.camera.right = 50
    dirLight.shadow.camera.near = 0.1
    dirLight.shadow.camera.far = 200
    dirLight.shadow.mapSize.width = 4096
    dirLight.shadow.mapSize.height = 4096
    scene.add(dirLight)
    // scene.add( new THREE.CameraHelper(dirLight.shadow.camera))
}

light()


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



const raycaster = new Raycaster(new Vector3(), new Vector3(0, -1, 0), 0, 10)


let prevTime = performance.now()

//scene.add(controls.camera)


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
    renderer.render(scene, camera)
    requestAnimationFrame(animate)
}

document.getElementById('root')!.appendChild(renderer.domElement)

animate()

