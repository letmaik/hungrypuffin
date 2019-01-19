import * as Phaser from 'phaser-ce'
import {default as SpriteManager, Group} from '../SpriteManager'
import {SharkSpeed, SharkFrequency, SharkJumpingPercentage, SharkJumpingAfter} from '../constants'
import {default as Play, CENTER_ANCHOR} from '../states/Play'
import * as scaling from '../scaling'

const ToRadian = Math.PI / 180

export default class Sharks {
    group: Phaser.Group
    velocityFactor: number
    stopSpawning: boolean
    jumpingShark: boolean

    constructor (private game: Phaser.Game, private play: Play, private sprites: SpriteManager, private spawnRange: {top: number, bottom: number}) {
    }

    init () {
        this.group = this.sprites.getGroup(Group.Sharks)
    }

    create () {
        this.jumpingShark = false
        this.stopSpawning = false
        this.velocityFactor = 1
        this.game.time.events.add(SharkFrequency * 2, this.addShark, this)
    }

    overlap (object: Phaser.Sprite, callback: Function, context) {
        this.game.physics.arcade.overlap(object, this.group, callback, null, context)
    }

    private addShark () {
        if (this.stopSpawning) {
            return
        }
        let baseDelay = SharkFrequency / this.velocityFactor
        let maxOffset = baseDelay * 1.5
        let offset = this.game.rnd.between(0, maxOffset)
        this.game.time.events.add(baseDelay + offset, this.addShark, this)

        if (Phaser.Utils.chanceRoll(SharkJumpingPercentage) && this.play._playTimeRatio > SharkJumpingAfter) {
            // jumping shark
            this.jumpingShark = true
            const angle = 20
            let x = this.game.width
            let y = this.play._skyHeight * 1.1
            let shark = this.sprites.getFirstDead(this.group, x, y, 'shark', 1)
            shark.anchor = CENTER_ANCHOR.clone()
            shark.rotation = angle * ToRadian
            let w = shark.width
            shark.x += w / 2

            const duration = 1500
            // TODO can be made more efficient with single rotation-only tween by setting the pivot properly
            let tween2 = this.game.add.tween(shark)
                .to({y: y, rotation: -angle * ToRadian}, duration / 2, Phaser.Easing.Sinusoidal.In)
            tween2.onComplete.addOnce(this._killFlyingShark, this.play)
            this.game.add.tween(shark)
                .to({y: y * 0.85,  rotation: 0}, duration / 2, Phaser.Easing.Sinusoidal.Out, true)
                .chain(tween2)

           this.game.add.tween(shark)
                .to({x: -w/2}, duration, Phaser.Easing.Linear.None, true)
        } else {
            // regular shark
            let speed = SharkSpeed * scaling.physicsScale * this.velocityFactor
            let x = this.game.width
            let {top, bottom} = this.spawnRange
            let y = this.game.rnd.integerInRange(top, bottom)
            let shark = this.sprites.getFirstDead(this.group, x, y, 'shark', 1)
            this.sprites.addAnimation(shark, 'shark', 50, 60).play()
            shark.rotation = 0
            shark.anchor.x = 0
            shark.anchor.y = 0.5
            shark.lifespan = ((x + shark.width) / speed) * 1000 // ms
            let body: Phaser.Physics.Arcade.Body = shark.body
            body.velocity.x = -speed
        }
    }

    _killFlyingShark (shark: Phaser.Sprite) {
        shark.kill()
        this.jumpingShark = false
    }
}
