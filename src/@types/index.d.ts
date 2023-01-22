declare module animation {
    type Pose = 'normal' | 'hanging'
    type State = 'ground' | 'hanging'
    type BracedHangingShimmy = 'left_braced_hang_shimmy' | 'right_braced_hang_shimmy'
    type BracedHanging = 'braced_hanging_idle' | BracedHangingShimmy | 'braced_to_free_hang' | 'braced_hang_drop'
    type FreeHanging = 'free_hanging_idle' | 'free_hang_to_braced'
    type Action = 'idle' | 'walking' | 'running' | 'jump' | 'idle_to_braced_hang' | BracedHanging | FreeHanging

}

type Wasd = 'w' | 'a' | 's' | 'd'
type Key = Wasd | ' ' | 'shift'


type KeyPressed = Partial<Record<Key, boolean>>