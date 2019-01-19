//#if _DEBUG
const $_LOG = console.log.bind(console)
//#else
//#set _LOG '//'
//#endif

import * as Phaser from 'phaser-ce'

/**
 * The width in px of the canvas element.
 */
export let canvasWidth

/**
 * The height in px of the canvas element.
 */
export let canvasHeight

/**
 * Given a length in dp (device pixels), then DPR is the factor used to convert dp to the matching length in pixels
 * based on the canvas dimensions.
 */
export let DPR

/** The available scales of textures, including fonts. */
const FIXED_SCALES = [1,2,3]

/**
 * The texture scale variant in use. One of FIXED_SCALES.
 */
export let fixedScale

/**
 * The scaling factor to apply to all textures.
 */
export let dynamicScale

/**
 * The overall scaling applied relative to 1x textures.
 * Useful for text scaling.
 */
export let totalScale

/**
 * Scaling factor to use for any physics quantities like speed or gravity.
 */
export let physicsScale

export let aspectRatio

export function setUp (parent: Element | Window) {
    let parentWidth = parent instanceof Window ? parent.innerWidth : parent.clientWidth
    const parentHeight = parent instanceof Window ? parent.innerHeight : parent.clientHeight

    const parentAspectRatio = parentWidth / parentHeight

    if (parentAspectRatio > 0.65) {
        // force into portrait dimensions, necessary when
        // not on a phone or in landscape mode
        parentWidth = 0.625 * parentHeight
    }

    aspectRatio = parentHeight / parentWidth

    const nativeDPR = window.devicePixelRatio

    // full display resolution
    DPR = nativeDPR

    canvasWidth = parentWidth * DPR
    canvasHeight = parentHeight * DPR

    // determine overall texture scaling factor, based on 1x textures
    const referenceWidth1x = 350
    totalScale = canvasWidth / referenceWidth1x

    const referenceWidthPhysics1x = 320 // iPhone 5
    physicsScale = canvasWidth / referenceWidthPhysics1x

    // determine highest quality texture scale variant
    // e.g. totalScale=6 -> fixedScale=3
    //      totalScale=1.8 -> fixedScale=2
    //      totalScale=2.3 -> fixedScale=2
    let roundedTotalScale
    if (totalScale - Math.floor(totalScale) >= 0.7) {
        roundedTotalScale = Math.ceil(totalScale)
    } else {
        roundedTotalScale = Math.floor(totalScale)
    }
    fixedScale = Phaser.Math.clamp(roundedTotalScale, FIXED_SCALES[0], FIXED_SCALES[FIXED_SCALES.length - 1])

    // determine dynamic scale as the remaining part of the total scale
    // e.g. totalScale=6, fixedScale=3 -> dynamicScale=2
    dynamicScale = totalScale / fixedScale

    $_LOG(`aspect ratio = ${aspectRatio}`)
    $_LOG(`totalScale = ${totalScale}`)
    $_LOG(`fixedScale = ${fixedScale}`)
    $_LOG(`dynamicScale = ${dynamicScale}`)
    $_LOG(`device DPR = ${nativeDPR}`)
    $_LOG(`canvas DPR = ${DPR}`)
    $_LOG(`canvas-vs-device resolution ratio = ${DPR / nativeDPR}`)
    $_LOG(`device resolution = ${window.innerWidth * nativeDPR} x ${window.innerHeight * nativeDPR}`)
    $_LOG(`container resolution = ${parentWidth * nativeDPR} x ${parentHeight * nativeDPR}`)
    $_LOG(`canvas resolution = ${canvasWidth} x ${canvasHeight}`)
}

