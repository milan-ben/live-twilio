# Twilio Live Dialer (Next.js + Vercel)

Minimal frontend + backend app that lets you enter a customer phone number and place a live call via Twilio Voice.

## Stack Choice

- **Backend:** Next.js Route Handlers (`/api/*`) running on Node.js runtime
- **Frontend:** Next.js App Router page with Twilio Voice JS SDK
- **Hosting:** Vercel (single project for frontend + backend)

This is generally simpler and better suited for Vercel than NestJS for this specific use case.

## 1) Configure Environment Variables

Copy `.env.example` to `.env.local` and fill all values:

```bash
cp .env.example .env.local
```

Required variables:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_API_KEY`
- `TWILIO_API_SECRET`
- `TWILIO_TWIML_APP_SID`
- `TWILIO_CALLER_ID` (your Twilio phone number in E.164, e.g. `+12025550123`)
- `NEXT_PUBLIC_TWILIO_EDGE` (optional, default: `ashburn`)

## 2) Twilio Console Setup

1. Buy/choose a Twilio voice-enabled number (this becomes `TWILIO_CALLER_ID`).
2. Create an API Key + Secret (use for `TWILIO_API_KEY` and `TWILIO_API_SECRET`).
3. Create a **TwiML App**:
   - Voice Request URL: `https://YOUR_DOMAIN/api/voice/outgoing`
   - HTTP Method: `POST`
4. Put the TwiML App SID into `TWILIO_TWIML_APP_SID`.

## 3) Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, enter a destination number in E.164 format (`+49...`), then click **Call**.

## 4) Deploy to Vercel

1. Push project to a Git provider.
2. Import in Vercel.
3. Add all env vars from `.env.local` into Vercel Project Settings.
4. Deploy.
5. Update your TwiML App Voice URL to your production domain if needed.

## API Endpoints

- `GET /api/token`: creates a Twilio access token for browser voice calls.
- `POST /api/voice/outgoing`: TwiML webhook that dials the number passed in `To`.

## Notes

- Use HTTPS in production (required for stable microphone/WebRTC behavior).
- For best call quality/no interruptions: wired or strong network, low CPU load, and nearest Twilio edge.
