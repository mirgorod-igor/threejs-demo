declare module animation {
    type Pose = 'normal' | 'hanging'
    type State = 'standing' | 'hanging' | 'crouch'
    type BracedHangingShimmy = 'left_braced_hang_shimmy' | 'right_braced_hang_shimmy'
    type BracedHanging = 'braced_hanging_idle' | BracedHangingShimmy | 'braced_to_free_hang' | 'braced_hang_drop' | 'braced_hang_to_crouch'
    type Crouch = 'crouched_to_standing'
    type FreeHanging = 'free_hanging_idle' | 'free_hang_to_braced'
    type Action = 'standing' | 'walking' | 'running' | 'jump' | 'idle_to_braced_hang' | BracedHanging | FreeHanging | Crouch
}

type Wasd = 'w' | 'a' | 's' | 'd'
type Key = Wasd | ' ' | 'shift'


type KeyPressed = Partial<Record<Key, boolean>>
