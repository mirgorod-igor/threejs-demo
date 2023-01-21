declare module animation {
    type Pose = 'normal' | 'hanging'
    type State = 'ground' | 'hanging'
    type Action = 'idle' | 'walking' | 'running' | 'jump' | 'braced_hang_drop' | 'idle_to_braced_hang' |
        'hanging_idle' | 'left_braced_hang_shimmy' | 'right_braced_hang_shimmy'
}

type Wasd = 'w' | 'a' | 's' | 'd'
type Key = Wasd | ' ' | 'shift'