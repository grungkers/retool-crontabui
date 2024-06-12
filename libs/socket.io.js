const checkResponse = (response) => {
	return { type: parseInt(response[0]), code: parseInt(response[1]) }
}

const getCallbackId = (response) => {
	return parseInt(response.slice(2))
}

const getArrayFromRequest = (response) => {
	const match = /\[.+\]/
	const parsedResponse = response.match(match)
	return parsedResponse ? JSON.parse(parsedResponse[0]) : []
}

module.exports = { checkResponse, getCallbackId, getArrayFromRequest }
