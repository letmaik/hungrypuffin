export let language = 'en'

export let Chinese = 'zh'
export let Greek = 'el'
const supportedLanguages = ['en', 'de', 'es', 'fr', Greek, 'it', Chinese]

export const Loading = {
    en: 'Loading...',
    de: 'Lade...',
    es: 'Cargando...',
    fr: 'Chargement...',
    el: 'Φόρτωση...',
    it: 'Caricamento in corso...',
    zh: '正在导入'
}

const GAME_OVER = 'Game Over'
export const GameOver = {
    en: GAME_OVER,
    de: GAME_OVER,
    es: GAME_OVER,
    fr: GAME_OVER,
    el: GAME_OVER,
    it: GAME_OVER,
    zh: '游戏结束'
}

export const NewGame = {
    en: 'New\nGame',
    de: 'Neues\nSpiel',
    es: 'Nuevo\nJuego',
    fr: 'Nouveau\njeu',
    el: 'Καινούριο\nπαιχνίδι',
    it: 'Nuovo\nGioco',
    zh: '新的游戏'
}

export const Play = {
    en: 'Play',
    de: 'Spielen',
    es: 'Jugar',
    fr: 'Jouer',
    el: 'Παίξε',
    it: 'Gioca',
    zh: '开始'
}

export const PlayAgain = {
    en: 'Play\nAgain',
    de: 'Nochmal',
    es: 'De Nuevo',
    fr: 'Rejouer',
    el: 'Παίξε\nξανά',
    it: 'Gioca\nAncora',
    zh: '再来一次'
}

export const Credits = {
    en: 'Credits',
    de: 'Info',
    es: 'Créditos',
    fr: 'Crédits',
    el: 'πιστώσεις',
    it: 'Crediti',
    zh: '学分'
}

export const Back = {
    en: 'Back',
    de: 'Zurück',
    es: 'Regresar',
    fr: 'Retourner',
    el: 'Επιστροφή',
    it: 'Indietro',
    zh: '返回'
}

export const Island = {
    en: 'Island',
    de: 'Insel',
    es: 'Isla',
    fr: 'île',
    el: 'νησί',
    it: 'Isola',
    zh: '岛'
}

export function setUp () {
    function getLanguage (code) {
        let match = supportedLanguages.filter(c => code.indexOf(c) === 0)
        if (match.length > 0) {
            return match[0]
        }
    }
    let lang = getLanguage(navigator.language)
    if (lang) {
        language = lang
    }
}

export function get (obj) {
    return obj[language]
}
