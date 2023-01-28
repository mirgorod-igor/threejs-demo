import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import {A, D, DIRECTIONS, S, SPACE, W} from './keyboard'
import {AnimationAction, AnimationMixer, Camera, Group, LoopRepeat, Quaternion, Vector3} from 'three'
import {LoopOnce} from 'three/src/constants'
import BracedHangingShimmy = animation.BracedHangingShimmy



const animationY: Partial<Record<animation.Action, [number, number, number]>> = {

}


const SCALE = 2.75

const onceActions: animation.Action[] = [
    'jump', 'idle_to_braced_hang',
    'left_braced_hang_shimmy', 'right_braced_hang_shimmy',
    'braced_to_free_hang', 'free_hang_to_braced',
    'braced_hang_drop', 'braced_hang_to_crouch', 'crouched_to_standing'
]

const runningOnceAction = onceActions.reduce((res, it) =>
    ((res[it] = false), res)
, {} as Partial<Record<animation.Action, boolean>>)

const velAni: Partial<Record<animation.Action, number>> = {
    left_braced_hang_shimmy: 1,
    right_braced_hang_shimmy: -1

}

const freeHangShimmyDir: Partial<Record<animation.BracedHangingShimmy, number>> = {
    left_braced_hang_shimmy: 1,
    right_braced_hang_shimmy: -1
}

function directionAngle(keysPressed: KeyPressed) {
    let angle = 0 // w

    if (keysPressed.w) {
        if (keysPressed.a) {
            angle = Math.PI / 4 // w+a
        } else if (keysPressed.d) {
            angle = -Math.PI / 4 // w+d
        }
    } else if (keysPressed.s) {
        if (keysPressed.a) {
            angle = Math.PI / 4 + Math.PI / 2 // s+a
        } else if (keysPressed.d) {
            angle = -Math.PI / 4 - Math.PI / 2 // s+d
        } else {
            angle = Math.PI // s
        }
    } else if (keysPressed.a) {
        angle = Math.PI / 2
    } else if (keysPressed.d) {
        angle = -Math.PI / 2
    }

    return angle
}


const xyz = new Vector3(1, 1, 1)
export class CharacterControls {

    // state
    #state: animation.State = 'standing'
    #pose: animation.Pose = 'normal'


    // temporary data
    walkDirection = new Vector3()
    rotateAngle = new Vector3(0, 1, 0)
    rotateQua = new Quaternion()
    cameraTarget = new Vector3()

    // constants
    fadeDuration = 0.2
    runVelocity = 5 * SCALE
    walkVelocity = 2 * SCALE

    private fixDirOffset?: number

    constructor(
        private readonly _model: Group,
        private readonly _mixer: AnimationMixer,
        private readonly _animationsMap: Map<animation.Action, AnimationAction>,
        private readonly _controls: OrbitControls,
        private readonly _camera: Camera,
        private _currentAction: animation.Action
    ) {
        for (const [key, action] of _animationsMap) {
            if (onceActions.includes(key)) {
                action.setLoop(LoopOnce, 1).clampWhenFinished = true
            }
            else {
                action.setLoop(LoopRepeat, Infinity).clampWhenFinished = false
            }



            let {values} = action.getClip().tracks[0]
            const i = values.length-3
            if (key == 'crouched_to_standing') {
                //console.log(action.getClip().tracks)
                //values = action.getClip().tracks.find(it => it.name == 'Neck.position')!.values
            }

            console.log(key, action.getClip().tracks[0])

            animationY[key] = [
                values[i] * SCALE,
                (values[i+1] - 1) * SCALE,
                values[i+2] * SCALE
                //values[values.length-3] * SCALE,
                //values[values.length-2] * SCALE,
                //values[values.length-1] * SCALE
            ]

            if (key == _currentAction) {
                action.play()
            }
        }

        this._model.scale.setScalar(SCALE)
        this._controls.minDistance = 10
        this._controls.maxDistance = 30

        this.updateCameraTarget(0, 0)
        //console.log(animationY)
    }

    get object() {
        return this._model
    }

    get currentAction() {
        return this.action(this._currentAction)!
    }

    action(name: animation.Action) {
        return this._animationsMap.get(name)!
    }


    update(delta: number, keyPressed: KeyPressed) {
        let nextAction = this._currentAction

        const isRunning = this.currentAction.isRunning()

        // STATE

        if (runningOnceAction[nextAction]) {

            // если закончилась анимация
            if (!isRunning) {

                // закончился запрыг
                if (runningOnceAction.idle_to_braced_hang) {
                    this.#state = 'hanging'
                    nextAction = 'braced_hanging_idle'
                }

                // закончился переход braced в free
                if (runningOnceAction.braced_to_free_hang) {
                    this.#state = 'hanging'
                    nextAction = 'free_hanging_idle'
                }
                // закончился переход free в braced
                if (runningOnceAction.free_hang_to_braced) {
                    this.#state = 'hanging'
                    nextAction = 'braced_hanging_idle'
                }

                // закончился переход braced в crouch
                if (runningOnceAction.braced_hang_to_crouch) {
                    this.#state = 'crouch'
                    nextAction = 'crouched_to_standing'
                }

                // закончился переход crouch в stand
                if (runningOnceAction.crouched_to_standing) {
                    this.#state = 'standing'
                    nextAction = 'standing'
                }


                // закончился спрыг
                if (runningOnceAction.braced_hang_drop) {
                    this.#state = 'standing'
                    nextAction = 'standing'
                    this.fixDirOffset = undefined
                }

                // закончился движение влево/вправо
                const isBracedHangShimmy = runningOnceAction.left_braced_hang_shimmy || runningOnceAction.right_braced_hang_shimmy
                if (isBracedHangShimmy) {
                    nextAction = 'braced_hanging_idle'
                }

                // если был jump
                if (runningOnceAction.jump)
                    this.fixDirOffset = undefined
            }

            runningOnceAction[this._currentAction] = isRunning
        }
        else if (keyPressed[' ']) {
            console.log('pressed space')

            if (nextAction == 'standing') {
                nextAction = 'idle_to_braced_hang'
                this.#state = 'hanging'
            }
            else if (this.#state == 'hanging') {
                nextAction = 'braced_hang_drop'
            }
            else if (nextAction == 'running') {
                nextAction = 'jump'
            }

            keyPressed[' '] = false
        }
        else if (this.#state == 'standing') {
            const directionPressed = DIRECTIONS.some(key => keyPressed[key])
            nextAction = !directionPressed
                ? 'standing'
                : keyPressed.shift ? 'running' : 'walking'
        }
        else if (this.#state == 'hanging') {
            if (nextAction == 'braced_hanging_idle') {
                nextAction = keyPressed.w
                    ? 'braced_hang_to_crouch' : keyPressed.a
                        ? 'left_braced_hang_shimmy'
                        : keyPressed.d
                            ? 'right_braced_hang_shimmy'
                            : keyPressed.s
                                ? keyPressed.shift
                                    ? 'braced_to_free_hang' : 'braced_hang_drop'
                                : nextAction
            }
            else if (nextAction == 'free_hanging_idle') {
                nextAction = keyPressed.a
                    ? 'left_braced_hang_shimmy'
                    : keyPressed.d ? 'right_braced_hang_shimmy'
                        : keyPressed.w ? 'free_hang_to_braced' : nextAction
            }
        }

        //console.log(this._currentAction + ' => ' + nextAction, isRunning)

        // PLAY

        if (this._currentAction != nextAction) {
            const current = this.currentAction
            const next = this.action(nextAction)!
            //next.setDuration(5)

            current.fadeOut(
                this._currentAction == 'crouched_to_standing' ? 0 : this.fadeDuration
            )

            next.reset()
                .fadeIn(this.fadeDuration)
                .play()
            //if (nextAction == 'braced_hang_to_crouch')
            //    next.setDuration(3)




            if (nextAction in runningOnceAction)
                runningOnceAction[nextAction] = true
        }

        // 3) MOVE

        /*if (nextAction == 'braced_hang_to_crouch') {
            this._controls.target.y += 0.016
            this._camera.position.y += 0.016
        }*/

        if (nextAction == 'standing') {
            if (this._currentAction == 'crouched_to_standing') {
                const currVals = this._animationsMap.get('crouched_to_standing')!.getClip().tracks[0].values
                const xOffset = currVals[currVals.length-3]
                    , yOffset = currVals[currVals.length-2]-1
                    , zOffset = currVals[currVals.length-1]

                this._model.translateZ(zOffset * SCALE);
                this._model.position.y += yOffset * SCALE


                this._model.getWorldDirection(this.walkDirection)
                this.walkDirection.y = 0
                this.walkDirection.normalize()
                this.walkDirection.applyAxisAngle(this.rotateAngle, Math.PI / 2)

                const moveX = this.walkDirection.x
                const moveZ = this.walkDirection.z

                this.updateCameraTarget(0, moveZ)
            }
        }

        if (nextAction == 'standing') {

        }
        else if (this.#state == 'hanging') {
            if (nextAction == 'braced_hanging_idle') {

            }
            else {
                const vel = velAni[nextAction as BracedHangingShimmy]!
                if (!isNaN(vel)) {
                    this._model.getWorldDirection(this.walkDirection)
                    this.walkDirection.y = 0
                    this.walkDirection.normalize()
                    this.walkDirection.applyAxisAngle(this.rotateAngle, Math.PI / 2)

                    const moveX = this.walkDirection.x * vel * delta
                    const moveZ = this.walkDirection.z * vel * delta

                    this._model.position.x += moveX
                    this._model.position.z += moveZ

                    this.updateCameraTarget(moveX, moveZ)
                }
            }
        }
        /*if (nextAction == 'idle_to_braced_hang') {
            console.log({...this.currentAction.getMixer()})

            this._model.position.y += 0.01
        }*/
        else if (nextAction == 'running' || nextAction == 'walking' || nextAction == 'jump') {
            let dirAngle = directionAngle(keyPressed)

            if (runningOnceAction.jump) {
                if (this.currentAction.time < 0.1) {
                    if (this.fixDirOffset == undefined) {
                        this.fixDirOffset = dirAngle
                    }
                }
                dirAngle = this.fixDirOffset ?? dirAngle
                //console.log(this.currentAction.getEffectiveTimeScale(), this.currentAction.time)
            }

            // calculate towards camera direction
            const angleYCameraDirection = Math.atan2(
                (this._model.position.x - this._camera.position.x),
                (this._model.position.z - this._camera.position.z)
            )

            //console.log('angleY cam dir', angleYCameraDirection)

            // rotate model
            this.rotateQua.setFromAxisAngle(this.rotateAngle, angleYCameraDirection + dirAngle)
            this._model.quaternion.rotateTowards(this.rotateQua, 0.2)

            // calculate direction
            this._camera.getWorldDirection(this.walkDirection)
            this.walkDirection.y = 0
            this.walkDirection.normalize()
            this.walkDirection.applyAxisAngle(this.rotateAngle, dirAngle)

            // run/walk velocity
            //const velocity = (nextAction == 'running' || nextAction == 'running_jump')
            //    ? this.runVelocity : this.walkVelocity
            const velocity = nextAction == 'running'
                ? this.runVelocity
                : nextAction == 'jump'
                    ? this.runVelocity*1.2
                    : this.walkVelocity


            // move model & camera
            const moveX = this.walkDirection.x * velocity * delta
            const moveZ = this.walkDirection.z * velocity * delta

            this._model.position.x += moveX
            this._model.position.z += moveZ

            this.updateCameraTarget(moveX, moveZ)
        }

        console.log('posY', this._model.position.y)
        if (this._currentAction == 'braced_hang_to_crouch') {

        }

        this._currentAction = nextAction

        this._mixer.update(delta)
    }

    private updateCameraTarget(moveX: number, moveZ: number) {
        // move camera
        this._camera.position.x += moveX
        this._camera.position.z += moveZ

        // update camera target
        const pos = this._model.position
        this.cameraTarget.x = pos.x
        this.cameraTarget.y = pos.y + 1
        this.cameraTarget.z = pos.z
        this._controls.target = this.cameraTarget
    }


}
