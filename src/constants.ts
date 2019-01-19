import {SandeelBlue, SandeelGreen, SandeelYellow} from './SpriteManager'

// all values in pixels based on 1x scaling
// positive value = downwards

export let GameDuration = 1000 * 60 * 4 // ms

export const SharkSpeed = 300 // px/s
export let SharkFrequency = 1200 // ms
export let SharkJumpingPercentage = 10 // %
export let SharkJumpingAfter = 0.7 // ratio of game duration
export const FlySpeed = 150 // px/s
export let FlyFrequency = 3000 // ms
export const SeagullStartDelay = 1000 // ms
export let SeagullFrequency = 700 // ms
export let SeagullVFormationPercentage = 5 // %
export let SeagullVFormationAfter = 0.1 // ratio of game duration
export let SeagullWallOfDeathPercentage = 5 // %
export let SeagullWallOfDeathAfter = 0.3 // ratio of game duration
export let SeagullKamikazeAfter = 0.6 // ratio of game duration
export let SeagullKamikazeScaling = 0.2 // ratio of game duration
export let SandeelFrequency = 4000 // ms
export let SandeelYellowPercentage = 7 // %
export const WaveSpeed = 40 // px/s

export const BackgroundFrontSpeed = 40 // px/s
export const BackgroundBackSpeed = 20 // px/s
export const UnderwaterSpeed = 30 // px/s
export const MountainFrequency = 2500 // ms
export const MountainMaxXShift = 40 // px
export const CloudFrequency = 8000 // ms
export const CloudMaxXShift = 100 // px
export const CloudMaxSpeedShift = 5 // px/s
export const IslandRockFrequency = 6000 // ms
export const IslandRockMaxXShift = 100 // px
export const BackRockDebrisFrequency = 5000 // ms
export const BackRockMaxXShift = 100 // px
export const SeaStuffFrequency = 1000 //1500 // ms
export const SeaStuffMaxXShift = 100 // px

export class PuffinSize {
    static S: 'S' = 'S'
    static M: 'M' = 'M'
    static L: 'L' = 'L'
}

export let PuffinWeightThreshold = {
    M: 400,
    L: 800
}

export const PuffinInAir = {
    gravity: 600, // px/(s^2)
    acceleration: 0, // px/(s^2)
    drag: 10, // px/(s^2); only has an effect if acceleration is 0
    initialVelocity: 100, // px/s
    maxVelocity: 10000, // px/s, absolute
    tapVelocity: { // px/s
        [PuffinSize.S]: -150,
        [PuffinSize.M]: -130,
        [PuffinSize.L]: -110 // -100
    },
    topBumpVelocity: 30, // px/s
    oxygenDelta: 0.1, // 1/s
    maxAngle: 10, // deg
    deltaAngle: 1, // deg
    angleTweenDuration: 100 // ms
}
export const PuffinInWater = {
    velocityFactor: 0.5, // also influences all the *Frequency constants
    gravity: { // px/(s^2)
        [PuffinSize.S]: -300,
        [PuffinSize.M]: -400,
        [PuffinSize.L]: -500
    },
    acceleration: 0, // px/(s^2)
    drag: 50, // px/(s^2); only has an effect if acceleration is 0
    maxVelocity: 300, // px/s, absolute
    tapVelocity: 100, // px/s
    topBumpVelocity: -30, // px/s
    oxygenDelta: -0.1, // 1/s
    minAngle: -10, // deg
    deltaAngle: 1, // deg
    angleTweenDuration: 400 // ms
}

export const Points = {
    Sandeel: {
        [SandeelYellow]: 150,
        [SandeelBlue]: 40,
        [SandeelGreen]: 80
    },
    Fly: 5,
    Seagull: -30,
    SeagullKamikaze: -200,
    IslandReachedBonus: 1000
}

export const PuffinStartAnimation = 'puffin/S/float'
export const PuffinTapTimeout = 500 // ms, after that it starts floating, NOTE: must be longer than float->swim|air transition animation

export const IsAndroid = /android/i.test(navigator.userAgent)
export const IsIOS = /iP[ao]d|iPhone/i.test(navigator.userAgent)

export const ISPHONE = IsAndroid || IsIOS

export const AUDIO_EXT = '.' + (IsAndroid ? 'ogg' : 'm4a')