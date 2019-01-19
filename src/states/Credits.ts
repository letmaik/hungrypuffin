import * as Phaser from 'phaser-ce'
import {FONT_NUMBERS_KEY as Font, FONT_NUMBERS_DOWN_KEY as FontDown} from '../SpriteManager'
import * as i18n from '../i18n'
import * as scaling from '../scaling'
import Sign from '../entities/Sign'
import BaseState from './BaseState'

const TextPoweredBy = 'Powered by'
const TextPhaser = 'Phaser CE'
const TextGithub = `GitHub:`
const TextGithubURL = 'letmaik/hungrypuffin'

export default class Credits extends BaseState {
    _buttonSounds: Phaser.Sound[]

    _bg: Phaser.Sprite
    _scroll: Phaser.Sprite
    _phaserText: Phaser.BitmapText
    _poweredByText: Phaser.BitmapText
    _githubText: Phaser.BitmapText
    _githubURLText: Phaser.BitmapText
    _sign: Sign

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

        let centerX = 0.5 * this.game.width

        this._scroll = this.sprites.add(centerX, 30 * scaling.totalScale, 'ui/scroll')

        let scrollScale = Math.min(scaling.aspectRatio - 0.65, 1)
        this._scroll.scale.multiply(scrollScale, scrollScale)

        let refSprite = this._scroll

        this._poweredByText = this.add.bitmapText(centerX, refSprite.y + 0.24 * refSprite.height,
            Font, TextPoweredBy, 25 * scaling.totalScale * scrollScale)

        this._phaserText = this.add.bitmapText(centerX, refSprite.y + 0.41 * refSprite.height,
            Font, TextPhaser, 35 * scaling.totalScale * scrollScale)

        this._githubText = this.add.bitmapText(centerX, refSprite.y + 0.68 * refSprite.height,
            Font, TextGithub, 15 * scaling.totalScale * scrollScale)

        this._githubURLText = this.add.bitmapText(centerX, refSprite.y + 0.75 * refSprite.height,
            Font, TextGithubURL, 15 * scaling.totalScale * scrollScale)

        // open URL on click
        this._githubText.inputEnabled = this._githubURLText.inputEnabled = this._phaserText.inputEnabled = true
        this._githubText.events.onInputDown.add(this._onGithubDown, this)
        this._githubURLText.events.onInputDown.add(this._onGithubDown, this)
        this._githubText.events.onInputUp.add(this._onGithubUp, this)
        this._githubURLText.events.onInputUp.add(this._onGithubUp, this)
        this._phaserText.events.onInputDown.add(this._onPhaserDown, this)
        this._phaserText.events.onInputUp.add(this._onPhaserUp, this)

        refSprite.anchor.x = this._scroll.anchor.x = this._poweredByText.anchor.x = this._phaserText.anchor.x =
            this._githubText.anchor.x = this._githubURLText.anchor.x = 0.5

        this._sign.addSignPost(i18n.get(i18n.Back), () => this._actionOnClick('StartMenu'))
    }

    _onGithubDown () {
        this._githubText.font = FontDown
        this._githubURLText.font = FontDown
    }

    _onGithubUp () {
        this._githubText.font = Font
        this._githubURLText.font = Font
        window.open('https://github.com/letmaik/hungrypuffin', '_blank')
    }

    _onPhaserDown () {
        this._phaserText.font = FontDown
    }

    _onPhaserUp () {
        this._phaserText.font = Font
        window.open('https://phaser.io', '_blank')
    }

    _actionOnClick (state: string) {
        this.rnd.pick(this._buttonSounds).play()
        this._sign.destroy()
        this._scroll.destroy()
        this._phaserText.destroy()
        this._poweredByText.destroy()
        this._githubText.destroy()
        this._githubURLText.destroy()
        this.game.state.start(state, false, false, this._bg)
        delete this._bg
    }
}
