import twilio from "twilio";

export const runtime = "nodejs";

export async function POST(req) {
  const twiml = new twilio.twiml.VoiceResponse();

  const formData = await req.formData();
  const to = formData.get("To");

  if (!to) {
    twiml.say("No destination number provided.");
    twiml.hangup();
  } else {
    const dial = twiml.dial({
      callerId: process.env.TWILIO_CALLER_ID,
    });

    dial.number(to);
  }

  return new Response(twiml.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}