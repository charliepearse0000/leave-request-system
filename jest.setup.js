import '@testing-library/jest-dom'
import 'whatwg-fetch'
import { runAxe, formatViolations } from './src/test-utils/axe-helper'

global.runAxe = runAxe
global.formatViolations = formatViolations