import * as Phaser from 'phaser-ce'
import {FONT_NUMBERS_WHITE_KEY} from '../SpriteManager'
import * as i18n from '../i18n'
import * as scaling from '../scaling'
import Sign from '../entities/Sign'
import BaseState from './BaseState'

export default class StartMenu extends BaseState {
    _buttonSounds: Phaser.Sound[]

    _bg: Phaser.Sprite
    _sign: Sign
    _hungryText: Phaser.BitmapText
    _puffinText: Phaser.BitmapText

    init (bg?: Phaser.Sprite) {
        this._bg = bg
        this._sign = new Sign(this.game, this.sprites)
    }

    create () {
        this._buttonSounds = [this.add.sound('button1'), this.add.sound('button2')]

        if (!this._bg) {
            this._bg = this.sprites.add(this.game.width / 2, this.game.height, 'bg/cover')
            this.sprites.setupBackgroundSprite(this._bg)
        }

        let fontSize = 70
        let yRatio = 0.05
        let font = FONT_NUMBERS_WHITE_KEY
        this._hungryText = this.game.add.bitmapText(this.game.width / 2, this.game.height * yRatio, font, 'Hungry', fontSize * scaling.totalScale)
        this._puffinText = this.game.add.bitmapText(this.game.width / 2, this._hungryText.bottom, font, 'Puffin', fontSize * scaling.totalScale)
        this._hungryText.anchor.x = 0.6
        this._puffinText.anchor.x = 0.35

        this._sign.addSignPost(
            i18n.get(i18n.NewGame), () => this._actionOnClick('Interim'),
            i18n.get(i18n.Credits), () => this._actionOnClick('Credits'))
    }

    _actionOnClick (state: string) {
        this.rnd.pick(this._buttonSounds).play()
        this._sign.destroy()
        this._hungryText.destroy()
        this._puffinText.destroy()
        this.game.state.start(state, false, false, this._bg)
        delete this._bg
    }
}
