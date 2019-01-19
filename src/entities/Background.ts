//#if _DEBUG
const $_LOG = console.log.bind(console)
//#else
//#set _LOG '//'
//#endif

import * as Phaser from 'phaser-ce'
import {default as SpriteManager, Group, FONT_KEY} from '../SpriteManager'
import {BackgroundFrontSpeed, BackgroundBackSpeed,
    MountainFrequency, MountainMaxXShift, CloudFrequency, CloudMaxXShift, CloudMaxSpeedShift,
    IslandRockFrequency, IslandRockMaxXShift, BackRockDebrisFrequency, BackRockMaxXShift,
    SeaStuffFrequency, SeaStuffMaxXShift, WaveSpeed, UnderwaterSpeed} from '../constants'
import * as i18n from '../i18n'
import * as scaling from '../scaling'

const IslandAnchors = {
    1: 0.69,
    2: 0.77,
    3: 0.77,
    4: 0.69,
    5: 0.75
}
const RockAnchors = {
    1: 0.91,
    2: 0.79,
    3: 0.74,
    4: 0.75,
    5: 0.77
}

const IslandSignRepeat = 60 * 1000 // ms
const IslandSignScale = 0.5

const Y = 'y'

export default class Background {
    firstCreate = true

    groupFixed: Phaser.Group
    groupsDynamic: Phaser.Group[]

    groupClouds: Phaser.Group
    groupMountains: Phaser.Group
    groupSunReflections: Phaser.Group
    groupWaves: Phaser.Group
    groupSeaSurface: Phaser.Group
    groupIslandSignText: Phaser.Group
    groupSeaFloor: Phaser.Group
    groupSeaBackRocks: Phaser.Group
    groupSeaStuff: Phaser.Group

    velocityFactor: number

    seaTopHeight: number
    seaBottomHeight: number

    seafloorWidth: number
    firstSeafloor: Phaser.Sprite
    lastSeafloor: Phaser.Sprite

    waveWidth: number
    firstWave: Phaser.Sprite
    lastWave: Phaser.Sprite

    coast: Phaser.Sprite

    stopSpawning: boolean

    islandSignText: Phaser.BitmapText
    lastIslandSignTime: number

    constructor (private game: Phaser.Game, private sprites: SpriteManager, private skyHeight: number, private waterHeight: number) {}

    init () {
        this.groupFixed = this.sprites.getGroup(Group.BGFixed)
        this.groupClouds = this.sprites.getGroup(Group.BGClouds)
        this.groupMountains = this.sprites.getGroup(Group.BGMountains)
        this.groupSunReflections = this.sprites.getGroup(Group.BGSunReflections)
        this.groupIslandSignText = this.sprites.getGroup(Group.BGIslandSignText)
        this.groupSeaSurface = this.sprites.getGroup(Group.BGSeaSurface)
        this.groupSeaFloor = this.sprites.getGroup(Group.BGSeaFloor)
        this.groupSeaBackRocks = this.sprites.getGroup(Group.BGSeaBackRocks)
        this.groupSeaStuff = this.sprites.getGroup(Group.BGSeaStuff)
        this.groupWaves = this.sprites.getGroup(Group.Waves)
        this.groupsDynamic = [
            this.groupClouds, this.groupMountains, this.groupSunReflections, this.groupSeaSurface, this.groupIslandSignText,
            this.groupSeaFloor, this.groupSeaBackRocks, this.groupSeaStuff, this.groupWaves]

        let islandText = i18n.get(i18n.Island)
        let fontSize = islandText.length <= 3 ? 40 : 30
        this.islandSignText = this.game.add.bitmapText(0, 0, FONT_KEY, islandText, fontSize * IslandSignScale * scaling.totalScale, this.groupIslandSignText)
        this.game.physics.arcade.enable(this.islandSignText)
        this.islandSignText.visible = false
        this.islandSignText.anchor.y = 0.5
        this.islandSignText.anchor.x = 0.6
    }

    preCreate () {
        if (this.firstCreate) {
            this.addFixedParts()
            this.firstCreate = false
        }
        this.velocityFactor = 1
        this.coast = null
        this.stopSpawning = false
        this.lastIslandSignTime = -Infinity
    }

    create () {
        this.preCreate()
        this.addMovingParts()
    }

    update () {
        if (this.firstWave.x < -this.waveWidth) {
            let oldFirst = this.firstWave
            let oldLast = this.lastWave
            this.firstWave = oldFirst.data
            this.lastWave = oldFirst
            oldFirst.x = oldLast.x + this.waveWidth
            oldLast.data = oldFirst
        }

        if (this.firstSeafloor.x < -this.seafloorWidth) {
            let oldFirst = this.firstSeafloor
            let oldLast = this.lastSeafloor
            this.firstSeafloor = oldFirst.data
            this.lastSeafloor = oldFirst
            oldFirst.x = oldLast.x + this.seafloorWidth
            oldLast.data = oldFirst
        }
    }

    /**
     * All non-animated parts.
     */
    private addFixedParts () {
        // sky color
        this.game.stage.backgroundColor = 0x73DFEC

        // sky
        let sky = this.sprites.add(this.game.width / 2, 0, 'static/sky', this.groupFixed)
        sky.anchor.x = 0.5

        // sun
        let sun = this.sprites.add(0.15 * this.game.width, 0.15 * this.game.width, 'static/sun', this.groupFixed)
        sun.anchor.x = sun.anchor.y = 0.5

        // sea top (water surface part of above-water world)
        let seaTop = this.sprites.add(this.game.width / 2, this.skyHeight, 'static/sea-top', this.groupFixed)
        seaTop.anchor.x = 0.5
        seaTop.anchor.y = 1
        this.seaTopHeight = seaTop.height

        // sea bottom (top part of underwater world, non-sandy)
        let seaBottom = this.sprites.add(this.game.width / 2, this.skyHeight, 'static/sea-bottom', this.groupFixed)
        seaBottom.anchor.x = 0.5
        this.seaBottomHeight = seaBottom.height

        // sand color
        let sand = this.game.add.graphics(0, this.skyHeight + seaBottom.height, this.groupFixed);
        sand.beginFill(0x92925B).drawRect(0, 0, this.game.width, this.waterHeight - seaBottom.height).endFill()
    }

    /** All parts that move from right to left */
    private addMovingParts () {
        this.addInitialMountains()
        this.addInitialIslandsAndRocks()
        this.addInitialClouds()
        this.addInitialBackRocksOrDebris()
        this.addInitialSeaStuff()
        this.addWaves()
        this.addSeaFloor()
        this.game.time.events.add(MountainFrequency, this.addMountain, this)
        this.game.time.events.add(CloudFrequency, this.addCloud, this)
        this.game.time.events.add(IslandRockFrequency, this.addIslandOrRock, this)
        this.game.time.events.add(BackRockDebrisFrequency, this.addBackRockOrDebris, this)
        this.game.time.events.add(SeaStuffFrequency, this.addSeaStuff, this)
    }

    private addWaves () {
        let y = this.skyHeight
        let w = this.sprites.getSize('waves/1').w
        this.waveWidth = w

        let createWave = x => {
            $_LOG('new wave:', x)
            let wave = this.sprites.add(x, y, 'waves', this.groupWaves, 1)
            this.sprites.addAnimation(wave, 'waves', 30, 30).play()
            wave.anchor.y = 0.5
            let body: Phaser.Physics.Arcade.Body = wave.body
            body.velocity.x = -WaveSpeed * scaling.physicsScale * this.velocityFactor
            return wave
        }

        this.firstWave = createWave(0)
        let leftWave = this.firstWave
        for (let i=1, x=w; x < this.game.width + w; i++, x += w) {
            let rightWave = createWave(x)
            leftWave.data = rightWave
            leftWave = rightWave
        }
        this.lastWave = leftWave
    }

    private addSeaFloor () {
        let y = this.skyHeight + this.seaBottomHeight
        let w = this.sprites.getSize('static/sea-floor-1').w
        this.seafloorWidth = w

        let createSeaFloor = (i, x) => {
            $_LOG('new seafloor:', i, x)
            let floor = this.sprites.add(x, y, 'static/sea-floor-' + i, this.groupSeaFloor)
            floor.anchor.y = 0.05
            let body: Phaser.Physics.Arcade.Body = floor.body
            body.velocity.x = -this.underwaterSpeed
            return floor
        }

        this.firstSeafloor = createSeaFloor(1, 0)
        let leftSeefloor = this.firstSeafloor
        for (let i=1, x=w; x < this.game.width + w; i++, x += w) {
            let rightSeafloor = createSeaFloor(1 + i % 3, x)
            leftSeefloor.data = rightSeafloor
            leftSeefloor = rightSeafloor
        }
        this.lastSeafloor = leftSeefloor
    }

    private addInitialIslandsAndRocks () {
        let offset = IslandRockFrequency / 1000 * BackgroundFrontSpeed * scaling.totalScale
        for (let x = 0; x < this.game.width; x += offset) {
            this.addIslandOrRock(x)
        }
    }

    private addIslandOrRock (x?: number) {
        if (this.coast) {
            return
        }
        let baseDelay = IslandRockFrequency / this.velocityFactor
        let maxOffset = baseDelay * 0.4
        let offset = this.game.rnd.between(-maxOffset, maxOffset)
        let initial = x !== undefined
        if (!initial) {
            this.game.time.events.add(baseDelay + offset, this.addIslandOrRock, this)
            x = this.game.width
        }
        let island = Phaser.Utils.chanceRoll(50)
        let type = this.game.rnd.between(1, 5)
        let anchorY = island ? IslandAnchors[type] : RockAnchors[type]
        let name = island ? 'island' : 'rock'

        let yMin = this.skyHeight - this.seaTopHeight * 0.9
        let yMax = this.skyHeight * 0.95
        let y = this.game.rnd.between(yMin, yMax)
        let sprite = this.sprites.getFirstDead(this.groupSeaSurface, x, y, `static/${name}-${type}`)
        sprite.anchor.y = anchorY
        let yPosRatio = (y - yMin) / (yMax - yMin) // 0 = top, 1 = bottom
        let speed = this.backSpeed + yPosRatio * (this.frontSpeed - this.backSpeed)
        sprite.lifespan = this.lifespan(x, sprite.width, speed)
        sprite.body.velocity.x = -speed

        if (island && this.game.time.now - this.lastIslandSignTime > IslandSignRepeat) {
            this.lastIslandSignTime = this.game.time.now
            this.addIslandSign(sprite, speed)
        }

        this.groupSeaSurface.sort(Y, Phaser.Group.SORT_ASCENDING)
    }

    private addIslandSign (island: Phaser.Sprite, speed: number) {
        let xSign = island.x + island.width / 2
        let ySign = island.y + 1 // sign must be in front (z) of the island, so we position y via anchor
        let signBase = this.sprites.getFirstDead(this.groupSeaSurface, xSign, ySign, 'ui/sign-base')
        signBase.scale.multiply(IslandSignScale, IslandSignScale)
        signBase.anchor.y = 1.08

        let sign = this.sprites.getFirstDead(this.groupSeaSurface, xSign - 20 * scaling.totalScale, ySign, 'ui/sign-right')
        sign.scale.multiply(IslandSignScale, IslandSignScale)
        sign.anchor.y = 2.1

        let text = this.islandSignText
        text.x = sign.left + sign.width / 2
        text.y = sign.top + sign.height / 2
        text.revive()

        sign.lifespan = signBase.lifespan = text.lifespan = island.lifespan
        sign.body.velocity.x = signBase.body.velocity.x = text.body.velocity.x = -speed
    }

    private addInitialBackRocksOrDebris () {
        let offset = BackRockDebrisFrequency / 1000 * UnderwaterSpeed * scaling.totalScale
        for (let x = 0; x < this.game.width; x += offset) {
            this.addBackRockOrDebris(x)
        }
    }

    private addBackRockOrDebris (x?: number) {
        if (this.coast) {
            return
        }
        let baseDelay = BackRockDebrisFrequency / this.velocityFactor
        let maxOffset = baseDelay * 0.4
        let offset = this.game.rnd.between(-maxOffset, maxOffset)
        if (x === undefined) {
            this.game.time.events.add(baseDelay + offset, this.addBackRockOrDebris, this)
            x = this.game.width
        }
        let things = {
            'back-rock': 3,
            'back-debris': 2
        }
        let names = Object.keys(things)
        let name = this.game.rnd.pick(names)
        let type = this.game.rnd.between(1, things[name])
        let y = this.skyHeight + this.seaBottomHeight * 1.02
        let rock = this.sprites.getFirstDead(this.groupSeaBackRocks, x, y, `static/${name}-${type}`)
        rock.anchor.y = 1
        rock.lifespan = this.lifespan(x, rock.width, this.underwaterSpeed)
        rock.body.velocity.x = -this.underwaterSpeed
    }

    private addInitialSeaStuff () {
        let offset = SeaStuffFrequency / 1000 * UnderwaterSpeed * scaling.totalScale
        for (let x = 0; x < this.game.width; x += offset) {
            this.addSeaStuff(x)
        }
    }

    private addSeaStuff (x?: number) {
        if (this.coast) {
            return
        }
        let baseDelay = SeaStuffFrequency / this.velocityFactor
        let maxOffset = baseDelay * 0.4
        let offset = this.game.rnd.between(-maxOffset, maxOffset)
        if (x === undefined) {
            this.game.time.events.add(baseDelay + offset, this.addSeaStuff, this)
            x = this.game.width
        }
        let things = {
            'sea-rock': 3,
            'debris': 4,
            'seaweed': 4,
            'coral': 5
        }
        let names = Object.keys(things)
        let name = this.game.rnd.pick(names)
        let type = this.game.rnd.between(1, things[name])
        let y = this.skyHeight + this.seaBottomHeight + Math.random() * (this.waterHeight - this.seaBottomHeight) * 0.4
        let sprite = this.sprites.getFirstDead(this.groupSeaStuff, x, y, `static/${name}-${type}`)
        sprite.anchor.y = 1
        sprite.lifespan = this.lifespan(x, sprite.width, this.backSpeed)
        sprite.body.velocity.x = -this.underwaterSpeed

        this.groupSeaStuff.sort(Y, Phaser.Group.SORT_ASCENDING)
    }

    private addInitialMountains () {
        let offset = MountainFrequency / 1000 * BackgroundBackSpeed * scaling.totalScale
        for (let x = -MountainMaxXShift * scaling.totalScale;
             x < this.game.width + MountainMaxXShift * scaling.totalScale;
             x += offset) {
            let offset = this.game.rnd.between(-MountainMaxXShift, MountainMaxXShift)
            this.addMountain(x + offset * scaling.totalScale)
        }
    }

    private addMountain (x?: number) {
        if (this.stopSpawning) {
            return
        }
        let baseDelay = MountainFrequency / this.velocityFactor
        let maxOffset = baseDelay * 0.4
        let offset = this.game.rnd.between(0, maxOffset)
        if (x === undefined) {
            this.game.time.events.add(baseDelay + offset, this.addMountain, this)
            x = this.game.width
        }

        let type = this.game.rnd.between(1, 7)
        let y = this.skyHeight - this.seaTopHeight + 5 * scaling.totalScale
        let mountain = this.sprites.getFirstDead(this.groupMountains, x, y, `static/mountain-${type}`)
        mountain.anchor.y = 1
        mountain.lifespan = this.lifespan(x, mountain.width, this.backSpeed)
        mountain.body.velocity.x = -this.backSpeed
    }

    private addInitialClouds () {
        let offset = CloudFrequency / 1000 * BackgroundBackSpeed * scaling.totalScale
        for (let x = -CloudMaxXShift * scaling.totalScale; x < this.game.width + CloudMaxXShift * scaling.totalScale; x += offset) {
            let offset = this.game.rnd.between(-CloudMaxXShift, CloudMaxXShift)
            this.addCloud(x + offset * scaling.totalScale)
        }
    }

    private addCloud (x?: number) {
        if (this.stopSpawning) {
            return
        }
        let baseDelay = CloudFrequency / this.velocityFactor
        let maxOffset = baseDelay * 0.4
        let offset = this.game.rnd.between(0, maxOffset)
        if (x === undefined) {
            this.game.time.events.add(baseDelay + offset, this.addCloud, this)
            x = this.game.width
        }

        let type = this.game.rnd.between(1, 5)
        let y = this.game.rnd.between(0.2 * this.skyHeight, 0.7 * this.skyHeight)
        let cloud = this.sprites.getFirstDead(this.groupClouds, x, y, `static/cloud-${type}`)
        cloud.anchor.y = 1
        let speed = this.backSpeed + this.game.rnd.between(-CloudMaxSpeedShift * scaling.physicsScale, CloudMaxSpeedShift * scaling.physicsScale)
        cloud.lifespan = this.lifespan(x, cloud.width, speed)
        cloud.body.velocity.x = -speed
    }

    addCoast () {
        let coast = this.sprites.add(this.game.width, this.skyHeight, 'static/coast', this.groupSeaStuff)
        this.groupSeaStuff.sendToBack(coast)
        coast.anchor.y = 0.35
        coast.body.velocity.x = -this.underwaterSpeed
        this.coast = coast
    }

    private lifespan (x: number, width: number, speed: number) {
        return ((x + width) / speed) * 1000 // ms
    }

    get frontSpeed () {
        return BackgroundFrontSpeed * scaling.physicsScale * this.velocityFactor
    }

    get backSpeed () {
        return BackgroundBackSpeed * scaling.physicsScale * this.velocityFactor
    }

    get underwaterSpeed () {
        return UnderwaterSpeed * scaling.physicsScale * this.velocityFactor
    }
}
