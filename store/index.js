const auth = {
  username: process.env.TRACCAR_USER,
  password: process.env.TRACCAR_PASS
}

export const state = () => ({
  duration: -1,
  distance: 0,
  geofences: [],
  devices: [],
  startColor: 'darkblue',
  onColor: '#3D993D',
  endColor: '#f30',
  session: null,
  position: null,
  address: '',
  latitude: 0,
  longitude: 0,
  ticket: {},
  endAddress: ''
})

export const getters = {
  address: state => state.address,
  duration: state => state.duration,
  distance: state => state.distance,
  geofences: state => state.geofences,
  devices: state => state.devices,
  startColor: state => state.startColor,
  onColor: state => state.onColor,
  endColor: state => state.endColor,
  end: state => state.latitude && [state.longitude, state.latitude],
  endAddress: state => state.endAddress,
  position: state => state.position,
  device: state => state.devices && state.devices[0] && state.devices[0].name,
  ticket: state => state.ticket,
  session: state => state.session
}
function convertLat (latitude) {
  const d1 = parseFloat(latitude) / 100.0
  const num1 = Math.trunc(d1)
  const num2 = (d1 - num1) * 100.0 / 60.0
  return (-num1 - num2)
}
function convertLon (longitude) {
  const d2 = parseFloat(longitude) / 100.0
  const num4 = Math.trunc(d2)
  const num5 = (d2 - num4) * 100.0 / 60.0
  return (-num4 - num5)
}
export const mutations = {
  setDuration (state, duration) {
    state.duration = duration
  },
  setDistance (state, distance) {
    state.distance = distance
  },
  setPosition (state, position) {
    state.position = position
    state.address = position.address
  },
  SET_DEVICES (state, devices) {
    state.devices = devices
  },
  SET_SESSION (state, session) {
    state.session = session
  },
  SET_TICKET (state, ticket) {
    state.ticket = ticket
    if (ticket.jobid) {
      state.latitude = convertLat(ticket.jobid.split(',')[0])
      state.longitude = convertLon(ticket.jobid.split(',')[1])
    }
  },
  SET_END_ADDRESS (state, address) {
    state.endAddress = address
  }
}

export const actions = {
  async getData ({ commit, state }, { mixer, ticket }) {
    const devices = await this.$axios.$get('devices', { auth })
    const device = devices.find(d => d.name === mixer)
    if (!device) { throw new Error('datos inválidos') }
    const users = await this.$axios.$get('users', { auth })
    const email = 'polpaico' + device.name
    let user = users.find(u => u.email === email)
    if (!user) {
      user = await this.$axios.$post('users', {
        name: email,
        email,
        password: process.env.TRACCAR_PASS
      }, { auth })
    }
    this.$axios.$post('permissions', { userId: user.id, deviceId: device.id }, { auth }).catch(e => console.error(e))
    const body = `email=${user.email}&password=${encodeURIComponent(process.env.TRACCAR_PASS)}`
    const session = await this.$axios.$post('/session', body)
    if (!session.token) {
      session.token = crypto.randomUUID()
      this.$axios.$put('/users/' + session.id, session).catch(e => console.error(e))
    }
    commit('SET_SESSION', session)
    commit('SET_DEVICES', await this.$axios.$get('/devices?token='+session.token))
    const _ticket = await this.$dynamo.get(device.name)
    if (!_ticket || _ticket.cticket !== ticket) {
      alert('ticket invalido: ' + ticket + ' vs ' + (_ticket && _ticket.cticket))
      await this.$router.push('/')
    }
    commit('SET_TICKET', _ticket)
  }
}
