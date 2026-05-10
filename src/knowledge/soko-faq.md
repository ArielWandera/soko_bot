# Soko — Platform Guide

## What is Soko?
Soko is a digital agricultural marketplace connecting Ugandan farmers and buyers. Farmers list produce for sale; buyers browse, order, and pay via Mobile Money (MTN / Airtel). The platform also provides AI-powered price predictions and personalised recommendations.

## Who can use Soko?
- **Farmers** — list produce, manage orders, check price forecasts, message buyers
- **Buyers** — browse listings, place orders, pay via Mobile Money, review farmers
- **Anyone** — browse listings and view price predictions without an account

## How do I sign up?
Go to the sign-up page and choose your role (farmer or buyer). You can also sign up with Google.
- Sign up: /auth/sign-up
- Sign in: /auth/sign-in

## How do I list produce? (Farmers)
After signing in, go to the Sell page. You'll be guided through:
1. Product info (name, category, description)
2. Pricing (set your price or use the AI price suggestion)
3. Photos
4. Publishing
- Sell page: /sell

## How do I buy produce? (Buyers)
1. Browse the marketplace or search for a specific crop
2. Open a listing to see details, farmer info, and reviews
3. Add to cart and checkout — pay via MTN or Airtel Mobile Money
- Marketplace: /marketplace
- Search: /search

## What payment methods are supported?
MTN Mobile Money and Airtel Money via PesaPal integration.

## How do price predictions work?
Soko uses Prophet ML models trained on 4 years of Uganda market price data. Predictions cover 6 markets (Kisenyi/Kampala, Gulu, Mbarara, Mbale, Lira, Masaka) and 8 crops (maize grain, tomatoes, irish potatoes, yellow beans, matoke, cassava chips, sorghum, millet). Forecasts are cached for 24 hours.
- Price predictions on home: /home

## How do farmer recommendations work?
The recommendation engine matches buyers to farmers based on:
- Crop overlap (what the buyer wants vs what the farmer grows)
- District match — farmers in the same district score higher (lower transport cost)
- Farmer rating and fulfillment rate
- Recent interaction history (views, inquiries, purchases)

## What is the marketplace?
A searchable, filterable listing of all active produce. Filter by category, district, and price range.
- Marketplace: /marketplace

## How do I message a farmer?
Go to the listing detail page and start a conversation. All messages are in the Messages section.
- Messages: /messages

## How do I track my orders?
Go to your profile to see order history and status. Order statuses: placed → pending → confirmed → completed (or rejected/cancelled).
- Profile: /profile

## How do I get notifications?
Real-time push notifications for order updates and payment confirmations.
- Notifications: /user/notifications

## What is the blog?
Agri-knowledge articles and market commentary written by the Soko team and farmers.
- Blog: /blog

## Can I use Soko without a smartphone?
Yes. Farmers with basic feature phones can check prices via USSD.

## Produce categories
vegetables · grains · fruits · cash_crops · dairy · herbs · livestock · other

## Uganda districts supported
Soko covers all major Uganda districts. Popular ones include Kampala, Wakiso, Gulu, Mbarara, Mbale, Lira, Masaka, Jinja, Fort Portal, Arua.
