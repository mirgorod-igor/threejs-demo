import {
    AnimationAction,
    AnimationClip,
    AnimationMixer, BoxGeometry,
    BufferGeometry, Camera, Color, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial, MeshPhongMaterial,
    Object3D,
    PlaneGeometry,
    Scene,
    Vector3
} from 'three'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'
import {CharacterControls} from './CharacterControls'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'


import man from './assets/models/man.glb?url'

import idle_to_braced_hang from './assets/models/idle_to_braced_hang.glb?url'
import hanging_idle from './assets/models/hanging_idle.glb?url'
import braced_hang_drop from './assets/models/braced_hang_drop.glb?url'
import braced_hang_hop_left from './assets/models/braced_hang_hop_left.glb?url'
import braced_hang_hop_right from './assets/models/braced_hang_hop_right.glb?url'

import left_braced_hang_shimmy from './assets/models/left_braced_hang_shimmy.glb?url'
import right_braced_hang_shimmy from './assets/models/right_braced_hang_shimmy.glb?url'
import braced_to_free_hang from './assets/models/braced_to_free_hang.glb?url'


import free_hanging_idle from './assets/models/free_hanging_idle.glb?url'
import free_hang_to_braced from './assets/models/free_hang_to_braced.glb?url'
import braced_hang_to_crouch from './assets/models/braced_hang_to_crouch.glb?url'
import crouched_to_standing from './assets/models/crouched_to_standing.glb?url'


import standing from './assets/models/standing.glb?url'
import running from './assets/models/running.glb?url'
import jump from './assets/models/jump.glb?url'
import start_walking from './assets/models/start_walking.glb?url'
import walking from './assets/models/walking.glb?url'

import {OBJExporter} from 'three/examples/jsm/exporters/OBJExporter'


const exportScene = (input: Object3D) => {
    const exporter = new OBJExporter()
    const str = exporter.parse(input)
    saveString(str, 'scene.obj');
    /*exporter.parse(
        input,
        function (result) {
            if (result instanceof ArrayBuffer) {
                saveArrayBuffer(result, 'scene.glb');
            } else {
                const output = JSON.stringify(result, null, 2);
                console.log(output);
                saveString(output, 'scene.gltf');
            }
        },
        function (error) {
            console.log('An error happened during parsing', error);
        },
        {
            animations: input.animations,

        }
    )*/
}

function save( blob: Blob, filename: string ) {
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    // URL.revokeObjectURL( url ); breaks Firefox...
}

function saveString( text: BlobPart, filename: string ) {
    save( new Blob( [ text ], { type: 'text/plain' } ), filename );
}


function saveArrayBuffer( buffer: BlobPart, filename: string ) {
    save( new Blob( [ buffer ], { type: 'application/octet-stream' } ), filename );
}

const link = document.createElement('a')
link.style.display = 'none'
document.body.appendChild(link)

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




const boxGeometry = new BoxGeometry(5, 5, 5).toNonIndexed();

position = boxGeometry.attributes.position;
const colorsBox = [];

for ( let i = 0, l = position.count; i < l; i ++ ) {
    color.setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
    colorsBox.push( color.r, color.g, color.b );
}

boxGeometry.setAttribute( 'color', new Float32BufferAttribute( colorsBox, 3 ) );

export const objects: Mesh[] = []


for (let i = 0; i < 500; i++) {
    const mat = new MeshPhongMaterial({
        specular: 0xffffff, flatShading: true, vertexColors: true
    })

    mat.color.setHSL (
        Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75
    )

    const box = new Mesh(boxGeometry, mat)
    box.position.x = Math.floor(Math.random() * 20 - 10) * 5
    box.position.y = Math.floor(Math.random() * 20) * 20 + 2.5
    box.position.z = Math.floor(Math.random() * 20 - 10) * 5
    box.name = 'box'+(1000*box.position.x + 100*box.position.z)

    objects.push(box)
}



type People = {
    obj: Object3D
    mixer: AnimationMixer
    actions: AnimationAction[]
}


const peoples: People[] = []
    , clips: Record<string, AnimationClip> = {}
    , glbLoader = new GLTFLoader()



let characterControls: CharacterControls




const animationsMap = new Map<animation.Action, AnimationAction>()


export const createMainCharacter = async (camera: Camera, controls: OrbitControls) => {
    const model = (await glbLoader.loadAsync( man)).scene

    model.traverse(obj => {
        if ('isMesh' in obj && obj.isMesh)
            obj.castShadow = true
    })

    const mixer = new AnimationMixer(model)


    const anims: [animation.Action, Group][] = await Promise.all(
        ([
            ['standing', standing],
            ['running', running],
            ['jump', jump],
            ['start_walking', start_walking],
            ['walking', walking],
            ['idle_to_braced_hang', idle_to_braced_hang],
            ['braced_hanging_idle', hanging_idle],
            ['braced_hang_drop', braced_hang_drop],
            ['braced_hang_hop_left', braced_hang_hop_left],
            ['braced_hang_hop_right', braced_hang_hop_right],
            ['left_braced_hang_shimmy', left_braced_hang_shimmy],
            ['right_braced_hang_shimmy', right_braced_hang_shimmy],
            ['braced_to_free_hang', braced_to_free_hang],
            ['free_hanging_idle', free_hanging_idle],
            ['free_hang_to_braced', free_hang_to_braced],
            ['braced_hang_to_crouch', braced_hang_to_crouch],
            ['crouched_to_standing', crouched_to_standing]
        ] as [animation.Action, string][])
        .map(async it => [
            it[0], (await glbLoader.loadAsync(it[1])) as unknown as Group
        ])
    )

    for (const anim of anims) {
        anim[1].animations[0].name = anim[0]
        animationsMap.set(anim[0], mixer.clipAction(anim[1].animations[0]))
    }

    //exportScene(model)

    return characterControls = new CharacterControls(
        model, mixer, animationsMap, controls, camera, 'standing'
    )
}

export function load(scene: Scene, camera: Camera, controls: OrbitControls) {
    for (const o of objects) {
        scene.add(o)
    }
    scene.add(floor)
}

export function update(camera: Camera) {
    //const pos = peoples[0]?.obj?.position
    //camera.lookAt(pos)
}
