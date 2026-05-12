import { z, defineConfig } from '@botpress/runtime'

export default defineConfig({
    name: 'SokoBot',
    description: 'AI assistant for Soko — the Ugandan agricultural marketplace. Helps users find produce, get price predictions, discover farmers, and navigate the platform.',

    defaultModels: {
        autonomous: 'openai:gpt-4o-mini',
        zai: 'openai:gpt-4o-mini',
    },

    bot: {
        state: z.object({}),
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
