import * as Phaser from 'phaser-ce'
import {FONT_KEY, FONT_NUMBERS_KEY} from '../SpriteManager'
import * as player from '../player'
import * as i18n from '../i18n'
import * as scaling from '../scaling'
import Sign from '../entities/Sign'
import BaseState from './BaseState'

const CENTER_ANCHOR = new Phaser.Point(0.5, 0.5)

export default class GameOver extends BaseState {
    _playButton: Phaser.Button
    _buttonSounds: Phaser.Sound[]
    _scoreText: Phaser.BitmapText
    _gameOverText: Phaser.BitmapText
    _signHanging: Phaser.Sprite
    _sign: Sign
    _camPos: Phaser.Point

    init (cameraPos: Phaser.Point) {
        this._camPos = cameraPos
        this._sign = new Sign(this.game, this.sprites)
    }

    preload () {
        // restore game camera position, otherwise it would be reset to 0,0
        this.camera.setPosition(this._camPos.x, this._camPos.y)
    }

    create () {
        this._buttonSounds = [this.add.sound('button1'), this.add.sound('button2')]

        // sign
        this._signHanging = this.sprites.add(this.game.width / 2, this.game.height * 0.1, 'ui/sign-hanging')
        this._signHanging.fixedToCamera = true
        this._signHanging.anchor.x = CENTER_ANCHOR.x

        // game over text
        let gameOverFont = i18n.language === i18n.Chinese ? FONT_KEY : FONT_NUMBERS_KEY
        let fontSizeGameOver = 40 * scaling.totalScale
        let text = i18n.get(i18n.GameOver)
        let gameOverText = this.add.bitmapText(0.5 * this.game.width, this._signHanging.y + 0.4 * this._signHanging.height, gameOverFont, text, fontSizeGameOver)
        gameOverText.anchor = CENTER_ANCHOR.clone()
        gameOverText.fixedToCamera = true
        this._gameOverText = gameOverText

        // score text
        let fontSizeScore = 60 * scaling.totalScale
        let score = player.score.toString()
        let scoreText = this.add.bitmapText(0.5 * this.game.width, this._signHanging.y + 0.7 * this._signHanging.height, FONT_NUMBERS_KEY, score, fontSizeScore)
        scoreText.anchor = CENTER_ANCHOR.clone()
        scoreText.fixedToCamera = true
        this._scoreText = scoreText

        // play button
        this._sign.addRightSign(i18n.get(i18n.PlayAgain), () => this._onPlayButtonClick())
    }

    _onPlayButtonClick () {
        this.rnd.pick(this._buttonSounds).play()
        this.game.state.start('Play', false, false)
        this._removeUI()
    }

    _removeUI () {
        this._sign.destroy()
        this._signHanging.destroy()
        this._scoreText.destroy()
        this._gameOverText.destroy()
    }
}
