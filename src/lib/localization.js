const _ = require('lodash')

const $dict = Symbol('dict')
const $lang = Symbol('lang')

module.exports = class Localization {
  constructor () {
    this[$dict] = {}
    this[$lang] = null
  }
  addDictionary (code, list) {
    if (!_.isString(code)) throw new TypeError('First argument should be Locale code as String')
    if (!_.isObject(list)) throw new TypeError('Second argument should be dictionary object')
    this[$dict][code] = list
  }
  removeDictionary (code) {
    return delete this[$dict][code]
  }
  $ (key) {
    if (_.isNull(this[$lang])) throw new Error('Language not set')
    return this[$dict][this[$lang]][key] || key
  }
  setLanguage (code) {
    if (!(code in this[$dict])) throw new Error('No dictionary set for that language')
    this[$lang] = code
  }
  get availableLanguages () {
    return Object.keys(this[$dict])
  }
}
