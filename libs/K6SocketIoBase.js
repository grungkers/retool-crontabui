const { responseCode, responseType } = require('./constant.js')
const {
	checkResponse,
	getArrayFromRequest,
	getCallbackId,
} = require('./socket.io.js')
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
const { setTimeout, clearTimeout } = require('k6/experimental/timers')
const { check } = require('k6')

class K6SocketIoBase {
	constructor(url, params = {}, max_time = 0) {
		this.socket = null
		this.callbackCount = 0
		this.connected = false
		this.onConnect = undefined
		this.ackCallbackMap = {}
		this.eventMessageHandleMap = {}
		this.waitingEventMap = {}
		this.url = url
		this.max_time = max_time
		this.params = params
	}

	connect() {
	}

	on(event, callback) {
	}

	parseMessage(message) {
	}

	setSocket(socket) {
		this.socket = socket
		this.on('message', (msg) => {
			this.handleMessage(this.parseMessage(msg))
		})
		let max_time_timeout
		if (this.max_time != 0) {
			max_time_timeout = setTimeout(() => {
				this.close()
			}, this.max_time)
		}
		this.on('error', (error) => {
			console.log('error.')
			check(false, {error: (r) => r})
			this.socket.close()
		})
		this.on('close', () => {
			clearTimeout(max_time_timeout)
			this.failWaitingEvents()
		})
	}

	listen() {
		this.on('open', () => {
		})
	}

	close() {
		this.socket.close()
	}

	setOnConnect(callback) {
		this.onConnect = callback
	}

	setOnError(callback) {
		this.on('error', callback)
	}

	handleMessage(msg) {
		const response = checkResponse(msg)
		const type = response.type
		const code = response.code

		if (type == responseType.open) {
			this.socket.send('40')
			return
		}

		switch (code) {
			case responseCode.connect: {
				if (this.onConnect != null) this.onConnect()
				this.connected = true
				break
			}
			case responseCode.ack: {
				const msgObject = getArrayFromRequest(msg)
				const callbackId = getCallbackId(msg)
				const callback = this.ackCallbackMap[callbackId]
				if (callback != undefined) {
					delete this.ackCallbackMap[callbackId]
					callback(msgObject)
				}
				break
			}
			case responseCode.event: {
				const msgObject = getArrayFromRequest(msg)
				const event = msgObject[0]
				const message = msgObject[1]
				const callbackId = getCallbackId(msg)

				const callback = !Number.isNaN(callbackId)
					? (data) => {
						this.sendAck(callbackId, data)
					}
					: undefined
				const eventMessageHandle = this.eventMessageHandleMap[event]
				if (eventMessageHandle != undefined) {
					eventMessageHandle(message, callback)
				} else {
					if (event == 'message' || event == 'activeCount') break
					console.log('no eventMessageHandle:', event)
				}
				break
			}
		}
	}

	setEventMessageHandle(event, handler) {
		this.eventMessageHandleMap[event] = handler
	}

	send(event, data, callback) {
		if (callback == null) {
			this.socket.send(
				`${responseType.message}${responseCode.event}['${event}',${JSON.stringify(data)}]`,
			)
		} else {
			this.callbackCount++
			this.ackCallbackMap[this.callbackCount] = callback
			this.socket.send(
				`${responseType.message}${responseCode.event}${this.callbackCount}['${event}',${JSON.stringify(data)}]`,
			)
		}
	}

	sendAck(callbackId, data) {
		this.socket.send(
			`${responseType.message}${responseCode.ack}${callbackId}[${JSON.stringify(
				data,
			)}]`,
		)
	}

	expectMessage(event, timeout = 0) {
		const startTime = Date.now()
		const waitingEventId = uuidv4()
		const wrapper = this

		return new Promise((resolve, reject) => {
			wrapper.waitingEventMap[waitingEventId] = reject

			const eventMessageHandle = (data, callback) => {
				const elapsed = Date.now() - startTime
				const isSuccess = elapsed < timeout
				delete wrapper.waitingEventMap[waitingEventId]

				if (isSuccess || timeout == 0) {
					resolve({data, callback, elapsed})
				} else {
					reject(`timeout reached for ${event}`)
				}
			}
			wrapper.eventMessageHandleMap[event] = eventMessageHandle
		})
	}

	sendWithAck(event, data, timeout = 0) {
		const startTime = Date.now()
		const waitingEventId = uuidv4()

		const wrapper = this

		return new Promise(function (resolve, reject) {
			wrapper.waitingEventMap[waitingEventId] = reject
			wrapper.send(event, data, (callbackData) => {
				const elapsed = Date.now() - startTime
				const isSuccess = elapsed < timeout
				delete wrapper.waitingEventMap[waitingEventId]

				if (isSuccess || timeout == 0) {
					resolve({data: callbackData, elapsed})
				} else {
					reject(`timeout reached`)
				}
			})
		})
	}

	failWaitingEvents() {
		for (const waitingEvent of Object.values(this.waitingEventMap)) {
			waitingEvent('failed wait event.')
		}
	}
}

module.exports = { K6SocketIoBase }
