import React from 'react'
import {render} from 'react-dom'
import App from './components/App'

document.title = 'Arborea'

const root = document.createElement('div')
root.id = "root"
document.body.appendChild(root)

render(<App />, root)
