"use client";

import { useEffect, useMemo, useState } from "react";
import { Device } from "@twilio/voice-sdk";

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

export default function Home() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [status, setStatus] = useState("Loading...");
  const [device, setDevice] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [isBusy, setIsBusy] = useState(false);

  const canCall = useMemo(
    () => Boolean(device) && isE164(phoneNumber) && !activeCall && !isBusy,
    [device, phoneNumber, activeCall, isBusy],
  );

  useEffect(() => {
    let mounted = true;
    let currentDevice;

    async function setupDevice() {
      try {
        const response = await fetch("/api/token", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Could not fetch Twilio token.");
        }

        currentDevice = new Device(data.token, {
          edge: process.env.NEXT_PUBLIC_TWILIO_EDGE || "ashburn",
          codecPreferences: ["opus", "pcmu"],
          enableRingingState: true,
        });

        currentDevice.on("registered", () => mounted && setStatus("Ready"));
        currentDevice.on("error", (error) => mounted && setStatus(`Error: ${error.message}`));
        currentDevice.on("tokenWillExpire", async () => {
          try {
            const refreshResponse = await fetch("/api/token", { cache: "no-store" });
            const refreshData = await refreshResponse.json();
            if (refreshResponse.ok && refreshData?.token) {
              currentDevice.updateToken(refreshData.token);
            }
          } catch {
            // Keep current token; next refresh cycle may recover.
          }
        });

        await currentDevice.register();
        if (mounted) {
          setDevice(currentDevice);
        }
      } catch (error) {
        if (mounted) {
          setStatus(`Setup failed: ${error.message}`);
        }
      }
    }

    setupDevice();

    return () => {
      mounted = false;
      if (currentDevice) {
        currentDevice.destroy();
      }
    };
  }, []);

  function bindCallEvents(call) {
    call.on("accept", () => setStatus("In call"));
    call.on("disconnect", () => {
      setActiveCall(null);
      setStatus("Call ended");
      setIsBusy(false);
    });
    call.on("reject", () => {
      setActiveCall(null);
      setStatus("Call rejected");
      setIsBusy(false);
    });
    call.on("cancel", () => {
      setActiveCall(null);
      setStatus("Call canceled");
      setIsBusy(false);
    });
    call.on("error", (error) => {
      setActiveCall(null);
      setStatus(`Call error: ${error.message}`);
      setIsBusy(false);
    });
  }

  async function handleCall() {
    if (!device || !isE164(phoneNumber)) {
      setStatus("Enter a valid number in E.164 format (e.g. +491234567890).");
      return;
    }

    setIsBusy(true);
    setStatus("Connecting...");

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const normalizedPhone = normalizePhone(phoneNumber);
      const call = await device.connect({ params: { To: normalizedPhone, to: normalizedPhone } });
      setActiveCall(call);
      bindCallEvents(call);
    } catch (error) {
      setStatus(`Connection failed: ${error.message}`);
      setIsBusy(false);
    }
  }

  function handleHangup() {
    if (activeCall) {
      activeCall.disconnect();
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "440px",
          border: "1px solid #2f2f2f",
          borderRadius: "12px",
          padding: "20px",
          display: "grid",
          gap: "12px",
        }}
      >
        <h1 style={{ fontSize: "20px" }}>Twilio Live Dialer</h1>
        <p style={{ fontSize: "14px", opacity: 0.8 }}>
          Enter customer number in E.164 format, then start the call.
        </p>

        <input
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(event.target.value)}
          placeholder="+491234567890"
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #444",
            background: "transparent",
            color: "inherit",
          }}
        />

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleCall}
            disabled={!canCall}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #0d6d30",
              background: "#137f3a",
              color: "#fff",
              opacity: canCall ? 1 : 0.5,
              cursor: canCall ? "pointer" : "not-allowed",
            }}
          >
            Call
          </button>
          <button
            onClick={handleHangup}
            disabled={!activeCall}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #8a1d1d",
              background: "#a32020",
              color: "#fff",
              opacity: activeCall ? 1 : 0.5,
              cursor: activeCall ? "pointer" : "not-allowed",
            }}
          >
            Hang up
          </button>
        </div>

        <p style={{ fontSize: "13px", opacity: 0.85 }}>Status: {status}</p>
      </section>
    </main>
  );
}
