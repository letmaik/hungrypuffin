import * as Phaser from 'phaser-ce'
import {PuffinStartAnimation, AUDIO_EXT} from '../constants'
import {Group, FONT_KEY, ATLASES} from '../SpriteManager'
import * as i18n from '../i18n'
import * as scaling from '../scaling'
import Sign from '../entities/Sign'
import BaseState from './BaseState'

const preloadMinimum = 3000
const loadingTextFontSize = 20

export default class Interim extends BaseState {
    _preloadStart: number
    _buttonSounds: Phaser.Sound[]
    _bg: Phaser.Sprite
    _sign: Sign

    loadingBarEmpty: Phaser.Sprite
    loadingBarFull: Phaser.Sprite
    loadingText: Phaser.BitmapText

    _firstInit = true

    loadingDone: boolean
    preloadTimeReached: boolean

    init (bg?: Phaser.Sprite) {
        this._sign = null
        this._bg = bg
        this.loadingDone = false
        this.preloadTimeReached = false
    }

    preload () {
        this._preloadStart = this.time.now

        if (!this._bg) {
            this._bg = this.sprites.add(this.game.width / 2, this.game.height, 'bg/cover')
            this.sprites.setupBackgroundSprite(this._bg)
        }

        let loadingBarPrefix = 'ui/loading-bar-'
        let loadingBarSize = this.sprites.getSize(loadingBarPrefix + 'empty')

        let loadingY = this.game.height * 0.75
        let loadingText = this.add.bitmapText(this.game.width / 2, loadingY + loadingBarSize.h + 5 * scaling.totalScale, FONT_KEY, i18n.get(i18n.Loading), loadingTextFontSize * scaling.totalScale)
        loadingText.anchor.x = 0.5

        let loadingBarEmpty = this.sprites.add((this.game.width - loadingBarSize.w) / 2, loadingY, loadingBarPrefix + 'empty')
        let loadingBarFull = this.sprites.add(loadingBarEmpty.x, loadingBarEmpty.y, loadingBarPrefix + 'full')
        this.loadingBarEmpty = loadingBarEmpty
        this.loadingBarFull = loadingBarFull
        this.loadingText = loadingText
        loadingBarFull.crop(new Phaser.Rectangle(0, 0, 0, loadingBarEmpty.height / this.sprites.dynamicScale), false)
        this.add.tween(loadingBarFull.cropRect)
            .to({width: loadingBarSize.w / this.sprites.dynamicScale}, preloadMinimum, null, true)
            .onUpdateCallback(() => loadingBarFull.updateCrop())
            .onComplete.add(() => {
                this.preloadTimeReached = true
                this.hideLoadingBarAndDisplayButton()
            }, this)

        this.sprites.preloadGameAssets()

        this.load.path = 'assets/audio/'
        this.load
            .audio('splash', 'splash' + AUDIO_EXT)
            .audio('food_reward', 'food_reward' + AUDIO_EXT)
            .audio('yellow_sandeel', 'yellow_sandeel' + AUDIO_EXT)
            .audio('kamikaze_seagull', 'kamikaze_seagull' + AUDIO_EXT)
            .audio('puffin_dies_hit_by_shark', 'puffin_hit_by_shark' + AUDIO_EXT)
            .audio('puffin_hit_by_seagull', 'puffin_hit_by_seagull' + AUDIO_EXT)
            .audio('game_win', 'game_win' + AUDIO_EXT)
            .audio('game_music', 'game_music' + AUDIO_EXT)

    }

    hideLoadingBarAndDisplayButton () {
        if (!this.loadingDone || !this.loadingBarEmpty) {
            return
        }
        this.loadingBarEmpty.destroy()
        this.loadingBarFull.destroy()
        this.loadingText.destroy()
        this._addButton()
        this.loadingBarEmpty = this.loadingBarFull = this.loadingText = null
    }

    create () {
        this._buttonSounds = [this.add.sound('button1'), this.add.sound('button2')]

        if (this._firstInit) {
            this._firstInit = false
            this.sprites.addGroup(Group.BGFixed)
            this.sprites.addGroup(Group.BGClouds, true)
            this.sprites.addGroup(Group.BGMountains, true)
            this.sprites.addGroup(Group.BGSunReflections, true)
            this.sprites.addGroup(Group.BGSeaSurface, true)
            this.sprites.addGroup(Group.BGIslandSignText, true)
            this.sprites.addGroup(Group.BGSeaBackRocks, true)
            this.sprites.addGroup(Group.BGSeaFloor, true)
            this.sprites.addGroup(Group.BGSeaStuff, true)
            this.sprites.addGroup(Group.DeadFlies).fixedToCamera = true
            this.sprites.addGroup(Group.DeadSandeels).fixedToCamera = true
            this.sprites.addGroup(Group.Splashes)
            this.sprites.addGroup(Group.Waves, true)
            this.sprites.addGroup(Group.Seagulls, true)
            this.sprites.addGroup(Group.Flies, true)
            this.sprites.addGroup(Group.Sharks, true)
            this.sprites.addGroup(Group.Puffin, true)
            this.sprites.addGroup(Group.UI)

            this._makePuffin()
            this._makeSplash()

            this.game.renderer.setTexturePriority(ATLASES)
        }

        this.loadingDone = true
        if (this.preloadTimeReached) {
            this.hideLoadingBarAndDisplayButton()
        }
    }

    private _makePuffin () {
        let sizes = ['S', 'M', 'L']
        let animations = [
            'float', 'float-blink', 'float2swim', 'float2vomit',
            'fly', 'fly-blink', 'fly2float', 'fly2vomit',
            'swim', 'swim-blink',
            'vomit'
        ]
        let lastFrame = name => {
            if (name.indexOf('2') !== -1) return 5
            else if (name === 'vomit') return 30
            else return 10
        }
        let loop = name => ['float', 'fly', 'swim'].indexOf(name) !== -1

        let puffin = this.sprites.make(PuffinStartAnimation, 0)
        puffin.anchor = new Phaser.Point(0.5, 0.5)
        for (let size of sizes) {
            for (let animation of animations) {
                this.sprites.addAnimation(puffin, `puffin/${size}/${animation}`, lastFrame(animation), animation === 'vomit' ? 30 : 20, loop(animation))
            }
        }
    }

    private _makeSplash () {
        let splash = this.sprites.make('splash', 1)
        splash.anchor.x = 0.5
        splash.anchor.y = 1
        let splashFps = 40
        let splashAnim = this.sprites.addAnimation(splash, 'splash', 9, splashFps, false)
        splash.animations.currentAnim = splashAnim
        splashAnim.killOnComplete = true
        // warm up
        splashAnim.play()
    }

    _addButton () {
        this._sign = new Sign(this.game, this.sprites)
        this._sign.addSignPost(i18n.get(i18n.Play), () => this._actionOnClick('Play'))
    }

    _actionOnClick (state: string) {
        this.rnd.pick(this._buttonSounds).play()
        this._sign.destroy()
        this._bg.destroy()
        delete this._bg
        this.game.state.start(state, false, false)
    }

}
