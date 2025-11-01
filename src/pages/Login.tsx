import React, { useState } from 'react';
import '../styles/Login.css';

import logo from '../assets/Nirvaana Yoga logo- circular logo image 1.png';
import { OTP_ENDPOINT, OTP_VERIFY_ENDPOINT } from '../constants';
import { Otp } from './Otp';

export const Login: React.FC = () => {
  const [countryCode, setCountryCode] = useState<string>('+91');
  const [mobile, setMobile] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState<string>('');
  const [otp, setOtp] = useState<string>('');

  const handleMobileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 10) {
      setMobile(value);
    }
  };

  const handleSendOtp = async () => {
    const trimmedMobile = mobile.trim();

    if (trimmedMobile.length !== 10 || status === 'loading') {
      return;
    }

    if (!/^\d+$/.test(trimmedMobile)) {
      setStatus('error');
      setFeedback('Mobile number should contain only digits.');
      return;
    }

    setStatus('loading');
    setFeedback('');

    try {
      const response = await fetch(OTP_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: trimmedMobile }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message =
          typeof errorBody === 'object' && errorBody !== null
            ? errorBody.message || errorBody.phoneNumber || JSON.stringify(errorBody)
            : 'Unexpected response';
        throw new Error(message);
      }

      setStatus('success');
      setFeedback('OTP sent successfully.');
      window.history.pushState(null, '', '/otp');
      setOtp('');
    } catch (error) {
      console.error('Failed to send OTP:', error);
      setStatus('error');
      setFeedback(
        error instanceof Error ? error.message : 'Unable to send OTP right now. Please try again.'
      );
    }
  };

  const isSendDisabled = mobile.trim().length < 10 || status === 'loading';

  const handleVerifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (otp.length !== 4) {
      setFeedback('Please enter the 4-digit OTP.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setFeedback('');

    try {
      const response = await fetch(OTP_VERIFY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: mobile, otp: otp }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message =
          typeof errorBody === 'object' && errorBody !== null
            ? errorBody.message || errorBody.otp || JSON.stringify(errorBody)
            : 'Unexpected response';
        throw new Error(message);
      }

      setStatus('success');
      setFeedback('OTP verified successfully.');
      window.history.pushState(null, '', '/home');
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      setStatus('error');
      setFeedback(
        error instanceof Error ? error.message : 'Unable to verify OTP right now. Please try again.'
      );
    }
  };

  const resetToLogin = () => {
    window.history.pushState(null, '', '/login');
    setOtp('');
    setStatus('idle');
    setFeedback('');
  };

  if (window.location.pathname === '/otp') {
    return (
      <Otp
        otp={otp}
        setOtp={setOtp}
        handleVerifyOtp={handleVerifyOtp}
        handleSendOtp={handleSendOtp}
        resetToLogin={resetToLogin}
        feedback={feedback}
        status={status}
      />
    );
  }

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
            <label className="input-label" htmlFor="login-country">
              Country
            </label>
            <select
              id="login-country"
              value={countryCode}
              onChange={(event) => setCountryCode(event.target.value)}
              className="country-select"
            >
              <option value="+91">+91</option>
              <option value="+1">+1</option>
              <option value="+44">+44</option>
              <option value="+61">+61</option>
            </select>
          </div>

          <div className="mobile-input-container">
            <label className="input-label" htmlFor="login-mobile">
              Mobile number
            </label>
            <input
              id="login-mobile"
              type="tel"
              placeholder="Your mobile number"
              value={mobile}
              onChange={handleMobileChange}
              className="mobile-input"
              maxLength={10}
              inputMode="numeric"
              aria-describedby="login-mobile-help"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSendOtp}
          disabled={isSendDisabled}
          className={`otp-button${isSendDisabled ? ' disabled' : ''}`}
        >
          {status === 'loading' ? 'Sending…' : 'Send OTP'}
        </button>

        {feedback && (
          <p
            className={`login-feedback${
              status === 'error' ? ' login-feedback--error' : ' login-feedback--success'
            }`}
            role="status"
          >
            {feedback}
          </p>
        )}

        <div className="divider">
          <span>Or</span>
        </div>

        <div className="social-buttons">
          <button type="button" className="social-btn google">
            Login with Google
          </button>
          <button type="button" className="social-btn apple">
            Login with Apple
          </button>
          <button type="button" className="social-btn facebook">
            Login with Facebook
          </button>
        </div>

        <p className="create-account">
          Don't have an account yet?{' '}
          <button type="button" className="create-link">
            Create Account
          </button>
        </p>
      </div>
    </div>
  );
};