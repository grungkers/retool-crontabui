const responseType = {
	open: 0,
	close: 1,
	ping: 2,
	pong: 3,
	message: 4,
	upgrade: 5,
	noop: 6,
}

const responseCode = {
	connect: 0,
	disconnect: 1,
	event: 2,
	ack: 3,
	error: 4,
}

module.exports = { responseType, responseCode }
