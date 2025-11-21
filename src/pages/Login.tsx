import React, { useEffect, useState } from "react";
import { CapacitorHttp } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import "../styles/Login.css";

import logo from "../assets/Nirvaana Yoga logo- circular logo image 1.png";
import { OTP_ENDPOINT, OTP_VERIFY_ENDPOINT } from "../constants";
import { Otp } from "./Otp";
import { isNativeRuntime } from "../utils/platform";

type JsonResponse = {
  status: number;
  data: unknown;
};

type RequestStatus = "idle" | "loading" | "success" | "error";

const isErrorRecord = (value: unknown): value is Record<string, any> =>
  typeof value === "object" && value !== null;

const parseResponseData = (value: unknown) => {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
};

/* ------------------------------------------------------------------
   UNIVERSAL POST CALL -- Works for Android, iOS, Web
------------------------------------------------------------------ */
const postJson = async (url: string, body: Record<string, unknown>): Promise<JsonResponse> => {
  if (isNativeRuntime()) {
    try {
      const response = await CapacitorHttp.request({
        url,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: body,
        connectTimeout: 15000,
      });

      return { status: response.status, data: parseResponseData(response.data) };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unable to reach the server.";
      const platformHint =
        " Ensure the Android network security config trusts https://nyservices.nirvaanayoga.com:8443.";
      throw new Error(`${msg}.${platformHint}`);
    }
  }

  const fetchRes = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await fetchRes.text();
  let parsed: unknown = {};
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }
  return { status: fetchRes.status, data: parsed };
};

/* ------------------------------------------------------------------
   LOGIN COMPONENT
------------------------------------------------------------------ */
export const Login: React.FC = () => {
  const [countryCode, setCountryCode] = useState<string>("+91");
  const [mobile, setMobile] = useState<string>("");
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [feedback, setFeedback] = useState("");
  const [otp, setOtp] = useState("");
  const [route, setRoute] = useState<string>(
    typeof window === "undefined" ? "/login" : window.location.pathname
  );

  useEffect(() => {
    const handlePopState = () => setRoute(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (path: "/login" | "/otp" | "/home") => {
    window.history.pushState(null, "", path);
    setRoute(path);
  };

  const handleMobileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/[^0-9]/g, "");
    if (value.length <= 10) {
      setMobile(value);
    }
  };

  const sanitizedMobile = mobile.trim();
  const isValidMobile = /^\d{10}$/.test(sanitizedMobile);
  const isValidOtp = /^\d{4}$/.test(otp);
  const serverPhoneNumber = sanitizedMobile;

  const showErrorFeedback = (message: string) => {
    setStatus("error");
    setFeedback(message);
  };

  /* ------------------------------------------------------------------
     SEND OTP
  ------------------------------------------------------------------ */
  const handleSendOtp = async () => {
    if (!isValidMobile || status === "loading") {
      showErrorFeedback("Enter a valid 10-digit mobile number.");
      return;
    }

    setStatus("loading");
    setFeedback("");

    try {
      const response = await postJson(OTP_ENDPOINT, {
        phoneNumber: serverPhoneNumber,
      });

      if (response.status < 200 || response.status >= 300) {
        const err = response.data;
        const msg =
          isErrorRecord(err) && (err.message || err.phoneNumber)
            ? err.message || err.phoneNumber
            : "Unable to send OTP right now.";
        throw new Error(msg);
      }

      setStatus("success");
      setFeedback("OTP sent successfully.");
      setOtp("");
      navigate("/otp");
    } catch (error) {
      console.error("Send OTP Error:", error);
      showErrorFeedback(
        error instanceof Error ? error.message : "Unable to send OTP right now. Try again."
      );
    }
  };

  /* ------------------------------------------------------------------
     VERIFY OTP
  ------------------------------------------------------------------ */
  const handleVerifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isValidOtp) {
      showErrorFeedback("Enter the 4-digit OTP.");
      return;
    }

    if (!isValidMobile) {
      showErrorFeedback("Invalid phone number. Please restart the login flow.");
      navigate("/login");
      return;
    }

    setStatus("loading");
    setFeedback("");

    try {
      const response = await postJson(OTP_VERIFY_ENDPOINT, {
        phoneNumber: serverPhoneNumber,
        otp,
      });

      if (response.status < 200 || response.status >= 300) {
        const err = response.data;
        const msg =
          isErrorRecord(err) && (err.message || err.otp)
            ? err.message || err.otp
            : "Unable to verify OTP right now.";
        throw new Error(msg);
      }

      // Store the token
      if (isErrorRecord(response.data)) {
        const token = response.data.accessToken || response.data.token;
        if (typeof token === "string") {
          await Preferences.set({ key: "accessToken", value: token });
        }
      }

      setStatus("success");
      setFeedback("OTP verified successfully.");
      setOtp("");
      navigate("/home");
    } catch (error) {
      console.error("Verify OTP Error:", error);
      showErrorFeedback(
        error instanceof Error ? error.message : "Unable to verify OTP right now. Try again."
      );
    }
  };

  /* ------------------------------------------------------------------
     RESET TO LOGIN
  ------------------------------------------------------------------ */
  const resetToLogin = () => {
    navigate("/login");
    setOtp("");
    setFeedback("");
    setStatus("idle");
  };

  /* ------------------------------------------------------------------
     SHOW OTP SCREEN
  ------------------------------------------------------------------ */
  if (route === "/otp") {
    return (
      <Otp
        otp={otp}
        setOtp={(value) => setOtp(value.replace(/[^0-9]/g, ""))}
        handleVerifyOtp={handleVerifyOtp}
        handleSendOtp={handleSendOtp}
        resetToLogin={resetToLogin}
        feedback={feedback}
        status={status}
      />
    );
  }

  if (route === "/home") {
    return null;
  }

  /* ------------------------------------------------------------------
     LOGIN UI
  ------------------------------------------------------------------ */
  return (
    <div className="login-container">
      <div className="logo-section">
        <div className="logo-circle">
          <img src={logo} alt="Nirvaana Yoga" />
        </div>
      </div>

      <div className="welcome-section">
        <h2 className="welcome-title">Welcome</h2>
        <p className="welcome-subtitle">Enter your mobile number to continue</p>
      </div>

      <div className="input-box">
        <div className="input-row">
          <div className="country-input">
            <label className="input-label" htmlFor="login-country">Country</label>
            <select
              id="login-country"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="country-select"
            >
              <option value="+91">+91</option>
              <option value="+1">+1</option>
              <option value="+44">+44</option>
              <option value="+61">+61</option>
            </select>
          </div>

          <div className="mobile-input-container">
            <label className="input-label" htmlFor="login-mobile">Mobile number</label>
            <input
              id="login-mobile"
              type="tel"
              placeholder="Your mobile number"
              value={mobile}
              onChange={handleMobileChange}
              className="mobile-input"
              maxLength={10}
              inputMode="numeric"
            />
          </div>
        </div>

        <button
          type="button"
          className={`otp-button${!isValidMobile || status === "loading" ? " disabled" : ""}`}
          disabled={!isValidMobile || status === "loading"}
          onClick={handleSendOtp}
        >
          {status === "loading" ? "Sending..." : "Send OTP"}
        </button>

        {feedback && (
          <p
            className={`login-feedback ${
              status === "error" ? "login-feedback--error" : "login-feedback--success"
            }`}
          >
            {feedback}
          </p>
        )}

        <div className="divider"><span>Or</span></div>

        <div className="social-buttons">
          <button className="social-btn google">Login with Google</button>
          <button className="social-btn apple">Login with Apple</button>
          <button className="social-btn facebook">Login with Facebook</button>
        </div>

        <p className="create-account">
          Don't have an account yet?{" "}
          <button type="button" className="create-link">Create Account</button>
        </p>
      </div>
    </div>
  );
};
