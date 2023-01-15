declare module animation {
    type State = 'idle' | 'hanging' | 'running'
    type Action = 'idle' | 'walk' | 'running' | 'braced_hang_drop' | 'idle_to_braced_hang'
}