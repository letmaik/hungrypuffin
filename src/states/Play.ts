//#if _DEBUG
const $_LOG = console.log.bind(console)
//#else
//#set _LOG '//'
//#endif

import * as Phaser from 'phaser-ce'
import {ISPHONE, PuffinInAir, PuffinInWater, Points, SeagullFrequency, PuffinStartAnimation, PuffinTapTimeout, WaveSpeed,
    BackgroundFrontSpeed, SandeelFrequency, SeagullStartDelay, PuffinSize, GameDuration, SandeelYellowPercentage,
    UnderwaterSpeed, PuffinWeightThreshold, SeagullVFormationAfter, SeagullVFormationPercentage,
    SeagullKamikazeAfter, SeagullKamikazeScaling, SeagullWallOfDeathAfter, SeagullWallOfDeathPercentage} from '../constants'
import Sharks from '../entities/Sharks'
import Flies from '../entities/Flies'
import Background from '../entities/Background'
import {Group, FONT_NUMBERS_KEY, SandeelColors, SandeelYellow, SandeelColorsBlueGreen }
    from '../SpriteManager'
import * as player from '../player'
import * as scaling from '../scaling'
import BaseState from './BaseState'

/** How much screen space the sky (water) is taking up when at the top or bottom */
const SKY_SCREEN_RATIO = 0.7 // NOTE: don't change this without also changing SKY_PHYSICS_SCREEN_RATIO!
const WATER_SCREEN_RATIO = 0.65
/** The boundary used for inverting gravity etc. */
const SKY_PHYSICS_SCREEN_RATIO = 0.67 // NOTE: don't change this without also changing SKY_SCREEN_RATIO!

export const CENTER_ANCHOR = new Phaser.Point(0.5, 0.5)

enum Substance {
    Air,
    Water
}

enum PuffinState {
    Fly,
    Float,
    Vomit,
    Swim
}

enum PuffinTransition {
    Fly2Float,
    Float2Fly,
    Swim2Float,
    Float2Swim,
    Float2Vomit,
    Fly2Vomit,
    Vomit2Float
}

export default class Play extends BaseState {

    // stats
    _countSandeelsEaten: {[color: string]: number} = {}
    _countFliesEaten: number
    _countSeagullHits: number

    _coastDisplaying: boolean
    _coastReached: boolean
    _coastBonusReceived: boolean

    _firstInit = true

    _physicsScale: number

    _splashesGroup: Phaser.Group
    _deadFliesGroup: Phaser.Group
    _deadSandeelsGroup: Phaser.Group
    _seagullsGroup: Phaser.Group
    _sandeelsCollisionGroup: Phaser.Sprite[]
    _puffinGroup: Phaser.Group
    _uiGroup: Phaser.Group
    _groupsToFreeze: Phaser.Group[]
    _groupsToReset: Phaser.Group[]

    _velocityChangingGroups: Phaser.Group[]

    _velocityFactor: number
    _targetVelocityFactor: number

    _sharks: Sharks
    _flies: Flies
    _background: Background

    _puffin: Phaser.Sprite
    _puffinBody: Phaser.Physics.Arcade.Body
    _puffinSize: 'S' | 'M' | 'L'
    _previousPuffinState: PuffinState

    _puffinAnimation: Phaser.Animation
    _puffinRotateWaterTween: Phaser.Tween
    _puffinRotateAirTween: Phaser.Tween

    _splash: Phaser.Sprite
    _hasSplashed: boolean

    // milliseconds, but used as a distance measure (delta gets multiplied in each update() by velocityFactor)
    // slower = less "time" has passed
    _gameDuration: number

    _lastTapTime: number
    _timer: Phaser.Timer

    _substance: Substance

    _skyHeight: number
    _skyPhysicsHeight: number
    _waterHeight: number
    _totalHeight: number

    _seagullHeight: number

    _pointsText: Phaser.BitmapText
    _points: number

    _pointsPopupText: Phaser.BitmapText

    _DEBUG = false
    _musicOn = true

    /**
     * in air: oxygen fill up to 1 slowly
     * underwater: oxygen decreases slowly to 0; if 0 then user can't dive anymore and puffin floats up
     */
    _oxygen: number // 0-1

    _oxygenBarVisible: boolean
    _oxygenBarFull: Phaser.Sprite
    _oxygenBarEmpty: Phaser.Sprite
    _oxygenBarFlashAnimation: Phaser.Animation
    _oxygenBarPadding: number
    _oxygenBarInnerWidth: number
    _oxygenBarDeltaPerPx: number
    _oxygenBarLastValueUpdate: number
    _oxygenBarPuffinOffsetY: number
    _oxygenBarPuffinOffsetX: number

    _backgroundMusic: Phaser.Sound
    _splashSound: Phaser.Sound
    _foodRewardSound: Phaser.Sound
    _yellowSandeelSound: Phaser.Sound
    _kamikazeSeagullSound: Phaser.Sound
    _gameWinSound: Phaser.Sound
    _puffinDiesHitBySharkSound: Phaser.Sound
    _puffinHitBySeagullSound: Phaser.Sound

    _velocityModificationActive: boolean

    //#if _DEBUG
    __puffinTransition: PuffinTransition
    set _puffinTransition (val: PuffinTransition) {
        this.__puffinTransition = val
        $_LOG('transition:', PuffinTransition[val])
    }
    get _puffinTransition () {
        return this.__puffinTransition
    }

    __puffinState: PuffinState
    set _puffinState (val: PuffinState) {
        this.__puffinState = val
        $_LOG('state:', PuffinState[val])
    }
    get _puffinState () {
        return this.__puffinState
    }
    /*#else
    _puffinTransition: PuffinTransition
    _puffinState: PuffinState
    //#endif */

    init () {
        if (this._firstInit) {
            this._firstInit = false
            this._doFirstInit()
        } else {
            this._restart()
        }
        this._gameDuration = 0

        this._substance = null

        this._puffinSize = PuffinSize.S
        this._previousPuffinState = PuffinState.Fly
        this._puffinState = PuffinState.Float
        this._puffinTransition = null

        this._hasSplashed = false

        this._lastTapTime = 0

        this._points = 0
        this._oxygen = 1
        this._oxygenBarVisible = false

        this._sandeelsCollisionGroup = []

        this._velocityFactor = 1
        this._targetVelocityFactor = 1

        this._velocityModificationActive = false

        this._countFliesEaten = 0
        this._countSeagullHits = 0
        for (let color of SandeelColors) {
            this._countSandeelsEaten[color] = 0
        }
        this._coastReached = false
        this._coastDisplaying = false
        this._coastBonusReceived = false
    }

    _doFirstInit () {
        this._physicsScale = scaling.physicsScale
        this._timer = this.time.events

        // these reference values make sure that the game doesn't behave or look differently, it is just scaled
        let referenceAspectRatio = 16 / 9 // iPhone >= 5
        let referenceHeight = this.game.width * referenceAspectRatio

        this._skyHeight = referenceHeight * SKY_SCREEN_RATIO
        this._skyPhysicsHeight = referenceHeight * SKY_PHYSICS_SCREEN_RATIO
        this._waterHeight = referenceHeight * WATER_SCREEN_RATIO
        this._totalHeight = this._skyHeight + this._waterHeight
        this.world.setBounds(0, 0, this.game.width, this._totalHeight)

        this._background = new Background(this.game, this.sprites, this._skyHeight, this._waterHeight)

        this._flies = new Flies(this.game, this.sprites, {
            top: 0,
            bottom: this._skyHeight * 0.9
        })

        this._sharks = new Sharks(this.game, this, this.sprites, {
            top: this._skyHeight + this._waterHeight * 0.1,
            bottom: this._skyHeight + this._waterHeight * 0.9
        })

        this._addAudio()

        this._seagullHeight = this.sprites.getSize('seagull/1').h

        this._uiGroup = this.sprites.getGroup(Group.UI)
        this._deadFliesGroup = this.sprites.getGroup(Group.DeadFlies)
        this._deadSandeelsGroup = this.sprites.getGroup(Group.DeadSandeels)
        this._splashesGroup = this.sprites.getGroup(Group.Splashes)
        this._seagullsGroup = this.sprites.getGroup(Group.Seagulls)
        this._puffinGroup = this.sprites.getGroup(Group.Puffin)

        this._background.init()
        this._flies.init()
        this._sharks.init()

        this._velocityChangingGroups = [this._seagullsGroup, this._sharks.group, this._flies.group]
        this._velocityChangingGroups.push(...this._background.groupsDynamic)

        this._groupsToFreeze = [
            this._splashesGroup, this._puffinGroup, this._seagullsGroup,
            this._flies.group, this._sharks.group, this._uiGroup]
        this._groupsToFreeze.push(...this._background.groupsDynamic)

        this._groupsToReset = [
            this._splashesGroup, this._deadFliesGroup, this._deadSandeelsGroup, this._uiGroup,
            this._seagullsGroup, this._flies.group, this._sharks.group]
        this._groupsToReset.push(...this._background.groupsDynamic)

        // show tapping instructions after dropping into the water
        this._timer.add(1700, () => {
            let x = this._puffin.x
            let y = this._puffin.top
            let tapIcon = this.sprites.add(x, y, 'ui/finger-tap', this._uiGroup)
            tapIcon.anchor.x = 0.5
            tapIcon.anchor.y = 0.4
            tapIcon.angle = 180
            let event = this._timer.loop(1, () => {
                tapIcon.y = this._puffin.top
            })
            let count = 11
            let i = 0
            this._timer.repeat(130, count, () => {
                tapIcon.visible = !tapIcon.visible
                if (++i === count) {
                    tapIcon.destroy()
                    this._timer.remove(event)
                }
            })
        })

        this.input.keyboard.addKey(Phaser.Keyboard.D).onDown.add(() => {
            this.game.debug.reset()
            this._DEBUG = !this._DEBUG
        })
        this.input.keyboard.addKey(Phaser.Keyboard.M).onDown.add(() => {
            this._musicOn = !this._musicOn
            if (!this._musicOn) {
                this._backgroundMusic.stop()
            } else {
                this._backgroundMusic.play()
            }
        })
    }

    _restart () {
        this._timer.start()
        // after a game over for example
        for (let group of this._groupsToReset) {
            group.forEachAlive(sprite => sprite.kill(), null)
        }
    }

    _freeze (onlyVelocity=false) {
        if (!onlyVelocity) {
            this._timer.stop(true)
        }
        this.input.onDown.remove(this._onTap, this)
        this.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR).onDown.remove(this._onTap, this)

        // stop all physics and animations
        if (!onlyVelocity) {
            this.tweens.removeAll()
        }
        for (let group of this._groupsToFreeze) {
            group.forEachAlive((sprite: Phaser.Sprite) => {
                $_LOG('freezing:', sprite.frameName, ', group:', group.name)
                let body: Phaser.Physics.Arcade.Body = sprite.body
                if (body) {
                    body.velocity.set(0)
                }
                sprite.lifespan = 0
                if (!onlyVelocity && sprite.animations) {
                    let anim = sprite.animations.currentAnim
                    if (anim) {
                        anim.stop(false, false)
                        anim.onComplete.removeAll()
                    }
                }
            }, null)
        }
        if (!onlyVelocity) {
            this._puffinBody.gravity.y = 0
        }
    }

    create () {
        if (this._musicOn) {
            this._backgroundMusic.play()
        }

        this._flies.create()
        this._sharks.create()
        this._background.create()
        this._addPuffin()
        this._addSplash()
        this._createSeagulls()
        this._createSandeels()
        this._createPointsText()
        this._createOxygenBar()
    }

    _addAudio () {
        this._backgroundMusic = this.add.sound('game_music', 1, true)
        this._splashSound = this.add.sound('splash')
        this._gameWinSound = this.add.sound('game_win')
        this._foodRewardSound = this.add.sound('food_reward')
        this._yellowSandeelSound = this.add.sound('yellow_sandeel')
        this._kamikazeSeagullSound = this.add.sound('kamikaze_seagull')
        this._puffinHitBySeagullSound = this.add.sound('puffin_hit_by_seagull')
        this._puffinDiesHitBySharkSound = this.add.sound('puffin_dies_hit_by_shark')
    }

    get _tapDelta () {
        return this.game.time.now - this._lastTapTime
    }

    update () {
        if (this._puffin.health === 0) {
            return
        }
        this._gameDuration += this.time.physicsElapsedMS * this._velocityFactor
        if (this._gameDuration > GameDuration) {
            if (!this._coastDisplaying) {
                this._coastDisplaying = true
                this._flies.stopSpawning = this._sharks.stopSpawning = true
                this._background.addCoast()
            } else if (this._background.coast.right <= this.game.width) {
                if (!this._coastReached) {
                    this._coastReached = true
                    // fly to coast automatically and disable any user input
                    this._freeze(true)
                    this._background.stopSpawning = true
                    this._puffinBody.velocity.x = BackgroundFrontSpeed * 1.5 * this._physicsScale
                } else if (!this._coastBonusReceived && this._puffin.right >= this.game.width * 0.80) {
                    this._coastBonusReceived = true
                    this._yellowSandeelSound.play()
                    this._updatePoints(Points.IslandReachedBonus)
                } else if (this._puffin.left >= this.game.width) {
                    this._die()
                } else if (this._substance === Substance.Air && this._puffin.y > this._skyHeight - this._background.seaTopHeight) {
                    // fly to coast automatically by virtual tapping
                    this._onTap()
                }
            }
        }

        let oxygenDelta
        if (this._puffin.y > this._skyPhysicsHeight) {
            this._switchToWater()
            oxygenDelta = this._insideFloatingZone() ? PuffinInAir.oxygenDelta : PuffinInWater.oxygenDelta
            // check if at bottom of sea, reverse velocity to make puffin float up
            if (this._puffin.y > this._totalHeight * 0.97) {
                this._puffinBody.velocity.y = PuffinInWater.topBumpVelocity
            }

            if (this._puffin.angle > PuffinInWater.minAngle) {
                this._puffin.angle -= PuffinInWater.deltaAngle
            }
        } else {
            this._switchToAir()
            oxygenDelta = PuffinInAir.oxygenDelta
            // check if at top of sky, reverse velocity to make puffin fly down
            if (this._puffin.y < this._totalHeight * 0.03) {
                this._puffinBody.velocity.y = PuffinInAir.topBumpVelocity
            }

            if (this._puffin.angle < PuffinInAir.maxAngle) {
                this._puffin.angle += PuffinInAir.deltaAngle
            }
        }
        this._updateOxygen(this.time.physicsElapsed * oxygenDelta)

        if ((this._puffinState === PuffinState.Fly || this._puffinState === PuffinState.Swim) && this._tapDelta > PuffinTapTimeout) {
            let anim: string
            let reverse: boolean
            let transition: PuffinTransition
            if (this._puffinState === PuffinState.Fly) {
                transition = PuffinTransition.Fly2Float
                anim = 'fly2float'
                reverse = false
            } else {
                transition = PuffinTransition.Swim2Float
                anim = 'float2swim'
                reverse = true
            }
            this._previousPuffinState = this._puffinState
            this._puffinState = PuffinState.Float
            this._puffinTransition = transition
            this._switchPuffinAnimation(anim, reverse).onComplete.addOnce(() => {
                if (this._puffinTransition === transition) {
                    this._puffinTransition = null
                    this._switchPuffinAnimation('float')
                }
            })
        }

        if (this._substance === Substance.Water) {
            this.physics.arcade.overlap(this._puffin, this._sandeelsCollisionGroup, this._onSandeelOverlap, null, this)
            this._sharks.overlap(this._puffin, this._onSharkOverlap, this)
        } else {
            this.physics.arcade.overlap(this._puffin, this._seagullsGroup, this._onSeagullOverlap, null, this)
            this._flies.overlap(this._puffin, this._onFlyOverlap, this)
            if (this._sharks.jumpingShark) {
                this._sharks.overlap(this._puffin, this._onSharkOverlap, this)
            }
        }

        this._background.update()
    }

    //#if _DEBUG
    render () {
        if (!ISPHONE && this._DEBUG) {
            this.sprites.renderBodies(this._puffinGroup)
            this.sprites.renderBodies(this._seagullsGroup)
            this.sprites.renderBodies(this._background.groupSeaStuff)
            this.sprites.renderBodies(this._sharks.group)
            this.sprites.renderBodies(this._flies.group)
        }
    }
    //#endif

    private _switchToWater () {
        if (this._substance !== Substance.Water) {
            $_LOG('WATER physics')
            this._substance = Substance.Water
            let justFloat = this._puffinState === PuffinState.Vomit || this._puffinBody.velocity.y / this._physicsScale < 400
            let factor = justFloat ? 0.20 : 1
            this._puffinBody.gravity.y = PuffinInWater.gravity[this._puffinSize] * this._physicsScale
            this._puffinBody.maxVelocity.y = factor * PuffinInWater.maxVelocity * this._physicsScale
            this._puffinBody.drag.y = PuffinInWater.drag * this._physicsScale
            this._puffinBody.acceleration.y = PuffinInWater.acceleration * this._physicsScale

            // display water splash
            if (!this._hasSplashed && this._puffinBody.velocity.y / this._physicsScale > 200) {
                this._splashSound.play()
                this._splash.revive()
                this._splash.animations.currentAnim.play()
                this._hasSplashed = true
            }
        }
        let waterVelocityFactor = PuffinInWater.velocityFactor
        if (this._puffin.y > this._skyPhysicsHeight && this._targetVelocityFactor !== waterVelocityFactor) {
            this._targetVelocityFactor = waterVelocityFactor
            this._modifyVelocities(waterVelocityFactor)
            this._background.groupWaves.forEach((sprite: Phaser.Sprite) => sprite.animations.currentAnim.speed = WaveSpeed * 0.6, this)
        }
    }

    private _switchToAir () {
        if (this._substance !== Substance.Air) {
            $_LOG('AIR physics')
            this._substance = Substance.Air
            this._puffinBody.gravity.y = PuffinInAir.gravity * this._physicsScale
            this._puffinBody.maxVelocity.y = PuffinInAir.maxVelocity * this._physicsScale
            this._puffinBody.drag.y = PuffinInAir.drag * this._physicsScale
            this._puffinBody.acceleration.y = PuffinInAir.acceleration * this._physicsScale
        }
        let airVelocityFactor = 1.0 // don't change, has to be 1.0!
        if (this._puffin.y < this._skyPhysicsHeight * 0.8 && this._targetVelocityFactor !== airVelocityFactor) {
            this._targetVelocityFactor = airVelocityFactor
            this._modifyVelocities(airVelocityFactor)
            this._background.groupWaves.forEach((sprite: Phaser.Sprite) => sprite.animations.currentAnim.speed = WaveSpeed, this)
        }
    }

    private _onFlyOverlap (puffin: Phaser.Sprite, fly: Phaser.Sprite) {
        if (this._puffinState === PuffinState.Vomit) {
            return
        }
        this._countFliesEaten++
        this._addDeadFly(puffin.x, puffin.y)
        this._foodRewardSound.play()
        fly.kill()
        this._updatePoints(Points.Fly)
    }

    private _onSharkOverlap (puffin: Phaser.Sprite, shark: Phaser.Sprite) {
        this._die()
    }

    private _die () {
        if (this._puffin.health === 0) {
            return
        }
        this._puffin.health = 0
        this._backgroundMusic.stop()
        if (this._coastReached) {
            this._gameWinSound.play()
        } else {
            this._puffinDiesHitBySharkSound.play()
        }
        this._freeze()
        this._updatePlayerData()

        setTimeout(() => {
            this._pointsText.kill()
            this.game.state.start('GameOver', false, false, this.camera.position)
        }, 800)
    }

    private _updatePlayerData () {
        player.setScore(this._points)
        player.setStats(
            this._countSandeelsEaten,
            this._countFliesEaten,
            this._countSeagullHits
        )

        //#if _DEBUG
            $_LOG('flies:', this._countFliesEaten)
            $_LOG('sandeels:', player.countTotalSandeelsEaten)
            for (let sandeelColor of SandeelColors) {
               $_LOG(sandeelColor + ' sandeels:', this._countSandeelsEaten[sandeelColor])
            }
            $_LOG('seagulls:', this._countSeagullHits)
            $_LOG('coast:', this._coastReached)
        //#endif
    }

    private _onSandeelOverlap (puffin: Phaser.Sprite, sandeel: Phaser.Sprite) {
        let color = sandeel.data.color
        this._countSandeelsEaten[color]++
        this._addDeadSandeel(sandeel.data.color, puffin.x, puffin.y)
        if (color === SandeelYellow) {
            this._yellowSandeelSound.play()
        } else {
            this._foodRewardSound.play()
        }
        sandeel.kill()
        sandeel.revive()
        sandeel.animations.stop()
        if (sandeel.data.type === 3) {
            sandeel.frameName = 'eel/amphora-standalone'
        } else {
            sandeel.frameName = 'eel/sand-standalone'
        }

        this._updatePoints(Points.Sandeel[color])
    }

    private _onSeagullOverlap (puffin: Phaser.Sprite, seagull: Phaser.Sprite) {
        let pointsDelta: number
        // .data is true if it's a kamikaze seagull
        if (seagull.data) {
            pointsDelta = Points.SeagullKamikaze
        } else {
            pointsDelta = Points.Seagull
        }
        if (this._puffinState === PuffinState.Vomit) {
            return
        }
        $_LOG('seagull hit')
        this._countSeagullHits++
        let transition
        let current
        if (this._puffinState === PuffinState.Float) {
            current = 'float'
            transition = PuffinTransition.Float2Vomit
        } else {
            current = 'fly'
            transition = PuffinTransition.Fly2Vomit
        }
        this._previousPuffinState = this._puffinState
        this._puffinState = PuffinState.Vomit
        this._puffinTransition = transition

        this._puffinHitBySeagullSound.play()
        this._updatePoints(pointsDelta)
        if (this._points > 0) {
            this._switchPuffinAnimation(current + '2vomit').onComplete.addOnce(() => {
                this._puffinTransition = null
                this._switchPuffinAnimation('vomit').onComplete.addOnce(() => {
                    this._puffinTransition = PuffinTransition.Vomit2Float
                    this._switchPuffinAnimation('float2vomit', true).onComplete.addOnce(() => {
                        this._previousPuffinState = this._puffinState
                        this._puffinState = PuffinState.Float
                        this._puffinTransition = null
                        this._switchPuffinAnimation('float')
                    })
                })
            })
        }
    }

    private _createPointsText () {
        let text = this._points.toString()
        if (!this._pointsText) {
            let fontSize = 40 * scaling.totalScale
            this._pointsText = this.add.bitmapText(0.5 * this.game.width, 0.05 * this.game.height, FONT_NUMBERS_KEY, text, fontSize, this._uiGroup)
            this._pointsText.anchor.x = 0.5
            this._pointsText.fixedToCamera = true
        } else {
            this._pointsText.visible = true
            this._pointsText.text = text
        }

        let popupX = this._puffin.right - this._puffin.width * 0.2
        if (!this._pointsPopupText) {
            let popupFontSize = 30 * scaling.totalScale
            this._pointsPopupText = this.add.bitmapText(popupX, 0, FONT_NUMBERS_KEY, '', popupFontSize, this._uiGroup)
            this._pointsPopupText.visible = false
            this._pointsPopupText.anchor.y = 1
        } else {
            this._pointsPopupText.x = popupX
        }
    }

    private _createOxygenBar () {
        this._oxygenBarPuffinOffsetX = -this._puffin.width * 0.2
        this._oxygenBarPuffinOffsetY = -this._puffin.height * 0.25
        let x = this._puffin.x + this._oxygenBarPuffinOffsetX
        let y = this._puffin.y + this._oxygenBarPuffinOffsetY
        this._oxygenBarEmpty = this.sprites.add(x, y, 'ui/bar-empty', this._uiGroup)
        this._oxygenBarFull = this.sprites.add(x, y, 'ui/bar-full-blue', this._uiGroup)
        this._oxygenBarEmpty.visible = this._oxygenBarFull.visible = false
        this._oxygenBarPadding = 0.04528 * this._oxygenBarEmpty.width // padding in px on each side
        this._oxygenBarInnerWidth = this._oxygenBarEmpty.width - 2 * this._oxygenBarPadding
        this._oxygenBarFull.cropRect = new Phaser.Rectangle(0, 0, this._oxygenBarPadding + this._oxygenBarInnerWidth, this._oxygenBarFull.height)
        this._oxygenBarDeltaPerPx = 1 / this._oxygenBarInnerWidth
        this._oxygenBarLastValueUpdate = this._oxygen

        this._oxygenBarFlashAnimation = this._oxygenBarEmpty.animations.add('flash', ['ui/bar-empty', 'ui/bar-full-red'], 10, true)
    }

    private _updateOxygen (delta: number) {
        this._oxygen = Phaser.Math.clamp(this._oxygen + delta, 0, 1)

        if (this._oxygen === 1.0) {
            if (this._oxygenBarVisible) {
                this._hideOxygenBar()
            }
        } else if (!this._oxygenBarVisible) {
            this._showOxygenBar()
        } else if (this._oxygen === 0.0) {
            if (!this._oxygenBarFlashAnimation.isPlaying) {
                this._flashOxygenBarStart()
            } else {
                this._updateOxygenBarPosition()
            }
        } else {
            if (this._oxygenBarFlashAnimation.isPlaying) {
                this._flashOxygenBarStop()
            }
            this._updateOxygenBar()
        }
    }

    private _showOxygenBar () {
        this._updateOxygenBar()
        this._oxygenBarFull.visible = this._oxygenBarEmpty.visible = true
        this._oxygenBarVisible = true
    }

    private _hideOxygenBar () {
        this._oxygenBarFull.visible = this._oxygenBarEmpty.visible = false
        this._oxygenBarVisible = false
    }

    private _updateOxygenBarPosition () {
        this._oxygenBarEmpty.x = this._oxygenBarFull.x = this._puffin.x + this._oxygenBarPuffinOffsetX
        this._oxygenBarEmpty.y = this._oxygenBarFull.y = this._puffin.y + this._oxygenBarPuffinOffsetY
    }

    private _updateOxygenBar () {
        this._updateOxygenBarPosition()
        if (Math.abs(this._oxygenBarLastValueUpdate - this._oxygen) > this._oxygenBarDeltaPerPx) {
            this._oxygenBarFull.cropRect.width = (this._oxygenBarPadding + this._oxygen * this._oxygenBarInnerWidth) / this.sprites.dynamicScale
            this._oxygenBarFull.updateCrop()
            this._oxygenBarLastValueUpdate = this._oxygen
        }
    }

    private _flashOxygenBarStart () {
        this._updateOxygenBarPosition()
        this._oxygenBarFlashAnimation.play()
        this._oxygenBarFull.visible = false
    }

    private _flashOxygenBarStop () {
        this._oxygenBarFull.visible = true
        this._oxygenBarFlashAnimation.stop(true)
    }

    private _updatePoints (delta: number) {
        this._points += delta
        if (this._points <= 0) {
            this._points = 0
            this._die()
        }
        this._pointsText.text = this._points.toString()

        this._pointsPopupText.text = (delta > 0 ? '+' : '') + delta
        this._pointsPopupText.y = this._puffin.y
        if (this._coastDisplaying) {
            this._pointsPopupText.x = this._puffin.right - this._puffin.width * 0.2
        }
        this._pointsPopupText.alpha = 1
        this._pointsPopupText.visible = true
        this.add.tween(this._pointsPopupText)
            .to({alpha: 0}, 200, Phaser.Easing.Cubic.In, true)
            .onUpdateCallback(() => {this._pointsPopupText.y = this._puffin.y})
            .onComplete.addOnce(this._onPointsPopupTweenComplete, this)

        this._maybeUpdatePuffinSizeAndBlinkEyes()
    }

    private _onPointsPopupTweenComplete (popup: Phaser.BitmapText, tween: Phaser.Tween) {
        this._pointsPopupText.visible = false
    }

    private _maybeUpdatePuffinSizeAndBlinkEyes () {
        if (!this._coastDisplaying) {
            if (this._points >= PuffinWeightThreshold.L) {
                if (this._puffinSize !== PuffinSize.L) {
                    this._puffinSize = PuffinSize.L
                    this._updateGravity()
                }
            } else if (this._points >= PuffinWeightThreshold.M) {
                if (this._puffinSize !== PuffinSize.M) {
                    this._puffinSize = PuffinSize.M
                    this._updateGravity()
                }
            } else {
                if (this._puffinSize !== PuffinSize.S) {
                    this._puffinSize = PuffinSize.S
                    this._updateGravity()
                }
            }
        }

        // eye blinking
        let firstBlinkFrame = 3
        if (this._puffinTransition === null) {
            let frame = (<any>this._puffinAnimation)._frameIndex
            if (this._puffinState === PuffinState.Float && frame < firstBlinkFrame) {
                this._switchPuffinAnimation('float-blink', false, frame).onComplete.addOnce(() => {
                    if (this._puffinState === PuffinState.Float) {
                        this._switchPuffinAnimation('float')
                    }
                })
            } else if (this._puffinState === PuffinState.Swim && frame < firstBlinkFrame) {
                this._switchPuffinAnimation('swim-blink', false, frame).onComplete.addOnce(() => {
                    if (this._puffinState === PuffinState.Swim) {
                        this._switchPuffinAnimation('swim')
                    }
                })
            } else if (this._puffinState === PuffinState.Fly && frame < firstBlinkFrame) {
                this._switchPuffinAnimation('fly-blink', false, frame).onComplete.addOnce(() => {
                    if (this._puffinState === PuffinState.Fly) {
                        this._switchPuffinAnimation('fly')
                    }
                })
            }
        }
    }

    private _updateGravity () {
        let gravity = this._substance === Substance.Water ? PuffinInWater.gravity[this._puffinSize] : PuffinInAir.gravity
        this._puffinBody.gravity.y = gravity * this._physicsScale
    }

    private _modifyVelocities (targetFactor) {
        $_LOG('velocity factor:', this._velocityFactor)
        let startFactor = this._velocityFactor
        let factorDelta = targetFactor - startFactor
        let steps = 3
        let duration = 500
        let currentStep = 0

        // TODO first iteration starts after initial delay, not immediately, so total duration is longer by one step duration
        this._timer.repeat(duration / steps, steps, () => {
            ++currentStep
            let stepFactor = startFactor + factorDelta * (currentStep / steps)
            let factor2 = stepFactor / this._velocityFactor
            this._velocityFactor = stepFactor
            this._flies.velocityFactor = stepFactor
            this._sharks.velocityFactor = stepFactor
            this._background.velocityFactor = stepFactor

            for (let group of this._velocityChangingGroups) {
                group.forEachAlive(this._slowdownSprite, null, factor2)
            }
            $_LOG('velocity factor:', this._velocityFactor)
        })
    }

    private _slowdownSprite (sprite: Phaser.Sprite, factor: number) {
        sprite.body.velocity.x *= factor
        sprite.lifespan /= factor
    }

    private _switchPuffinAnimation (name: string, reverse=false, startFrameIndexLocal?: number) {
        let size = this._puffinSize
        let animation = this._puffin.animations.getAnimation(`puffin/${size}/${name}`)
        this._puffinAnimation = animation
        let frame
        if (startFrameIndexLocal !== undefined) {
            frame = startFrameIndexLocal
        } else {
            frame = reverse ? animation.frameTotal - 1 : 0
        }
        $_LOG(name, reverse ? 'REVERSE' : '', 'START:', frame)
        animation.play()
        animation.reversed = reverse
        animation.frame = frame
        return animation
    }

    _insideFloatingZone () {
        return this._puffin.y > this._skyPhysicsHeight * 0.9 && this._puffin.y < this._skyPhysicsHeight * 1.1
    }

    private _addSplash () {
        if (!this._splash) {
            this._splash = this.sprites.get('splash')
            this._splash.y = this._skyHeight
            this._splash.x = this._puffin.x
            this._splashesGroup.add(this._splash)
        }
    }

    private _addPuffin () {
        if (!this._puffin) {
            this._puffin = this.sprites.get(PuffinStartAnimation)
            this._puffinGroup.add(this._puffin)
            this._puffinBody = this._puffin.body
        }

        this._puffin.health = 1 // we use this as a boolean, see die()

        this._puffinRotateWaterTween = this.add.tween(this._puffin).to({angle: -PuffinInWater.minAngle}, PuffinInWater.angleTweenDuration)
        this._puffinRotateAirTween = this.add.tween(this._puffin).to({angle: -PuffinInAir.maxAngle}, PuffinInAir.angleTweenDuration)

        this.input.onDown.add(this._onTap, this)
        this.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR).onDown.add(this._onTap, this)

        this._puffin.x = this.game.width * 0.2
        this._puffin.y = this._skyHeight * 0.3
        this._puffinAnimation = this._puffin.animations.getAnimation(PuffinStartAnimation).play()

        this.camera.follow(this._puffin, Phaser.Camera.FOLLOW_TOPDOWN)

        // Add physics to the puffin
        // Needed for: movements, gravity, collisions, etc.
        this._puffinBody.velocity.y = PuffinInAir.initialVelocity * this._physicsScale
        this._switchToAir()

        this._timer.loop(2000, this._maybeUpdatePuffinSizeAndBlinkEyes, this)
    }

    private _onTap () {
        this._hasSplashed = false
        if (this._oxygen <= 0 || this._puffinState === PuffinState.Vomit) {
            return
        }
        this._lastTapTime = this.time.now
        let insideFloatingZone = this._insideFloatingZone()
        if (insideFloatingZone && Math.abs(this._puffinBody.velocity.y) > 50 * this._physicsScale) {
            return
        }
        let velocity: number
        if (this._substance === Substance.Air || insideFloatingZone) {
            velocity = PuffinInAir.tapVelocity[this._puffinSize]
            if (this._puffinState === PuffinState.Float) {
                // there are two cases here:
                // 1. there is a transition from fly/swim to floating running, triggered by the tap timeout
                // 2. the float animation is running
                // the first case could be handled specially by reverting that, but the animation actually looks fine

                // if a transition is already running, revert that from the current frame
                let startFrameId: number
                if (this._puffinTransition === PuffinTransition.Fly2Float) {
                    this._puffinAnimation.stop(false)
                    startFrameId = (<any>this._puffinAnimation)._frameIndex
                }

                this._previousPuffinState = this._puffinState
                this._puffinState = PuffinState.Fly
                this._puffinTransition = PuffinTransition.Float2Fly
                this._switchPuffinAnimation('fly2float', true, startFrameId).onComplete.addOnce(() => {
                    if (this._puffinTransition === PuffinTransition.Float2Fly) {
                        this._puffinTransition = null
                        this._switchPuffinAnimation('fly')
                    }
                })
            }
            this._puffinRotateAirTween.start()
        } else {
            velocity = PuffinInWater.tapVelocity
            if (this._puffinState === PuffinState.Float) {
                // if a transition is already running, revert that from the current frame
                let startFrameId: number
                if (this._puffinTransition === PuffinTransition.Swim2Float) {
                    this._puffinAnimation.stop(false)
                    startFrameId = (<any>this._puffinAnimation)._frameIndex
                }

                this._previousPuffinState = this._puffinState
                this._puffinState = PuffinState.Swim
                this._puffinTransition = PuffinTransition.Float2Swim
                this._switchPuffinAnimation('float2swim', false, startFrameId).onComplete.addOnce(() => {
                    if (this._puffinTransition === PuffinTransition.Float2Swim) {
                        this._puffinTransition = null
                        this._switchPuffinAnimation('swim')
                    }
                })
            }
            this._puffinRotateWaterTween.start()
        }
        this._puffinBody.velocity.y = velocity * this._physicsScale
    }

    private _createSandeels () {
        let offset = SandeelFrequency / 1000 * UnderwaterSpeed * scaling.physicsScale
        for (let x = 0; x < this.game.width; x += offset) {
            this._addSandeel(x)
        }

        this._timer.add(SandeelFrequency, this._addSandeel, this)
    }

    private _addSandeel (x?: number) {
        if (this._coastDisplaying) {
            return
        }
        if (x === undefined) {
            x = this.game.width * 1.1
            this._timer.add(SandeelFrequency / this._velocityFactor, this._addSandeel, this)
        }
        let types = [{
            name: 1, lastFrame: 50
        }, {
            name: 2, lastFrame: 50
        }, {
            name: 3, lastFrame: 60
        }]

        let color
        if (Phaser.Utils.chanceRoll(SandeelYellowPercentage)) {
            color = SandeelYellow
        } else {
            color = this.rnd.pick(SandeelColorsBlueGreen)
        }
        let type = this.rnd.pick(types)
        let name = `eel/${color}/${type.name}`

        let seaBottomHeight = this._background.seaBottomHeight * 1.1
        let sandyHeight = this._waterHeight - seaBottomHeight
        let sandyUpperHeightRatio = 0.4
        let sandyUpperHeight = sandyHeight * sandyUpperHeightRatio
        let sandyLowerHeight = sandyHeight * (1 - sandyUpperHeightRatio)
        let y
        if (type.name === 3) {
            y = this._skyHeight + seaBottomHeight + sandyUpperHeight * Math.random()
        } else {
            y = this._skyHeight + this._waterHeight - sandyLowerHeight * Math.random()
        }
        let speed = UnderwaterSpeed * this._physicsScale * this._velocityFactor // px/s
        let sandeel = this.sprites.getFirstDead(this._background.groupSeaStuff, x, y, name, 1)
        sandeel.data = {color, type: type.name}
        this.sprites.addAnimation(sandeel, name, type.lastFrame, 50).play()
        sandeel.anchor.y = 1
        let body: Phaser.Physics.Arcade.Body = sandeel.body
        body.velocity.x = -speed
        sandeel.lifespan = ((x + sandeel.width) / speed) * 1000 // ms

        this._background.groupSeaStuff.sort('y', Phaser.Group.SORT_ASCENDING)

        // add to collision array
        let emptyIndex = this._sandeelsCollisionGroup.indexOf(undefined)
        if (emptyIndex === -1) {
            emptyIndex = this._sandeelsCollisionGroup.length
        }
        this._sandeelsCollisionGroup[emptyIndex] = sandeel
        sandeel.events.onKilled.addOnce(this._onSandeelKill, this, 0, emptyIndex)
    }

    _onSandeelKill (sandeel: Phaser.Sprite, i: number) {
        this._sandeelsCollisionGroup[i] = undefined
    }

    private _addDeadFly (x, y) {
        this._addDeadThing(this._deadFliesGroup, 'fly', x, y, 1)
    }

    private _addDeadSandeel (color, x, y) {
        this._addDeadThing(this._deadSandeelsGroup, `eel/${color}/standalone`, x, y)
    }

    private _addDeadThing (group: Phaser.Group, spriteName: string, x: number, y: number, frame?: number) {
        let deadThing = this.sprites.getFirstDead(group, x, y - this.camera.y, spriteName, frame)
        deadThing.alpha = 1
        deadThing.anchor = CENTER_ANCHOR.clone()
        let moveDuration = 1000
        let fadeDuration = 500
        let tween1 = this.add.tween(deadThing).to({x: this.game.width / 2, y: this._pointsText.cameraOffset.y + this._pointsText.height / 2}, 1000, Phaser.Easing.Cubic.InOut)
        let tween2 = this.add.tween(deadThing).to({alpha: 0}, 500)
        tween1.chain(tween2).start().onComplete.addOnce(this._killSprite, this, null, deadThing)
        this.add.tween(deadThing).to({angle: 3000}, moveDuration + fadeDuration).start()
    }

    _killSprite (sprite: Phaser.Sprite) {
        sprite.kill()
    }

    private _createSeagulls () {
        this._timer.add(SeagullStartDelay, this._addSeagulls, this)
    }

    private _addSeagull (x, y, speed) {
        let seagull = this.sprites.getFirstDead(this._seagullsGroup, x, y, 'seagull', 1)
        seagull.data = false // reset kamikaze flag
        seagull.rotation = 0
        let fps = 40
        let lastFrame = 30
        let anim = this.sprites.addAnimation(seagull, 'seagull', lastFrame, fps).play()
        // start at random frame
        anim.frame = this.rnd.integerInRange(1, lastFrame - 1) // -1 to avoid phaser bugs
        seagull.lifespan = ((x + seagull.width) / speed) * 1000 // ms
        seagull.anchor.y = CENTER_ANCHOR.y
        seagull.anchor.x = 0
        let body: Phaser.Physics.Arcade.Body = seagull.body
        body.velocity.x = -speed
    }

    private _addKamikazeSeagull () {
        let x1 = this.game.width
        let y1 = this._skyHeight * 0.2
        let seagull = this.sprites.getFirstDead(this._seagullsGroup, x1, y1, 'seagull', 1)
        let x2 = -seagull.width
        let y2 = this.game.rnd.between(this._skyHeight * 0.4, this._skyHeight)
        seagull.data = true // special kamikaze flag
        seagull.rotation = Phaser.Math.angleBetween(x2, y2, x1, y1)
        seagull.anchor = CENTER_ANCHOR.clone()
        let body: Phaser.Physics.Arcade.Body = seagull.body
        // steeper angle = smaller collision box
        body.width /= 0.9 - seagull.rotation
        this.add.tween(seagull)
            .to({x: x2, y: y2}, 1000, null, true)
            .onComplete.addOnce(this._killSprite, this)
    }

    private _getRandomSeagullSpeed () {
        let baseSpeed = 250
        let speed = (baseSpeed + (Math.random() - 0.5) * 40) * this._physicsScale * this._velocityFactor
        return speed
    }

    private _addSeagulls () {
        if (this._coastDisplaying) {
            return
        }
        let baseDelay = SeagullFrequency / this._velocityFactor
        let maxOffset = baseDelay * 1.5
        let offset = this.game.rnd.between(0, maxOffset)

        let bottom = this._skyHeight * 0.94

        if (Phaser.Utils.chanceRoll(SeagullVFormationPercentage) && this._playTimeRatio > SeagullVFormationAfter) {
            // V formation
            let centerY = this.game.rnd.between(bottom * 0.3, bottom * 0.9)
            let speed = this._getRandomSeagullSpeed()
            let formationOffsetX = 50 * scaling.totalScale
            let formationOffsetY = 35 * scaling.totalScale
            let maxOffsetX = formationOffsetX * 0.9
            let maxOffsetY = formationOffsetY * 0.2
            this._addSeagull(this.game.width + this.rnd.between(0, maxOffsetX), centerY + this.rnd.between(-maxOffsetY, maxOffsetY), speed)
            this._addSeagull(this.game.width + formationOffsetX + this.rnd.between(0, maxOffsetX), centerY + formationOffsetY + this.rnd.between(-maxOffsetY, maxOffsetY), speed)
            this._addSeagull(this.game.width + formationOffsetX + this.rnd.between(0, maxOffsetX), centerY - formationOffsetY + this.rnd.between(-maxOffsetY, maxOffsetY), speed)
            this._addSeagull(this.game.width + 2 * formationOffsetX + this.rnd.between(0, maxOffsetX), centerY + 2 * formationOffsetY + this.rnd.between(-maxOffsetY, maxOffsetY), speed)
            this._addSeagull(this.game.width + 2 * formationOffsetX + this.rnd.between(0, maxOffsetX), centerY - 2 * formationOffsetY + this.rnd.between(-maxOffsetY, maxOffsetY), speed)
            offset += baseDelay
        } else if (Phaser.Utils.chanceRoll(SeagullWallOfDeathPercentage) && this._playTimeRatio > SeagullWallOfDeathAfter) {
            // wall of death
            let speed = this._getRandomSeagullSpeed()
            let maxOffsetX = 40 * scaling.totalScale
            for (let y = 0; y <= bottom; y += 100 * scaling.totalScale) {
                let offsetX = this.rnd.between(0, maxOffsetX)
                this._addSeagull(this.game.width + offsetX, y, speed)
            }
            offset += baseDelay
        } else if (this._playTimeRatio > SeagullKamikazeAfter && this._playTimeRatio * SeagullKamikazeScaling > Math.random()) {
            // kamikaze seagull
            this._kamikazeSeagullSound.play()
            this._addKamikazeSeagull()
            offset += baseDelay
        } else {
            // 1-3 seagulls
            let y = this.game.rnd.between(0, bottom)
            this._addSeagull(this.game.width, y, this._getRandomSeagullSpeed())

            if (Phaser.Utils.chanceRoll(70)) {
                let offsetX = this.game.rnd.between(0, 100 * scaling.totalScale)
                let y2 = this.game.rnd.between(0, bottom)
                this._addSeagull(this.game.width + offsetX, y2, this._getRandomSeagullSpeed())

                if (Phaser.Utils.chanceRoll(40)) {
                    let offsetX2 = this.game.rnd.between(0, 100 * scaling.totalScale)
                    let y3 = this.game.rnd.between(0, bottom)
                    this._addSeagull(this.game.width + offsetX2, y3, this._getRandomSeagullSpeed())
                }
            }
        }

        this._timer.add(baseDelay + offset, this._addSeagulls, this)
    }

    get _playTimeRatio () {
        return this._gameDuration / GameDuration
    }
}
