import {PointerLockControls} from 'three/examples/jsm/controls/PointerLockControls'
import {Camera, Vector3} from 'three'

class Controls {
    #velo = new Vector3()
    #dir = new Vector3()
    #move = {
        forward: false,
        backward: false,
        left: false,
        right: false
    }
    #canJump = false
    constructor(
        camera: Camera,
        element: HTMLElement,
        readonly inner = new PointerLockControls(camera, element)
    ) {
        document.addEventListener('keydown', this.#onKeyDown.bind(this))
        document.addEventListener('keyup', this.#onKeyUp.bind(this))
    }

    #onKeyDown(event: KeyboardEvent) {

        switch ( event.code ) {

            case 'ArrowUp':
            case 'KeyW':
                this.#move.forward = true
                break;

            case 'ArrowLeft':
            case 'KeyA':
                this.#move.left = true
                break;

            case 'ArrowDown':
            case 'KeyS':
                this.#move.backward = true
                break;

            case 'ArrowRight':
            case 'KeyD':
                this.#move.right = true
                break;

            case 'Space':
                if ( this.#canJump )
                    this.#velo.y += 350
                this.#canJump = false
                break;

        }

    };

    #onKeyUp(event: KeyboardEvent) {

        switch ( event.code ) {

            case 'ArrowUp':
            case 'KeyW':
                this.#move.forward = false
                break

            case 'ArrowLeft':
            case 'KeyA':
                this.#move.left = false
                break

            case 'ArrowDown':
            case 'KeyS':
                this.#move.backward = false
                break

            case 'ArrowRight':
            case 'KeyD':
                this.#move.right = false
                break

        }

    }

    update(delta: number, onObject: boolean) {
        this.#velo.x -= this.#velo.x * 10.0 * delta
        this.#velo.z -= this.#velo.z * 10.0 * delta

        // 100.0 = mass
        this.#velo.y -= 9.8 * 100.0 * delta

        this.#dir.z = Number( this.#move.forward ) - Number( this.#move.backward )
        this.#dir.x = Number( this.#move.right ) - Number( this.#move.left )
        // this ensures consistent movements in all directions
        this.#dir.normalize()

        if (this.#move.forward || this.#move.backward)
            this.#velo.z -= this.#dir.z * 400.0 * delta;
        if (this.#move.left || this.#move.right)
            this.#velo.x -= this.#dir.x * 400.0 * delta;

        if (onObject) {
            this.#velo.y = Math.max( 0, this.#velo.y )
            this.#canJump = true
        }

        this.inner.moveRight( - this.#velo.x * delta )
        this.inner.moveForward( - this.#velo.z * delta )

        this.camera.position.y += ( this.#velo.y * delta )

        if ( this.camera.position.y < 10 ) {
            this.#velo.y = 0
            this.camera.position.y = 10
            this.#canJump = true
        }
    }
    get camera() {
        return this.inner.getObject()
    }

    get isLocked() {
        return this.inner.isLocked
    }

    lock() {
        this.inner.lock()
    }
}




export default Controls
