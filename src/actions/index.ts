import { Action, z, user } from '@botpress/runtime'

async function getToken(client: any): Promise<string | null> {
  const { user: botpressUser } = await client.getUser({ id: user.id })
  return botpressUser.attributes?.sokoToken ?? null
}

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
        viewUrl: z.string(),
        buyUrl: z.string(),
      })
    ),
    error: z.string().optional(),
  }),
  handler: async ({ input, client, configuration: config }) => {
    const token = await getToken(client)

    const params = new URLSearchParams()
    if (input.search) params.set('search', input.search)
    if (input.category) params.set('category', input.category)
    if (input.district) params.set('district', input.district)
    if (input.minPrice !== undefined) params.set('min_price', String(input.minPrice))
    if (input.maxPrice !== undefined) params.set('max_price', String(input.maxPrice))
    params.set('limit', String(input.limit ?? 6))

    try {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${config.backendUrl}/listings/?${params}`, { headers })
      if (!res.ok) return { listings: [], error: 'Could not fetch listings' }
      const data = await res.json()
      const raw: any[] = Array.isArray(data) ? data : (data.items ?? [])
      const listings = raw.map((l: any) => ({
        id: l.id,
        slug: l.slug,
        name: l.name,
        category: l.category,
        district: l.district,
        price: l.price,
        unit: l.unit,
        availableQty: l.available_qty ?? l.availableQty ?? 0,
        farmerName: l.farmer ?? l.farmer_name ?? l.farmerName,
        farmerId: l.farmer_id ?? l.farmerId,
        availableQty: l.qty ?? l.available_qty ?? l.availableQty ?? 0,
        viewUrl: `${config.appUrl}/marketplace/${l.id}`,
        buyUrl: `${config.appUrl}/marketplace/${l.id}?action=buy`,
      }))
      return { listings }
    } catch {
      return { listings: [], error: 'Backend unreachable' }
    }
  },
})

export const getRecommendations = new Action({
  name: 'getRecommendations',
  description:
    'Get personalised produce recommendations for the logged-in buyer based on their order history and preferences. Use when users ask what they should buy, what is recommended, or want personalised suggestions.',
  input: z.object({
    limit: z.number().optional().describe('Max results to return, default 6'),
  }),
  output: z.object({
    recommendations: z.array(
      z.object({
        produceId: z.number(),
        name: z.string(),
        category: z.string(),
        district: z.string(),
        pricePerUnit: z.number(),
        unit: z.string(),
        reason: z.string(),
        score: z.number(),
        avgStars: z.number().nullable().optional(),
        viewUrl: z.string(),
      })
    ),
    error: z.string().optional(),
  }),
  handler: async ({ input, client, configuration: config }) => {
    const token = await getToken(client)
    if (!token) return { recommendations: [], error: 'Please log in to get recommendations.' }

    const params = new URLSearchParams()
    params.set('limit', String(input.limit ?? 6))

    try {
      const res = await fetch(`${config.backendUrl}/recommendations/?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return { recommendations: [], error: 'Could not fetch recommendations' }
      const data = await res.json()
      const results: any[] = data.results ?? []
      const recommendations = results.slice(0, input.limit ?? 6).map((r: any) => ({
        produceId: r.produce_id,
        name: r.name,
        category: r.category,
        district: r.district,
        pricePerUnit: r.price_per_unit,
        unit: r.unit,
        reason: r.reason,
        score: r.score,
        avgStars: r.avg_stars,
        viewUrl: `${config.appUrl}/marketplace?search=${encodeURIComponent(r.name)}`,
      }))
      return { recommendations }
    } catch {
      return { recommendations: [], error: 'Backend unreachable' }
    }
  },
})

export const checkMyOrders = new Action({
  name: 'checkMyOrders',
  description:
    "Check the logged-in buyer's orders. Use when users ask about their orders, delivery status, past purchases, or want to track something they bought.",
  input: z.object({
    status: z
      .string()
      .optional()
      .describe('Filter by status: pending, confirmed, in_transit, delivered, cancelled'),
    limit: z.number().optional().describe('Max results, default 10'),
  }),
  output: z.object({
    orders: z.array(
      z.object({
        id: z.string(),
        status: z.string(),
        totalAmount: z.number(),
        createdAt: z.string(),
        itemCount: z.number().optional(),
      })
    ),
    error: z.string().optional(),
  }),
  handler: async ({ input, client, configuration: config }) => {
    const token = await getToken(client)
    if (!token) return { orders: [], error: 'Please log in to view your orders.' }

    const params = new URLSearchParams()
    if (input.status) params.set('status', input.status)
    params.set('limit', String(input.limit ?? 10))

    try {
      const res = await fetch(`${config.backendUrl}/orders/me?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return { orders: [], error: 'Could not fetch orders' }
      const data = await res.json()
      const raw: any[] = Array.isArray(data) ? data : (data.items ?? [])
      const orders = raw.map((o: any) => ({
        id: o.id,
        status: o.status,
        totalAmount: o.total_amount ?? o.totalAmount ?? 0,
        createdAt: o.created_at ?? o.createdAt ?? '',
        itemCount: o.item_count ?? o.items?.length,
      }))
      return { orders }
    } catch {
      return { orders: [], error: 'Backend unreachable' }
    }
  },
})

export const getPriceSummary = new Action({
  name: 'getPriceSummary',
  description:
    'Get current market price range for a type of produce. Use when users ask about prices, how much something costs, or want to compare prices for a crop or category.',
  input: z.object({
    search: z.string().optional().describe('Crop name e.g. maize, tomatoes, milk'),
    category: z
      .string()
      .optional()
      .describe('One of: vegetables, grains, fruits, cash_crops, dairy, herbs, livestock, other'),
    district: z.string().optional().describe('Uganda district to narrow results'),
  }),
  output: z.object({
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    avgPrice: z.number().optional(),
    unit: z.string().optional(),
    sampleSize: z.number().optional(),
    error: z.string().optional(),
  }),
  handler: async ({ input, client, configuration: config }) => {
    const token = await getToken(client)

    const params = new URLSearchParams()
    if (input.search) params.set('search', input.search)
    if (input.category) params.set('category', input.category)
    if (input.district) params.set('district', input.district)
    params.set('limit', '50')

    try {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${config.backendUrl}/listings/?${params}`, { headers })
      if (!res.ok) return { error: 'Could not fetch price data' }
      const data = await res.json()
      const listings: any[] = Array.isArray(data) ? data : (data.items ?? [])
      if (!listings.length) return { error: 'No listings found for that produce' }

      const prices = listings.map((l: any) => l.price)
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
      const unit = listings[0]?.unit ?? 'unit'

      return { minPrice, maxPrice, avgPrice, unit, sampleSize: listings.length }
    } catch {
      return { error: 'Backend unreachable' }
    }
  },
})
