import * as Phaser from 'phaser-ce'
import {AUDIO_EXT} from '../constants'
import StartMenu from './StartMenu'
import Credits from './Credits'
import Interim from './Interim'
import GameOver from './GameOver'
import Play from './Play'
import WithDebug from './WithDebug'
import BaseState from './BaseState'
import SpriteManager from '../SpriteManager'

export default class Boot extends Phaser.State {

    sprites: SpriteManager

    init () {
        this.sprites = new SpriteManager(this.game)
    }

    preload () {
        this.sprites.preloadUIAssets()

        this.load.path = 'assets/audio/'
        this.load
            .audio('button1', 'button1' + AUDIO_EXT)
            .audio('button2', 'button2' + AUDIO_EXT)
    }

    create () {
        this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL
        //#if _DEBUG
        this.game.state.add('Play', this._createState(!this.game.device.cocoonJS ? WithDebug(Play) : Play))
        /*#else
        this.game.state.add('Play', this._createState(Play))
        //#endif */

        this.game.state.add('StartMenu', this._createState(StartMenu))
        this.game.state.add('Credits', this._createState(Credits))
        this.game.state.add('Interim', this._createState(Interim))
        this.game.state.add('GameOver', this._createState(GameOver))

        this.game.state.start('StartMenu', false, false)
    }

    private _createState (clazz: typeof BaseState) {
        let instance = new clazz()
        instance.sprites = this.sprites
        return instance
    }
}


