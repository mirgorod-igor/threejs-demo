import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import {A, D, DIRECTIONS, S, SPACE, W} from './keyboard'
import {AnimationAction, AnimationMixer, AnimationUtils, Camera, Group, LoopRepeat, Quaternion, Vector3} from 'three'
import {LoopOnce} from 'three/src/constants'

const SCALAR = 2.75

const runningOnceAction: Partial<Record<animation.Action, boolean>> = {
    braced_hang_drop: false,
    idle_to_braced_hang: false,
    jump: false
}

export class CharacterControls {

    // state
    #state: animation.State = 'ground'
    toggleRun = true


    // temporary data
    walkDirection = new Vector3()
    rotateAngle = new Vector3(0, 1, 0)
    rotateQuarternion = new Quaternion()
    cameraTarget = new Vector3()

    // constants
    fadeDuration = 0.2
    runVelocity = 5 * SCALAR
    walkVelocity = 2 * SCALAR

    private dirOffsetJump?: number

    constructor(
        private readonly _model: Group,
        private readonly _mixer: AnimationMixer,
        private readonly _animationsMap: Map<animation.Action, AnimationAction>,
        private readonly _controls: OrbitControls,
        private readonly _camera: Camera,
        private _currentAction: animation.Action
    ) {
        for (const [key, action] of _animationsMap) {
            if (key == 'braced_hang_drop' || key == 'idle_to_braced_hang' || key == 'jump') {
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
        this._controls.minDistance = 20
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

    update(delta: number, keysPressed: any) {
        let nextAction = this._currentAction

        if (runningOnceAction[nextAction]) {

            const isRunning = this.currentAction.isRunning()

            // если закончилась анимация
            if (!isRunning) {
                // если было висение
                if (runningOnceAction.braced_hang_drop)
                    this.#state = 'ground'
                // если был jump
                if (runningOnceAction.jump)
                    this.dirOffsetJump = undefined
            }

            runningOnceAction[nextAction] = isRunning
        }
        else if (keysPressed[SPACE]) {
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

            keysPressed[SPACE] = false
        }
        else if (this.#state == 'ground') {
            const directionPressed = DIRECTIONS.some(key => keysPressed[key] == true)
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

        console.log(this._currentAction + ' => ' + nextAction, this.currentAction.isRunning())


        if (this._currentAction != nextAction) {
            const current = this.currentAction
            const next = this.action(nextAction)!

            current.fadeOut(this.fadeDuration)
            next.reset().fadeIn(this.fadeDuration).play()
            if (nextAction in runningOnceAction)
                runningOnceAction[nextAction] = true

            this._currentAction = nextAction
        }

        this._mixer.update(delta)


        if (nextAction == 'running' || nextAction == 'walking' || nextAction == 'jump') {
            // diagonal movement angle offset
            let directionOffset = this.directionOffset(keysPressed)

            if (runningOnceAction.jump) {
                if (this.currentAction.time < 0.1) {
                    if (this.dirOffsetJump == undefined) {
                        this.dirOffsetJump = directionOffset
                    }
                }
                directionOffset = this.dirOffsetJump ?? directionOffset
                //console.log(this.currentAction.getEffectiveTimeScale(), this.currentAction.time)
            }


            // calculate towards camera direction
            const angleYCameraDirection = Math.atan2(
                (this._model.position.x - this._camera.position.x),
                (this._model.position.z - this._camera.position.z)
            )

            // rotate model
            this.rotateQuarternion.setFromAxisAngle(this.rotateAngle, angleYCameraDirection + directionOffset)
            this._model.quaternion.rotateTowards(this.rotateQuarternion, 0.2)

            // calculate direction
            this._camera.getWorldDirection(this.walkDirection)
            this.walkDirection.y = 0
            this.walkDirection.normalize()
            this.walkDirection.applyAxisAngle(this.rotateAngle, directionOffset)

            // run/walk velocity
            //const velocity = (nextAction == 'running' || nextAction == 'running_jump')
            //    ? this.runVelocity : this.walkVelocity
            const velocity = nextAction == 'running'
                ? this.runVelocity : nextAction == 'jump' ? this.runVelocity*1.2 : this.walkVelocity


            // move model & camera
            const moveX = this.walkDirection.x * velocity * delta
            const moveZ = this.walkDirection.z * velocity * delta

            this._model.position.x += moveX
            this._model.position.z += moveZ

            this.updateCameraTarget(moveX, moveZ)
        }
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

    private directionOffset(keysPressed: any) {
        let directionOffset = 0 // w

        if (keysPressed[W]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4 // w+a
            } else if (keysPressed[D]) {
                directionOffset = -Math.PI / 4 // w+d
            }
        } else if (keysPressed[S]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4 + Math.PI / 2 // s+a
            } else if (keysPressed[D]) {
                directionOffset = -Math.PI / 4 - Math.PI / 2 // s+d
            } else {
                directionOffset = Math.PI // s
            }
        } else if (keysPressed[A]) {
            directionOffset = Math.PI / 2 // a
        } else if (keysPressed[D]) {
            directionOffset = -Math.PI / 2 // d
        }

        return directionOffset
    }
}