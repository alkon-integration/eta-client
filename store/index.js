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
  address: ''
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
  end: state => state.end, // state.session.attributes.linkVersion && state.session.attributes.linkVersion.split(','),
  endAddress: state => state.session && state.session.attributes.endAddress,
  position: state => state.position,
  device: state => state.devices && state.devices[0] && state.devices[0].name
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
  SET_ADDRESS (state, address) {
    state.address = address
  }
}

export const actions = {
  async getData ({ commit }, { mixer, ticket }) {
    const auth = {
      username: process.env.TRACCAR_USER,
      password: process.env.TRACCAR_PASS
    }
    const devices = await this.$axios.$get('devices', { auth })
    const device = devices.find(d => d.name === mixer)
    if (!device) {
      this.$router.push('/').then()
    }
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
    await this.$axios.$post('permissions', { userId: user.id, deviceId: device.id }, { auth })
    const body = `email=${user.email}&password=${encodeURIComponent(process.env.TRACCAR_PASS)}`
    commit('SET_SESSION', await this.$axios.$post('/session', body))
    commit('SET_DEVICES', await this.$axios.$get('/devices'))
  }
}
