import * as Phaser from 'phaser-ce'
import {default as SpriteManager, FONT_KEY, FONT_DOWN_KEY} from '../SpriteManager'
import * as i18n from '../i18n'
import * as scaling from '../scaling'

const VeryBigFontSize = 30
const BigFontSize = 22
const SmallFontSize = 16

export default class Sign {
    buttonRight: Phaser.Button
    buttonLeft: Phaser.Button
    buttonLeftTop: Phaser.Button
    buttonStick: Phaser.Sprite
    buttonRightText: Phaser.BitmapText
    buttonLeftText: Phaser.BitmapText
    buttonLeftTopText: Phaser.BitmapText

    constructor (private game: Phaser.Game, private sprites: SpriteManager) {
    }

    addOnDownHandler (button: Phaser.Button, text: Phaser.BitmapText) {
        button.events.onInputDown.add(() => text.font = FONT_DOWN_KEY)
        button.events.onInputUp.add(() => text.font = FONT_KEY)
    }

    addSignPost (rightText: string, rightClick: Function, leftText?: string, leftClick?: Function) {
        this.buttonStick = this.sprites.add(this.game.width * 0.7, this.game.height * 0.97, 'ui/sign-base')
        this.buttonStick.anchor.x = 0.5
        this.buttonStick.anchor.y = 1
        let h = this.buttonStick.height
        let top = this.buttonStick.y - h

        let y = leftText ? top + 0.05 * h : top + 0.2 * h
        this.buttonRight = this.sprites.addButton(this.buttonStick.x, y, 'ui/sign-right', null, rightClick, null)
        this.buttonRight.anchor.x = 0.4
        let maxLettersVeryBigFont = i18n.language === i18n.Chinese ? 3 : 5
        let fontSizeRight = (rightText.length <= maxLettersVeryBigFont ? VeryBigFontSize : BigFontSize) * scaling.totalScale
        this.buttonRightText = this.game.add.bitmapText(this.buttonRight.x, this.buttonRight.y + this.buttonRight.height / 2, FONT_KEY, rightText, fontSizeRight)
        this.buttonRightText.fixedToCamera = true
        this.buttonRightText.anchor.x = this.buttonRight.anchor.x + 0.05
        this.buttonRightText.anchor.y = 0.5
        this.addOnDownHandler(this.buttonRight, this.buttonRightText)

        if (leftText) {
            this.buttonLeft = this.sprites.addButton(this.buttonStick.x, top + 0.51 * h, 'ui/sign-left', null, leftClick, null)
            this.buttonLeft.anchor.x = 0.65
            let fontSizeLeft = SmallFontSize * scaling.totalScale
            this.buttonLeftText = this.game.add.bitmapText(this.buttonLeft.x, this.buttonLeft.y + this.buttonLeft.height / 2, FONT_KEY, leftText, fontSizeLeft)
            this.buttonLeftText.fixedToCamera = true
            this.buttonLeftText.anchor.x = this.buttonLeft.anchor.x
            this.buttonLeftText.anchor.y = 0.5
            this.addOnDownHandler(this.buttonLeft, this.buttonLeftText)
        }
    }

    addLeftTopSign (text: string, onClick: Function) {
        let sprite = 'ui/sign-right'
        let {w,h} = this.sprites.getSize(sprite)
        this.buttonLeftTop = this.sprites.addButton(this.game.width * 0.05 + w / 2, this.buttonLeft.top - h * 0.7, sprite, null, onClick, null)
        this.buttonLeftTop.angle = 180
        this.buttonLeftTop.anchor.x = this.buttonLeftTop.anchor.y = 0.5
        let fontSizeBottom = BigFontSize * scaling.totalScale
        this.buttonLeftTopText = this.game.add.bitmapText(this.buttonLeftTop.x, this.buttonLeftTop.y, FONT_KEY, text, fontSizeBottom)
        this.buttonLeftTopText.anchor.y = 0.5
        this.buttonLeftTopText.anchor.x = 0.3
        this.buttonLeftTopText.fixedToCamera = true
        this.addOnDownHandler(this.buttonLeftTop, this.buttonLeftTopText)
    }

    addLeftSign (text: string, onClick: Function) {
        let sprite = 'ui/sign-right'
        let {w,h} = this.sprites.getSize(sprite)
        this.buttonLeft = this.sprites.addButton(this.game.width * 0.05 + w / 2, this.game.height * 0.95 - h / 2, sprite, null, onClick, null)
        this.buttonLeft.angle = 180
        this.buttonLeft.anchor.x = this.buttonLeft.anchor.y = 0.5
        let fontSizeBottom = BigFontSize * scaling.totalScale
        this.buttonLeftText = this.game.add.bitmapText(this.buttonLeft.x, this.buttonLeft.y, FONT_KEY, text, fontSizeBottom)
        this.buttonLeftText.anchor.y = 0.5
        this.buttonLeftText.anchor.x = 0.3
        this.buttonLeftText.fixedToCamera = true
        this.addOnDownHandler(this.buttonLeft, this.buttonLeftText)
    }

    addRightSign (text: string, onClick: Function) {
        let sprite = 'ui/sign-right'
        let {w,h} = this.sprites.getSize(sprite)
        this.buttonRight = this.sprites.addButton(this.game.width * 0.95 - w / 2, this.game.height * 0.95 - h / 2, sprite, null, onClick, null)
        this.buttonRight.anchor.x = this.buttonRight.anchor.y = 0.5
        let fontSizeBottom = BigFontSize * scaling.totalScale
        this.buttonRightText = this.game.add.bitmapText(this.buttonRight.left + w * 0.13, this.buttonRight.y, FONT_KEY, text, fontSizeBottom)
        this.buttonRightText.anchor.y = 0.5
        this.buttonRightText.anchor.x = 0
        this.buttonRightText.fixedToCamera = true
        this.addOnDownHandler(this.buttonRight, this.buttonRightText)
    }

    destroy () {
        if (this.buttonStick) {
            this.buttonStick.destroy()
        }
        if (this.buttonRight) {
            this.buttonRight.destroy()
            this.buttonRightText.destroy()
        }
        if (this.buttonLeft) {
            this.buttonLeft.destroy()
            this.buttonLeftText.destroy()
        }
        if (this.buttonLeftTop) {
            this.buttonLeftTop.destroy()
            this.buttonLeftTopText.destroy()
        }
    }
}
