import * as Phaser from 'phaser-ce'
import BaseState from './BaseState'

let DEBUG = false

/**
 * Enables debug output for a given state class.
 *
 * @example
 * game.state.add('Play', WithDebug(Play))
 */
export default function WithDebug (base: typeof BaseState) {
    return class extends base {
        init (...args) {
            super.init(...args)

            this.input.keyboard.addKey(Phaser.Keyboard.D).onDown.add(() => {
                DEBUG = !DEBUG
                // enables access to this.time.fps
                this.time.advancedTiming = DEBUG
                this.game.debug.reset()
            })

            let debugFontSizePx = this.game.height * 0.025
            this.game.debug.lineHeight = debugFontSizePx * 1.01
            this.game.debug.font = debugFontSizePx + 'px Courier'
        }

        render (game: Phaser.Game) {
            super.render(game)
            if (DEBUG) {
                let offsetX = this.game.width * 0.01
                let offsetY = this.game.debug.lineHeight
                this.game.debug.text(this.time.fps.toString(), offsetX, offsetY, '#00ff00', this.game.debug.font)
            }
        }
    }
}
