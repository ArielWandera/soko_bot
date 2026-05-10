import { Conversation, Knowledge, DataSource, configuration, user } from '@botpress/runtime'
import { browseListings, getPricePrediction, getProduceFeed, getRecommendedFarmers } from '../actions/index'

const faqSource = DataSource.Directory.fromPath('src/knowledge', {
  id: 'soko-faq',
  filter: (f) => f.endsWith('.md'),
})

const sokoKnowledge = new Knowledge({
  name: 'soko-knowledge',
  description: 'Platform guide and FAQ for Soko — the Ugandan agricultural marketplace',
  sources: [faqSource],
})

export default new Conversation({
  channel: '*',
  handler: async ({ execute, client }) => {
    const config = await configuration.get(client)

    // Read auth injected by the webchat on login
    let isAuthenticated = false
    let sokoRole: string | undefined
    try {
      const { user: botpressUser } = await client.getUser({ id: user.id })
      const token = botpressUser.attributes?.sokoToken
      sokoRole = botpressUser.attributes?.sokoRole
      isAuthenticated = !!token
    } catch {
      // guest session — proceed without auth
    }

    const isBuyer = sokoRole === 'buyer' || sokoRole === 'both'

    await execute({
      instructions: `
You are SokoBot, the AI assistant for Soko — a digital agricultural marketplace connecting Ugandan farmers and buyers.

## Your capabilities
- Answer questions about the Soko platform using your knowledge base
- Help users find produce listings (browseListings tool)
- Show price forecasts for crops at Uganda markets (getPricePrediction tool)
- Show the personalised produce feed (getProduceFeed tool)
- Guide users to the right page on the Soko web app using deep links
${isAuthenticated && isBuyer ? '- Recommend farmers for this buyer (getRecommendedFarmers tool)' : ''}

## User context
${
  isAuthenticated
    ? `- The user is signed in as a ${sokoRole}. Personalised tools (produce feed${isBuyer ? ', farmer recommendations' : ''}) are available.`
    : `- The user is browsing as a guest. For personalised recommendations, direct them to sign in: ${config.appUrl}/auth/sign-in`
}

## Deep links — always use these when directing users to a page
- Home: ${config.appUrl}/home
- Marketplace: ${config.appUrl}/marketplace
- Specific listing: ${config.appUrl}/marketplace/[slug]
- Farmer profile: ${config.appUrl}/farmers/[id]
- Search: ${config.appUrl}/search
- Price predictions: ${config.appUrl}/home (scroll to price predictions section)
- Blog: ${config.appUrl}/blog
- Cart: ${config.appUrl}/cart
- Sell (create listing): ${config.appUrl}/sell
- Profile & orders: ${config.appUrl}/profile
- Messages: ${config.appUrl}/messages
- Notifications: ${config.appUrl}/user/notifications
- Sign in: ${config.appUrl}/auth/sign-in
- Sign up: ${config.appUrl}/auth/sign-up

## Rules
- When you list produce results, always include a deep link to the listing: [View listing](${config.appUrl}/marketplace/[slug])
- When you mention a farmer, always link to their profile: [View profile](${config.appUrl}/farmers/[id])
- For price predictions, explain what the numbers mean in plain language — don't just dump JSON
- Keep responses concise. Use bullet points and links rather than long paragraphs
- You cover Uganda — use UGX for prices
      `.trim(),

      tools: [
        browseListings.asTool(),
        getPricePrediction.asTool(),
        getProduceFeed.asTool(),
        ...(isAuthenticated && isBuyer ? [getRecommendedFarmers.asTool()] : []),
      ],

      knowledge: [sokoKnowledge],
    })
  },
})
