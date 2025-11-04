import React from "react";
import "../styles/FreeContent.css";
import Logo from "../assets/Nirvaana Yoga logo- circular logo image 1.png";
import { Navbar } from "../components/Navbar";

export const FreeContent = () => {
  const lessons = [
    {
      id: 1,
      title: "Gentle Wake-up",
      tag: "Yoga",
      duration: "10 minutes",
      videoUrl: "https://microservices.nirvaanayoga.com/api/videos/stream/1A_T_R",
    },
    {
      id: 2,
      title: "Gentle Wake-up",
      tag: "Yoga",
      duration: "15 minutes",
      videoUrl: "https://microservices.nirvaanayoga.com/api/videos/stream/1A_T_R",
    },
    {
      id: 3,
      title: "Gentle Wake-up",
      tag: "Meditation",
      duration: "7 minutes",
      videoUrl: "https://microservices.nirvaanayoga.com/api/videos/stream/1A_T_R",
    },
  ];

  return (
    <div className="free-content">
      {/* ---------- HEADER ---------- */}
      <div className="free-header">
        <div className="free-logo-section">
          <img src={Logo} alt="Nirvaana Yoga Logo" className="free-logo" />
          <h3>
            Welcome <span>there</span>
          </h3>
        </div>

        {/* ---------- TABS ---------- */}
        <div className="free-tabs">
          <a href="/free-guided-yoga" className="nav-link" onClick={(e) => {
            e.preventDefault();
            window.history.pushState(null, '', "/free-guided-yoga");
          }}>
            <span className="active-tab">| Free Guided Yoga</span>
          </a>
          <a href="/personalised-yoga" className="nav-link" onClick={(e) => {
            e.preventDefault();
            window.history.pushState(null, '', "/personalised-yoga");
          }}>
            Personalised Yoga
          </a>
          <a href="/meditation" className="nav-link" onClick={(e) => {
            e.preventDefault();
            window.history.pushState(null, '', "/meditation");
          }}>
            Meditation
          </a>
        </div>
      </div>

      {/* ---------- MAIN VIDEO ---------- */}
      <div className="free-section">
        <h4>Yoga for Absolute Beginners</h4>
        <button className="see-more">see more</button>
      </div>

      <div className="video-container">
        <video
          src="https://microservices.nirvaanayoga.com/api/videos/stream/1A_T_R"
          controls
          preload="auto"
          className="main-video"
          playsInline
          onError={() =>
            alert("This video could not be played. Please check the stream URL.")
          }
        ></video>
        <div className="video-details">
          <h5>Beginner’s Guide to Yoga</h5>
          <button className="play-all-btn">▶ Play all</button>
        </div>
      </div>

      {/* ---------- LET’S BEGIN SECTION ---------- */}
      <div className="lets-section">
        <div className="lets-header">
          <h4>Let’s Begin!</h4>
          <button className="see-more">see more</button>
        </div>

        <div className="lets-list">
          {lessons.map((lesson) => (
            <div key={lesson.id} className="lesson-card">
              <div className="lesson-thumb-wrapper">
                <video
                  src={lesson.videoUrl}
                  muted
                  playsInline
                  preload="metadata"
                  className="lesson-thumb"
                  onMouseOver={(e) => e.currentTarget.play()}
                  onMouseOut={(e) => e.currentTarget.pause()}
                />
                <div className="lesson-duration">{lesson.duration}</div>
              </div>

              <div className="lesson-content">
                <div className="lesson-title-row">
                  <h5>{lesson.title}</h5>
                  <span className="lesson-tag">{lesson.tag}</span>
                </div>
                <p className="para-content">
                  Set your goals for a personalized experience—or skip. Set your
                  goals for a personalized experience—or skip.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- NAVBAR ---------- */}
      <Navbar />
    </div>
  );
};
