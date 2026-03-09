import twilio from "twilio";

export const runtime = "nodejs";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export async function GET() {
  try {
    const accountSid = requiredEnv("TWILIO_ACCOUNT_SID");
    const apiKey = requiredEnv("TWILIO_API_KEY");
    const apiSecret = requiredEnv("TWILIO_API_SECRET");
    const twimlAppSid = requiredEnv("TWILIO_TWIML_APP_SID");

    const AccessToken = twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    const identity = `agent-${Math.random().toString(36).slice(2, 10)}`;
    const token = new AccessToken(accountSid, apiKey, apiSecret, { identity, ttl: 3600 });

    token.addGrant(
      new VoiceGrant({
        outgoingApplicationSid: twimlAppSid,
        incomingAllow: false,
      }),
    );

    return Response.json({ token: token.toJwt(), identity });
  } catch (error) {
    return Response.json(
      { error: error.message || "Could not create Twilio access token." },
      { status: 500 },
    );
  }
}
