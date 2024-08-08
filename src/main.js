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
      workspace: core.getInput('YUCHAT_WORKSPACE'),
      token: core.getInput('YUCHAT_TOKEN'),
      text: core.getInput('MARKDOWN'),
    }

    const finalPayload = await generatePayload(inputs)
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    const body = JSON.stringify(finalPayload);
    const url = inputs.webhookURL;

    core.debug(`Payload: \n${body}`)
    await sendNotification(url, body, headers)
  } catch (error) {
    core.setFailed(error.message)
  }
}

async function sendNotification(url, body, headers) {
  const client = new http.HttpClient()
  const response = await client.post(url, body, headers)
  await response.readBody()

  if (response.message.statusCode === 200) {
    core.info('Successfully sent notification!')
  } else {
    core.error(`Unexpected status code: ${response.message.statusCode}`)
    throw new Error(`${response.message.statusMessage}`)
  }
}

async function generatePayload(inputs) {

  if (inputs.text !== '') {
    core.debug('Will use the TEXT input to generate the payload.')

    const payload = {
      workspaceId: inputs.workspace,
      chatId: inputs.channel,
      markdown: inputs.text
    } // тут сделать жсончик для отправки в апи ючата

    return payload
  } else {
    throw new Error('You need to provide TEXT input')
  }
}

module.exports = {
  run
}
