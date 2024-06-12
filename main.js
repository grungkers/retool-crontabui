const { K6SocketIoExp } = require('./libs/k6SocketIoExp.js')

export const options = {
	vus: 100,
	duration: '1m',
}

export default () => {
	const domain = 'localhost:8000'
	const url = `ws://${domain}/socket.io/?EIO=4&transport=websocket`
	const socket = new K6SocketIoExp(url)

	socket.setOnConnect(() => {
		socket
			.expectMessage('established')
			.catch((error) => {
				return Promise.reject(error)
			})
			.then((data) => {
				return socket.sendWithAck('myping', {})
			})
			.catch((error) => {
				return Promise.reject(error)
			})
			.then((data) => {
				return socket.sendWithAck('myping', {})
			})
			.catch(() => {})
			.finally(() => {
				socket.close()
			})
	})

	socket.connect()
}
