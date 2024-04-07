export const format = {
  duration (s) {
    if (s === -1) { return 'calculando...' }
    if (!s) {
      console.error('received invalid duration', s)
      return s
    }
    let m = Math.floor(s / 60)
    const h = Math.floor(m / 60)
    s %= 60
    m %= 60
    if (h === 0 && m === 0) { return s + 's' }
    if (h === 0) { return m + 'min' }
    return h + 'h ' + m + 'min'
  },

  metric (m) {
    if (!m) { return 'calculando...' }
    if (m >= 100000) { return (m / 1000).toFixed(0) + 'km' }
    if (m >= 10000) { return (m / 1000).toFixed(1) + 'km' }
    if (m >= 100) { return (m / 1000).toFixed(2) + 'km' }
    return m.toFixed(0) + 'm'
  }
}

export const loadImage = url => new Promise((resolve) => {
  const image = new Image()
  image.onload = () => resolve(image)
  image.src = url
})
