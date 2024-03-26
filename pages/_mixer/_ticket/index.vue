<template>
  <div>
    <div id="map" />
    <eta />
    <div v-if="loading" id="overlay" style="display: inline-block" />
    <div v-if="loading" style="left: calc(50% - 24px); top: calc(50vh - 24px); width: 100%; position: relative;">
      <span :style="`position: absolute; left: ${timer<10?20:16}px; top: 14px; font-family: sans-serif;`">{{ timer }}</span>
      <span class="loader" />
    </div>
  </div>
</template>

<script>
import mapboxgl from 'mapbox-gl'
import bbox from '@turf/bbox'
import { mapGetters } from 'vuex'
import { MapboxStyleSwitcherControl } from 'mapbox-gl-style-switcher'
import Eta from '../../../components/eta.vue'
import 'mapbox-gl-style-switcher/styles.css'
import { format } from '~/utils/mapbox'

mapboxgl.accessToken = process.env.MAPBOX_ACCESS_TOKEN
let map = null
let socket = null

export default {
  name: 'IndexPage',
  components: { Eta },
  data () {
    return {
      styles: [
        { title: this.$t('Obscuro'), uri: 'mapbox://styles/mapbox/dark-v10' },
        { title: 'Claro', uri: 'mapbox://styles/mapbox/light-v11' },
        { title: 'Satelite', uri: 'mapbox://styles/mapbox/satellite-streets-v11' },
        { title: this.$t('Calles'), uri: 'mapbox://styles/mapbox/streets-v11' }
      ],
      timer: 0,
      loading: true
    }
  },
  computed: {
    ...mapGetters(['duration', 'position', 'device', 'geofences', 'startColor', 'endColor', 'end', 'session'])
  },
  async mounted () {
    this.loading = true
    await this.getLastPosition()
    this.initMap()
    setInterval(() => this.timer++, 1000)
  },
  methods: {
    async getLastPosition () {
      await this.$store.dispatch('getData', this.$route.params)
    },
    initMap () {
      map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v12',
        center: this.end || this.start,
        zoom: 12
      })

      map.addControl(new MapboxStyleSwitcherControl(this.styles, {
        eventListeners: {
          // return true if you want to stop execution
          //           onOpen: (event: MouseEvent) => boolean;
          //           onSelect: (event: MouseEvent) => boolean;
          onChange: () => map.once('data', this.update)
        }
      }))
      map.on('load', () => {
        this.initWebSocket()
      })
    },
    async update () {
      const coordinates = [this.position.longitude, this.position.latitude]
      const start = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates
            }
          }
        ]
      }
      if (this.end) {
        await this.getRoute(coordinates)
        if (!map.getLayer('point')) {
          map.addLayer({
            id: 'point',
            type: 'circle',
            source: {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: [
                  {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                      type: 'Point',
                      coordinates: this.end
                    }
                  }
                ]
              }
            },
            paint: {
              'circle-radius': 10,
              'circle-color': this.endColor
            }
          })
        }
      } else {
        map.flyTo({
          center: coordinates,
          essential: true
        })
      }
      if (map.getLayer('start')) {
        map.getSource('start').setData(start)
      } else {
        map.addLayer({
          id: 'start',
          type: 'circle',
          source: {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'Point',
                    coordinates
                  }
                }
              ]
            }
          },
          paint: {
            'circle-radius': 10,
            'circle-color': this.startColor
          }
        })
      }
      this.loading = false
    },
    async getRoute (start) {
      try {
        const query = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${this.end[0]},${this.end[1]}?steps=true&geometries=geojson&access_token=${process.env.mapboxglAccessTokenDirections}`,
          { method: 'GET' }
        )
        const json = await query.json()
        const data = json.routes[0]
        this.$store.commit('SET_END_ADDRESS', json.waypoints.slice(-1)[0].name)
        const route = data.geometry.coordinates
        const geojson = {
          type: 'Feature',
          properties: {
            text: `${format.duration(data.duration)}\n${format.metric(data.distance)}`
          },
          geometry: {
            type: 'LineString',
            coordinates: route
          }
        }
        // if the route already exists on the map, we'll reset it using setData
        if (map.getSource('route')) {
          map.getSource('route').setData(geojson)
        } else {
          map.addLayer({
            id: 'route',
            type: 'line',
            source: {
              type: 'geojson',
              data: geojson
            },
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#3887be',
              'line-width': 5,
              'line-opacity': 0.75
            }
          })
        }
        if (this.duration === -1) {
          map.fitBounds(bbox(geojson), {
            padding: {
              top: 30,
              bottom: 30,
              left: 30,
              right: 30
            }
          })
        }
        this.$store.commit('setDuration', data.duration)
        this.$store.commit('setDistance', data.distance)
      } catch (e) {
        console.error(e)
      }
    },
    initWebSocket () {
      socket = new WebSocket(`wss://${process.env.TRACCAR_SERVER}/api/socket`)
      socket.onclose = async () => {
        const positions = await this.$axios.$get('/positions')
        if (positions.length) {
          const last = positions.pop()
          this.$store.commit('setPosition', last)
          this.update().then()
        }
        setTimeout(() => {
          this.initWebSocket()
        }, 10000)
      }
      socket.onopen = () => {
        socket.send(this.session.token)
      }
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.positions && data.positions.length) {
          const last = data.positions.pop()
          this.$store.commit('setPosition', last)
          this.update()
        }
      }
    }
  }
}
</script>
<style>
body {
  margin: 0;
  padding: 0;
}
#map {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100%;
}

#overlay {
  position: fixed; /* Sit on top of the page content */
  display: none; /* Hidden by default */
  width: 100%; /* Full width (cover the whole page) */
  height: 100%; /* Full height (cover the whole page) */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.6); /* Black background with opacity */
  z-index: 2; /* Specify a stack order in case you're using a different order for other elements */
  cursor: pointer; /* Add a pointer on hover */
}
.loader {
  width: 48px;
  height: 48px;
  border: 5px solid #FFF;
  border-bottom-color: #FF3D00;
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

</style>
