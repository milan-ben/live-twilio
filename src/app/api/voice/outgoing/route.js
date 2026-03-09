import twilio from "twilio";

export const runtime = "nodejs";

function toXmlResponse(twiml) {
  return new Response(twiml.toString(), {
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

function isE164(value) {
  return /^\+[1-9]\d{7,14}$/.test(value);
}

function normalizePhone(value) {
  const input = String(value || "").trim();
  if (!input) return "";
  const compact = input.replace(/[\s().-]/g, "");
  if (compact.startsWith("00")) {
    return `+${compact.slice(2)}`;
  }
  return compact;
}

export async function POST(request) {
  const twiml = new twilio.twiml.VoiceResponse();
  const callerId = process.env.TWILIO_CALLER_ID;

  if (!callerId || !isE164(callerId)) {
    twiml.say("Call setup is incomplete. Missing valid caller ID.");
    twiml.hangup();
    return toXmlResponse(twiml);
  }

  const formData = await request.formData();
  const toRaw =
    formData.get("To") ||
    formData.get("to") ||
    formData.get("PhoneNumber") ||
    formData.get("phoneNumber") ||
    "";
  const to = normalizePhone(toRaw);

  if (!isE164(to)) {
    twiml.say("The destination number is invalid.");
    twiml.hangup();
    return toXmlResponse(twiml);
  }

  const dial = twiml.dial({
    callerId,
    answerOnBridge: true,
    timeout: 20,
  });
  dial.number({}, to);

  return toXmlResponse(twiml);
}

export async function GET() {
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say("Voice endpoint is online.");
  return toXmlResponse(twiml);
}
