<template>
  <div id="eta">
    <div :style="`color:${startColor}`" class="eta-inner">
      <span>
        {{ $route.params.mixer }}
      </span>
      <span>
        (Actualizado {{ updated }})
      </span><br>
      <span style="">{{ address }}</span>
    </div>
    <div v-if="ticket && ticket.cticket" class="eta-inner">
      <span>Guía: {{ ticket.cticket }}</span><br>
      <span>Estado: {{ ticket.state | formatTicketState }}</span>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { formatDistance } from 'date-fns'
import { pt, es } from 'date-fns/locale'
import { format } from '@/utils/mapbox'

const locales = { pt, es }
export default {
  name: 'EtaPanel',
  filters: {
    fDuration (duration) {
      return format.duration(duration)
    },
    formatTicketState (state) {
      return {
        TJB: 'A Obra',
        AJB: 'En Obra',
        IYD: 'En Planta',
        TPL: 'A Planta',
        LDS: 'Cargando'
      }[state] || state
    }
  },
  computed: {
    ...mapGetters(['ticket', 'address', 'duration', 'distance', 'devices', 'geofences', 'startColor', 'endColor', 'onColor', 'endAddress', 'session', 'position']),
    fDistance () { return format.metric(this.distance) },
    updated () {
      const locale = locales[navigator.language.substring(0, 2)]
      return this.position &&
       formatDistance(new Date(this.position.fixTime), new Date(), { addSuffix: true, locale })
    }
  },
  methods: {
    getStatusColor () {
      return this.endAddress
        ? this.endColor
        : (this.position ? (this.position.attributes.ignition ? this.onColor : this.endColor) : this.startColor)
    }
  }
}
</script>

<style scoped>

.fa {
  padding: 0 12px 0 0;
  display: inline-block;
}

#eta {
  background-color: #fffd;
  position: absolute;
  top: 0;
  overflow-y: scroll;
  font-family: sans-serif;
  transition: 0.3s;
  border-radius: 10px;
  display: flex;
  top: 10px;
  left: 10px;
  max-width: calc(100% - 20px);
}
.eta-inner {
  text-align: center;
  padding: 10px;
  font-size: smaller;
}
</style>
