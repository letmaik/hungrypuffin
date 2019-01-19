//#if _DEBUG
const $_LOG = console.log.bind(console)
//#else
//#set _LOG '//'
//#endif

import 'es6-promise/auto'
import * as Phaser from 'phaser-ce'
import {IsIOS} from './constants'
import * as scaling from './scaling'
import * as i18n from './i18n'
import Boot from './states/Boot'

scaling.setUp(document.getElementById('game') || window)
i18n.setUp()

// use Canvas for iOS as that's faster with Safari
let mode = IsIOS ? Phaser.CANVAS : Phaser.WEBGL_MULTI

let game = new Phaser.Game(scaling.canvasWidth, scaling.canvasHeight, mode, 'game')
game.state.add('Boot', Boot, true)
