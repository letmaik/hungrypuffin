//#if _DEBUG
const $_LOG = console.log.bind(console)
//#else
//#set _LOG '//'
//#endif

import * as Phaser from 'phaser-ce'
import * as i18n from './i18n'
import * as scaling from './scaling'

const BasePath = 'assets/'

export enum Group {
    BGFixed,
    BGMountains,
    BGClouds,
    BGSunReflections,
    BGSeaSurface,
    BGIslandSignText,
    BGSeaFloor,
    BGSeaBackRocks,
    BGSeaStuff,
    Puffin,
    UI,
    DeadFlies,
    DeadSandeels,
    Splashes,
    Waves,
    Seagulls,
    Flies,
    Sharks
}

const UIAtlas = 'ui'
const BGAtlas = 'bg'

export const ATLASES = [
    'eel',
    'fly',
    'shark',
    'puffin',
    'seagull',
    'waves',
    'splash',
    'static',
    UIAtlas,
    BGAtlas
]

const FONT = 'permanent-marker'
const FONT_WHITE = 'permanent-marker-white'
const FONT_ZH = 'noto-sans-chinese'
const FONT_GR = 'chalkboard-se-greek'
const FONT_DOWN_SUFFIX = '-down'

export const FONT_KEY = 'font'
export const FONT_DOWN_KEY = FONT_KEY + FONT_DOWN_SUFFIX
export let FONT_NUMBERS_KEY = FONT_KEY
export let FONT_NUMBERS_DOWN_KEY = FONT_DOWN_KEY
export let FONT_NUMBERS_WHITE_KEY = FONT_KEY + '-white'

/**
 * Bounding box of physics bodies for collision purposes.
 *
 * Maps from sprite name to an array [x,y,w,h].
 * Coordinates are in 1x scale.
 */
let BODIES = {
    'puffin': [100, 57, 30, 30],
    'seagull': [20, 20, 60, 19],
    'shark': [20, 4, 90, 30],
    'fly': [7, 7, 23, 20]
}
let eelInSand = [4, 8, 12, 10]
let eelInAmphora = [7, 7, 10, 14]
export const SandeelBlue = 'blue'
export const SandeelGreen = 'green'
export const SandeelYellow = 'yellow'
export const SandeelColors = [SandeelBlue, SandeelGreen, SandeelYellow]
export const SandeelColorsBlueGreen = [SandeelBlue, SandeelGreen]
for (let sandAnimIdx of [1, 2]) {
    for (let color of SandeelColors) {
        BODIES[`eel/${color}/${sandAnimIdx}`] = eelInSand
    }
}
for (let color of SandeelColors) {
    BODIES[`eel/${color}/3`] = eelInAmphora
}

function getAtlas (frameName) {
    let atlas = ATLASES.filter(name => frameName.indexOf(name) === 0)
    return atlas[0]
}

export default class SpriteManager {
    DPR: number
    fixedScale: number
    dynamicScale: number
    _imgPath: string
    _fontPath: string
    private _sprites: { [name: string]: Phaser.Sprite } = {}
    private _groups: { [name: string]: Phaser.Group } = {}

    _gameAssetsPreloaded: boolean
    _uiAssetsPreloaded: boolean

    constructor (private _game: Phaser.Game) {
        this.DPR = scaling.DPR
        this.fixedScale = scaling.fixedScale
        this.dynamicScale = scaling.dynamicScale
        this._imgPath = BasePath + 'img@' + this.fixedScale + 'x/'
        this._fontPath = BasePath + 'font@' + this.fixedScale + 'x/'
    }

    preloadGameAssets () {
        if (this._gameAssetsPreloaded) {
            return
        }
        this._gameAssetsPreloaded = true
        this._game.load.path = this._imgPath
        for (let atlas of ATLASES) {
            if (atlas === UIAtlas || atlas === BGAtlas) {
                // already loaded by preloadUIAssets
                continue
            }
            this._game.load.atlas(atlas)
        }
    }

    preloadUIAssets () {
        if (this._uiAssetsPreloaded) {
            return
        }
        this._uiAssetsPreloaded = true
        this._game.load.path = this._imgPath
        this._game.load
            .atlas(UIAtlas)
            .atlas(BGAtlas)

        this._game.load.path = this._fontPath
        if (i18n.language === i18n.Chinese || i18n.language === i18n.Greek) {
            let fontI18n = i18n.language === i18n.Chinese ? FONT_ZH : FONT_GR
            FONT_NUMBERS_KEY = 'font-numbers'
            FONT_NUMBERS_DOWN_KEY = 'font-numbers-down'
            this._game.load
                .bitmapFont(FONT_NUMBERS_KEY, FONT + '.png', FONT + '.json')
                .bitmapFont(FONT_NUMBERS_DOWN_KEY, FONT + FONT_DOWN_SUFFIX + '.png', FONT + FONT_DOWN_SUFFIX + '.json')
                .bitmapFont(FONT_KEY, fontI18n + '.png', fontI18n + '.json')
                .bitmapFont(FONT_DOWN_KEY, fontI18n + FONT_DOWN_SUFFIX + '.png', fontI18n + FONT_DOWN_SUFFIX + '.json')
        } else {
            this._game.load
                .bitmapFont(FONT_KEY, FONT + '.png', FONT + '.json')
                .bitmapFont(FONT_DOWN_KEY, FONT + FONT_DOWN_SUFFIX + '.png', FONT + FONT_DOWN_SUFFIX + '.json')
        }
        this._game.load
            .bitmapFont(FONT_NUMBERS_WHITE_KEY, FONT_WHITE + '.png', FONT_WHITE + '.json')
    }

    getSize (key) {
        let frame = this._game.cache.getFrameByName(getAtlas(key), key)
        return { h: frame.sourceSizeH * this.dynamicScale, w: frame.sourceSizeW * this.dynamicScale }
    }

    getFirstDead (group: Phaser.Group, x: number, y: number, spriteName: string, frame?: number) {
        let suffix = frame !== undefined ? '/' + frame : ''
        let sprite: Phaser.Sprite = group.getFirstDead(true, x, y, getAtlas(spriteName), spriteName  + suffix)
        this._setupSprite(sprite, spriteName)
        return sprite
    }

    make (spriteName: string, frame?: number) {
        let suffix = frame !== undefined ? '/' + frame : ''
        let sprite = this._game.make.sprite(0, 0, getAtlas(spriteName), spriteName + suffix)
        this._setupSprite(sprite, spriteName)
        this._sprites[spriteName] = sprite
        return sprite
    }

    get (spriteName: string) {
        return this._sprites[spriteName]
    }

    addGroup (id: Group, physics = false) {
        let group = this._game.add.group()
        group.name = Group[id]
        if (physics) {
            group.enableBody = true
            group.physicsBodyType = Phaser.Physics.ARCADE
        }
        this._groups[id] = group
        return group
    }

    getGroup (name: number) {
        return this._groups[name]
    }

    add (x: number, y: number, spriteName: string, group?: Phaser.Group, frame?: number | string) {
        let suffix = frame !== undefined ? '/' + frame : ''
        let sprite = this._game.add.sprite(x, y, getAtlas(spriteName), spriteName + suffix, group)
        this._setupSprite(sprite, spriteName)
        return sprite
    }

    addButton (x: number, y: number, sprite: string, spriteDown: string, onClick: Function, context?: any) {
        let button = this._game.add.button(x, y, getAtlas(sprite), onClick, context, null, sprite, spriteDown, spriteDown ? sprite : null)
        button.fixedToCamera = true
        button.scale.set(this.dynamicScale)
        return button
    }

    addAnimation (sprite: Phaser.Sprite, name: string, lastFrame: number, fps: number, loop=true) {
        let existingAnimation = sprite.animations.getAnimation(name)
        if (existingAnimation) {
            return existingAnimation
        }
        let frames = Phaser.Animation.generateFrameNames(name + '/', 1, lastFrame)
        let animation = sprite.animations.add(name, frames, fps, loop)
        return animation
    }

    renderBodies (group: Phaser.Group) {
        group.forEachAlive(sprite => {
            this._game.debug.body(sprite)
        }, null)
    }

    private _setupSprite (sprite: Phaser.Sprite, spriteName: string) {
        sprite.scale.set(this.dynamicScale)
        let atlasName = getAtlas(spriteName)
        let size = BODIES[spriteName] || BODIES[atlasName]
        if (size) {
            this._game.physics.arcade.enable(sprite)
            let body: Phaser.Physics.Arcade.Body = sprite.body
            let scale = this.fixedScale
            body.setSize(size[2] * scale, size[3] * scale, size[0] * scale, size[1] * scale)
        }
    }

    setupBackgroundSprite (sprite: Phaser.Sprite) {
        sprite.anchor.x = 0.5
        sprite.anchor.y = 1
        let ratio = sprite.width / sprite.height
        let screenRatio = this._game.width / this._game.height
        if (ratio < screenRatio) {
            sprite.width = this._game.width
            sprite.height = sprite.width / ratio
        } else {
            sprite.height = this._game.height
            sprite.width = sprite.height * ratio
        }
    }
}
