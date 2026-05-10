import { z, defineConfig } from '@botpress/runtime'

export default defineConfig({
    name: 'New Agent',
    description: 'AI assistant for Soko — the Ugandan agricultural marketplace. Helps users find produce, get price predictions, discover farmers, and navigate the platform.',

    defaultModels: {
        autonomous: 'cerebras:gpt-oss-120b',
        zai: 'cerebras:gpt-oss-120b',
    },

    bot: {
        state: z.object({}),
    },

    // Persisted per user — token and role are set when the user logs in via the web app
    user: {
        state: z.object({
            token: z.string().optional().describe('JWT access token from Soko login'),
            role: z.enum(['farmer', 'buyer']).optional().describe('User role on Soko'),
            userId: z.string().optional().describe('Soko user ID'),
        }),
    },

    configuration: {
        schema: z.object({
            backendUrl: z.string().default('http://localhost').describe('Soko core API base URL (via Nginx)'),
            mlGatewayUrl: z.string().default('http://localhost:8000').describe('Soko ML gateway URL'),
            appUrl: z.string().default('http://localhost:5173').describe('Soko web app URL for deep links'),
        }),
    },

    dependencies: {
        integrations: {
            chat: 'chat@1.0.0',
            webchat: 'webchat@0.3.0',
        },
    },
})
