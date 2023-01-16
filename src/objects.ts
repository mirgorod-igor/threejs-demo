import {
    AnimationAction,
    AnimationClip,
    AnimationMixer,
    BufferGeometry, Camera, Color, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial,
    Object3D,
    PlaneGeometry,
    Scene,
    Vector3
} from 'three'
import {degToRad} from 'three/src/math/MathUtils'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'
import {CharacterControls} from './CharacterControls'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader'

import man from './assets/models/63bdb99e5a5d0e0739cc496f.glb?url'
import idle_to_braced_hang from './assets/models/idle_to_braced_hang.fbx?url'
import braced_hang_drop from './assets/models/braced_hang_drop.fbx?url'
import idle from './assets/models/idle.fbx?url'
import running from './assets/models/running.fbx?url'


let floorGeometry: BufferGeometry = new PlaneGeometry(2000, 2000, 100, 100)
floorGeometry.rotateX(-Math.PI / 2)


const vertex = new Vector3()
const color = new Color()
let position = floorGeometry.attributes.position


for (let i = 0, l = position.count; i < l; i++) {
    vertex.fromBufferAttribute(position, i)
    vertex.x += Math.random() * 20 - 10
    //vertex.y += Math.random() * 2
    vertex.z += Math.random() * 20 - 10
    position.setXYZ(i, vertex.x, vertex.y, vertex.z)
}

// ensure each face has unique vertices
floorGeometry = floorGeometry.toNonIndexed()

position = floorGeometry.attributes.position
const colorsFloor = []

for (let i = 0, l = position.count; i < l; i++) {
    color.setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75)
    colorsFloor.push(color.r, color.g, color.b)
}

floorGeometry.setAttribute('color', new Float32BufferAttribute(colorsFloor, 3))


const floorMaterial = new MeshBasicMaterial({vertexColors: true})

const floor = new Mesh(floorGeometry, floorMaterial)


const peoplesConf = [
    {
        name: '62f67b583e172e00547ceab5',
        //anims: ['standing_w_briefcase_idle'],
        pos: [137, 0, 10],
        rot: degToRad(180)
    }
]


type People = {
    obj: Object3D
    mixer: AnimationMixer
    actions: AnimationAction[]
}


const peoples: People[] = []
    , clips: Record<string, AnimationClip> = {}
    , glbLoader = new GLTFLoader()
    , fbxLoader = new FBXLoader()


let characterControls: CharacterControls



export const createFBXMainCharacter = (camera: Camera, controls: OrbitControls, resolve: (ch: CharacterControls) => void) => {
    fbxLoader.load('/models/man.fbx', model => {
        model.traverse(obj => {
            if ('isMesh' in obj && obj.isMesh)
                obj.castShadow = true
        })

        model.rotateX(Math.PI)

        const mixer = new AnimationMixer(model)
        const animationsMap = new Map<animation.Action, AnimationAction>()
        for (const anim of model.animations) {
            if (anim.name != 'TPose')
                animationsMap.set(anim.name as animation.Action, mixer.clipAction(anim))
        }

        characterControls = new CharacterControls(
            model, mixer, animationsMap, controls, camera, 'idle'
        )

        resolve(characterControls)
    })
}


const animationsMap = new Map<animation.Action, AnimationAction>()


export const createMainCharacter = async (camera: Camera, controls: OrbitControls) => {
    const model = (await glbLoader.loadAsync( man)).scene
    console.log(model)
    model.traverse(obj => {
        if ('isMesh' in obj && obj.isMesh)
            obj.castShadow = true
    })


    const mixer = new AnimationMixer(model)


    const anims: [animation.Action, Group][] = await Promise.all(
        ([
            ['idle', idle],
            ['running', running],
            ['idle_to_braced_hang', idle_to_braced_hang],
            ['braced_hang_drop', braced_hang_drop]
        ] as [animation.Action, string][])
        .map(async it => [
            it[0], await fbxLoader.loadAsync(it[1])
        ])
    )

    for (const anim of anims)
        animationsMap.set(anim[0], mixer.clipAction(anim[1].animations[0]))

    return characterControls = new CharacterControls(
        model, mixer, animationsMap, controls, camera, 'idle'
    )
}

export function load(scene: Scene, camera: Camera, controls: OrbitControls) {
    scene.add(floor)
}

export function update(camera: Camera) {
    //const pos = peoples[0]?.obj?.position
    //camera.lookAt(pos)
}