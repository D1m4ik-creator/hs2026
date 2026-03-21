import './index.css'
import { createApp } from './app.js'
import { runBlockTests } from './tests/block-tests.js'

const root = document.getElementById('root')

if (!root) {
  throw new Error('Root container "#root" was not found.')
}

window.runTtkBlockTests = runBlockTests
runBlockTests()

createApp(root).start()
