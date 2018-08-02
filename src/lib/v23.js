const isObject = (x) => typeof x === 'object' && x !== null

function select (x, cases = {}) {
  if (!isObject(cases)) throw new TypeError('Need Cases Object as second argument')
  for (const i in cases) if (i === String(x)) return cases[i]
  return cases.default
}

function wait (t) {
  return new Promise(resolve => {
    setTimeout(() => resolve(t), t * 1000)
  })
}

class Color {
  constructor (r = 0, g = 0, b = 0) {
    if (typeof r === 'string' && r.startsWith('#')) {
      this.red = Number('0x' + r.slice(1,3))
      this.green = Number('0x' + r.slice(3,5))
      this.blue = Number('0x' + r.slice(5,7))
    } else {
      if (!Number.isInteger(r) || r < 0 || r > 255
       || !Number.isInteger(g) || g < 0 || g > 255
       || !Number.isInteger(b) || b < 0 || b > 255) throw new Error('bad value')
      this.red = r
      this.green = g
      this.blue = b
    }
  }
  toHex () {
    let r = this.red.toString(16)
    let g = this.green.toString(16)
    let b = this.blue.toString(16)
    if(r.length === 1) r = '0'.concat(r)
    if(g.length === 1) g = '0'.concat(g)
    if(b.length === 1) b = '0'.concat(b)
    return '#' + r + g + b
  }
  toRGB () {
    return 'rgb(' + this.red + ', ' + this.green + ', ' + this.blue + ')'
  }
  toString () {
    return this.toRGB()
  }
}

const v23 = {select, wait, Color}

export default v23
export {select, wait, Color}
