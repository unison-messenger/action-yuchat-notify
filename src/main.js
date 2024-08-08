const core = require('@actions/core')
const http = require('@actions/http-client')
const path = require('path')
const fs = require('fs').promises

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    const inputs = {
      webhookURL: core.getInput('YUCHAT_URL', { required: true }),
      channel: core.getInput('YUCHAT_CHANNEL'),
      token: core.getInput('YUCHAT_TOKEN'),
      text: core.getInput('MARKDOWN'),
    }

    const finalPayload = await generatePayload(inputs)
    core.debug(`${JSON.stringify(finalPayload, undefined, 4)}`)
    await sendNotification(inputs.webhookURL, finalPayload)
  } catch (error) {
    core.setFailed(error.message)
  }
}

async function sendNotification(webhookURL, payload) {
  const client = new http.HttpClient()
  const response = await client.post(webhookURL, JSON.stringify(payload))
  await response.readBody()

  if (response.message.statusCode === 200) {
    core.info('Successfully sent notification!')
  } else {
    core.error(`Unexpected status code: ${response.message.statusCode}`)
    throw new Error(`${response.message.statusMessage}`)
  }
}

async function generatePayload(inputs) {
  const legacyPayloadFilePath = path.join(__dirname, '..', inputs.filename)

  const legacyPayloadFileData = await checkLegacy(legacyPayloadFilePath)
  if (legacyPayloadFileData) {
    return legacyPayloadFileData
  }

  if (inputs.payload !== '') {
    core.debug(`Will use the PAYLOAD input as is`)
    return JSON.parse(inputs.payload)
  } else if (inputs.text !== '') {
    core.debug('Will use the TEXT input to generate the payload.')

    const payload = {
      channel: inputs.channel,
      username: inputs.username,
      icon_url: inputs.icon,
      text: inputs.text
    }

    return payload
  } else {
    throw new Error('You need to provide TEXT or PAYLOAD input')
  }
}

async function checkLegacy(filePath) {
  try {
    await fs.access(filePath, fs.constants.F_OK)
    const legacyData = await fs.readFile(filePath)
    return legacyData
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'EISDIR') {
      core.debug(`File ${filePath} does not exist. Moving along ...`)
      return
    } else {
      throw new Error(`You need to provide a valid readable file: ${error}`)
    }
  }
}

module.exports = {
  run
}
