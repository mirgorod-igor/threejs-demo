declare module animation {
    type State = 'ground' | 'hanging'
    type Action = 'idle' | 'walking' | 'running' | 'jump' | 'braced_hang_drop' | 'idle_to_braced_hang'
}