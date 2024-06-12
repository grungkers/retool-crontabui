const { K6SocketIoBase } = require('./K6SocketIoBase.js')
import { WebSocket } from 'k6/experimental/websockets';

class K6SocketIoExp extends K6SocketIoBase {
	connect() {
		this.setSocket(new WebSocket(this.url))
		this.socket.addEventListener('open', () => {
		})
	}

	on(event, callback) {
		this.socket.addEventListener(event, callback)
	}

	parseMessage(message) {
		return message.data
	}
}

module.exports = { K6SocketIoExp }
