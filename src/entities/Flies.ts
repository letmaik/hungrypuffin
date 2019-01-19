import * as Phaser from 'phaser-ce'
import {default as SpriteManager, Group} from '../SpriteManager'
import {FlySpeed, FlyFrequency} from '../constants'
import * as scaling from '../scaling'

export default class Flies {
    group: Phaser.Group
    velocityFactor: number
    stopSpawning: boolean

    constructor (private game: Phaser.Game, private sprites: SpriteManager, private spawnRange: {top: number, bottom: number}) {
    }

    init () {
        this.group = this.sprites.getGroup(Group.Flies)
    }

    create () {
        this.velocityFactor = 1
        this.stopSpawning = false
        this.addFly()
        this.game.time.events.add(FlyFrequency / 2, this.addFly, this)
        this.game.time.events.add(FlyFrequency, this.addFly, this)
    }

    overlap (object: Phaser.Sprite, callback: Function, context) {
        this.game.physics.arcade.overlap(object, this.group, callback, null, context)
    }

    private addFly () {
        if (this.stopSpawning) {
            return
        }
        let baseDelay = FlyFrequency / this.velocityFactor
        let maxOffset = baseDelay * 0.4
        let offset = this.game.rnd.between(-maxOffset, maxOffset)
        this.game.time.events.add(baseDelay + offset, this.addFly, this)
        let speed = FlySpeed * scaling.physicsScale * this.velocityFactor
        let x = this.game.width
        let {top, bottom} = this.spawnRange
        let y = this.game.rnd.integerInRange(top, bottom)
        let fly = this.sprites.getFirstDead(this.group, x, y, 'fly', 1)
        this.sprites.addAnimation(fly, 'fly', 41, 40).play()
        fly.anchor.y = 0.5
        fly.lifespan = ((x + fly.width) / speed) * 1000 // ms
        let body: Phaser.Physics.Arcade.Body = fly.body
        body.velocity.x = -speed
    }
}
