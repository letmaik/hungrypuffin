export let score: number

export let countSandeelsEaten: {[color: string]: number} = {}
export let countTotalSandeelsEaten: number
export let countFliesEaten: number
export let countSeagullHits: number

export function setScore (newScore: number) {
    score = newScore
}

export function setStats (
    newCountSandeelsEaten: {[color: string]: number},
    newCountFliesEaten: number,
    newCountSeagullHits: number) {

    countSandeelsEaten = newCountSandeelsEaten
    countFliesEaten = newCountFliesEaten
    countSeagullHits = newCountSeagullHits

    countTotalSandeelsEaten = 0
    for (let sandeelColor in countSandeelsEaten) {
        countTotalSandeelsEaten += countSandeelsEaten[sandeelColor]
    }
}
