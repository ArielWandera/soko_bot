import { Action, z, configuration, user } from '@botpress/runtime'

// ── Browse Listings ───────────────────────────────────────────────────────────

export const browseListings = new Action({
  name: 'browseListings',
  description:
    'Browse or search produce listings on the Soko marketplace. Use this when users ask about available produce, want to find specific crops, or want to filter by location or price.',
  input: z.object({
    search: z.string().optional().describe('Crop name or keyword'),
    category: z
      .string()
      .optional()
      .describe('One of: vegetables, grains, fruits, cash_crops, dairy, herbs, livestock, other'),
    district: z.string().optional().describe('Uganda district e.g. Kampala, Gulu, Mbarara, Mbale'),
    minPrice: z.number().optional().describe('Minimum price per unit (UGX)'),
    maxPrice: z.number().optional().describe('Maximum price per unit (UGX)'),
    limit: z.number().optional().describe('Max results to return, default 6'),
  }),
  output: z.object({
    listings: z.array(
      z.object({
        id: z.string(),
        slug: z.string(),
        name: z.string(),
        category: z.string(),
        district: z.string(),
        price: z.number(),
        unit: z.string(),
        availableQty: z.number(),
        farmerName: z.string().optional(),
        farmerId: z.string().optional(),
      })
    ),
    error: z.string().optional(),
  }),
  handler: async ({ input, client }) => {
    const config = await configuration.get(client)
    const params = new URLSearchParams()
    if (input.search) params.set('search', input.search)
    if (input.category) params.set('category', input.category)
    if (input.district) params.set('district', input.district)
    if (input.minPrice !== undefined) params.set('min_price', String(input.minPrice))
    if (input.maxPrice !== undefined) params.set('max_price', String(input.maxPrice))
    params.set('limit', String(input.limit ?? 6))

    try {
      const res = await fetch(`${config.backendUrl}/listings/?${params}`)
      if (!res.ok) return { listings: [], error: 'Could not fetch listings' }
      const data = await res.json()
      const listings = Array.isArray(data) ? data : (data.items ?? [])
      return { listings }
    } catch {
      return { listings: [], error: 'Backend unreachable' }
    }
  },
})

// ── Price Prediction ──────────────────────────────────────────────────────────

export const getPricePrediction = new Action({
  name: 'getPricePrediction',
  description:
    'Get a 4-week price forecast for a specific crop at a Uganda market. Use this when users ask about expected prices, whether now is a good time to buy or sell, or price trends.',
  input: z.object({
    crop: z
      .string()
      .describe(
        'Crop name — one of: maize_grain, tomatoes, irish_potatoes, yellow_beans, matoke, cassava_chips, sorghum, millet'
      ),
    market: z
      .string()
      .describe('Market name — one of: Kisenyi_Kampala, Gulu, Mbarara, Mbale, Lira, Masaka'),
    weeksAhead: z.number().optional().describe('Weeks ahead to forecast, default 4'),
  }),
  output: z.object({
    result: z.any().optional(),
    error: z.string().optional(),
  }),
  handler: async ({ input, client }) => {
    const config = await configuration.get(client)
    try {
      const res = await fetch(`${config.mlGatewayUrl}/price/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market: input.market,
          crop: input.crop,
          weeks_ahead: input.weeksAhead ?? 4,
        }),
      })
      if (!res.ok) return { error: 'Could not get price prediction' }
      return { result: await res.json() }
    } catch {
      return { error: 'ML gateway unreachable' }
    }
  },
})

// ── Farmer Recommendations ────────────────────────────────────────────────────

export const getRecommendedFarmers = new Action({
  name: 'getRecommendedFarmers',
  description:
    'Get recommended farmers for the authenticated buyer, ranked by crop match and district proximity. Only available when the user is signed in as a buyer.',
  input: z.object({
    topN: z.number().optional().describe('Number of farmers to return, default 5'),
  }),
  output: z.object({
    farmers: z.array(z.any()).optional(),
    error: z.string().optional(),
  }),
  handler: async ({ input, client }) => {
    const config = await configuration.get(client)
    const { user: botpressUser } = await client.getUser({ id: user.id })
    const buyerId = botpressUser.attributes?.sokoUserId
    if (!buyerId) return { error: 'User not authenticated' }
    try {
      const res = await fetch(
        `${config.mlGatewayUrl}/recommend/farmers-for-buyer/${buyerId}?top_n=${input.topN ?? 5}`
      )
      if (!res.ok) return { error: 'Could not get recommendations' }
      const data = await res.json()
      return { farmers: data.recommended_farmers ?? [] }
    } catch {
      return { error: 'ML gateway unreachable' }
    }
  },
})

// ── Produce Feed ──────────────────────────────────────────────────────────────

export const getProduceFeed = new Action({
  name: 'getProduceFeed',
  description:
    'Get the personalised produce recommendation feed. Works for all users but gives better results when authenticated. Use this for general "what should I buy?" or "show me recommendations" requests.',
  input: z.object({}),
  output: z.object({
    feed: z.array(z.any()).optional(),
    error: z.string().optional(),
  }),
  handler: async ({ client }) => {
    const config = await configuration.get(client)
    const { user: botpressUser } = await client.getUser({ id: user.id })
    const token = botpressUser.attributes?.sokoToken
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    try {
      const res = await fetch(`${config.backendUrl}/recommendations/`, { headers })
      if (!res.ok) return { error: 'Could not get feed' }
      return { feed: await res.json() }
    } catch {
      return { error: 'Backend unreachable' }
    }
  },
})
