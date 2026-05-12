import { Conversation } from '@botpress/runtime'

export const sokoConversation = new Conversation({
  channel: ['webchat.channel', 'chat.channel'],
  handler: async ({ execute }) => {
    await execute({
      instructions: 'You are SokoBot, a helpful assistant for the Soko agricultural marketplace in Uganda.',
    })
  },
})
