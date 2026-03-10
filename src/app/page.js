"use client";

import { useEffect, useState } from "react";
import { Device } from "@twilio/voice-sdk";

export default function Home() {
  const [device, setDevice] = useState(null);
  const [call, setCall] = useState(null);
  const [number, setNumber] = useState("");
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    async function init() {
      const res = await fetch("/api/token");
      const data = await res.json();

      console.log("TOKEN: " + data.token)

      const device = new Device(data.token, { edge: "frankfurt" });

      device.on("registered", () => setStatus("Ready"));
      device.on("error", (err) => setStatus(err.message));

      await device.register();
      setDevice(device);
    }

    init();
  }, []);

  async function startCall() {
    if (!device) return;

    const call = await device.connect({
      params: { To: number },
    });

    setCall(call);
    setStatus("Calling...");

    call.on("accept", () => setStatus("In call"));
    call.on("disconnect", () => {
      setStatus("Call ended");
      setCall(null);
    });
  }

  function hangup() {
    call?.disconnect();
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Twilio Dialer</h1>

      <input
        placeholder="+49123456789"
        value={number}
        onChange={(e) => setNumber(e.target.value)}
      />

      <div style={{ marginTop: 10 }}>
        <button onClick={startCall} disabled={!device || call}>
          Call
        </button>

        <button onClick={hangup} disabled={!call}>
          Hang up
        </button>
      </div>

      <p>Status: {status}</p>
    </main>
  );
}