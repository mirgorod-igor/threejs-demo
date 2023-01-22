import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import {A, D, DIRECTIONS, S, SPACE, W} from './keyboard'
import {AnimationAction, AnimationMixer, Camera, Group, LoopRepeat, Quaternion, Vector3} from 'three'
import {LoopOnce} from 'three/src/constants'
import BracedHangingShimmy = animation.BracedHangingShimmy

const SCALAR = 2.75

const onceActions: animation.Action[] = [
    'jump', 'idle_to_braced_hang',
    'left_braced_hang_shimmy', 'right_braced_hang_shimmy',
    'braced_to_free_hang', 'free_hang_to_braced',
    'braced_hang_drop'
]

const runningOnceAction = onceActions.reduce((res, it) =>
    ((res[it] = false), res)
, {} as Partial<Record<animation.Action, boolean>>)

const bracedHangShimmyDir: Partial<Record<animation.BracedHangingShimmy, number>> = {
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


export class CharacterControls {

    // state
    #state: animation.State = 'ground'
    #pose: animation.Pose = 'normal'
    toggleRun = true


    // temporary data
    walkDirection = new Vector3()
    rotateAngle = new Vector3(0, 1, 0)
    rotateQua = new Quaternion()
    cameraTarget = new Vector3()

    // constants
    fadeDuration = 0.2
    runVelocity = 5 * SCALAR
    walkVelocity = 2 * SCALAR

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
            if (key == _currentAction) {
                action.play()
            }
        }

        this._model.scale.setScalar(SCALAR)
        this._controls.minDistance = 10
        this._controls.maxDistance = 30

        this.updateCameraTarget(0, 0)
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

    switchRunToggle() {
        this.toggleRun = !this.toggleRun
    }

    update(delta: number, keyPressed: KeyPressed) {
        let nextAction = this._currentAction

        const isRunning = this.currentAction.isRunning()

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


                // закончился спрыг
                if (runningOnceAction.braced_hang_drop) {
                    this.#state = 'ground'
                    nextAction = 'idle'
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
        else if (keyPressed[SPACE]) {
            console.log('pressed space')

            if (nextAction == 'idle') {
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
        else if (this.#state == 'ground') {
            const directionPressed = DIRECTIONS.some(key => keyPressed[key])
            if (directionPressed && this.toggleRun) {
                nextAction = 'running'
            }
            else if (directionPressed) {
                nextAction = 'walking'
            }
            else {
                nextAction = 'idle'
            }
        }
        else if (this.#state == 'hanging') {
debugger
            if (nextAction == 'braced_hanging_idle') {
                nextAction = keyPressed.a
                    ? 'left_braced_hang_shimmy'
                    : keyPressed.d ? 'right_braced_hang_shimmy'
                        : keyPressed.s ? 'braced_to_free_hang' : nextAction
            }
            else if (nextAction == 'free_hanging_idle') {
                nextAction = keyPressed.a
                    ? 'left_braced_hang_shimmy'
                    : keyPressed.d ? 'right_braced_hang_shimmy'
                        : keyPressed.w ? 'free_hang_to_braced' : nextAction
            }
        }

        console.log(this._currentAction + ' => ' + nextAction, isRunning)

        // PLAY

        if (this._currentAction != nextAction) {
            const current = this.currentAction
            const next = this.action(nextAction)!
            //next.setDuration(5)

            current.fadeOut(this.fadeDuration)
            next.reset().fadeIn(this.fadeDuration).play()

            if (nextAction in runningOnceAction)
                runningOnceAction[nextAction] = true

            this._currentAction = nextAction
        }

        this._mixer.update(delta)

        // 3) MOVE

        if (this.#state == 'hanging') {
            if (nextAction == 'braced_hanging_idle') {

            }
            else {
                const vel = bracedHangShimmyDir[nextAction as BracedHangingShimmy]!
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

        //console.log(this._model.position)
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