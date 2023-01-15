/* @refresh reload */
import {render} from 'solid-js/web'

import App from './App'
import './GL'

import './index.sass'

const root = document.getElementById('root') as HTMLElement
render(() => <App/>, root)

