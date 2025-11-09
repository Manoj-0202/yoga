import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../styles/FreeContent.css";
import Logo from "../assets/Nirvaana Yoga logo- circular logo image 1.png";

export const FreeContent = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlayAllActive, setIsPlayAllActive] = useState(false);

  const playlist = useMemo(
    () => [
      {
        id: "hero",
        title: "Beginner’s Guide to Yoga",
        tag: "Yoga",
        duration: "13 minutes",
        videoUrl: "http://54.234.26.129:8082/api/v1/videos/stream/10A",
      },
      {
        id: "1A",
        title: "Gentle Wake-up",
        tag: "Yoga",
        duration: "10 minutes",
        videoUrl: "http://54.234.26.129:8082/api/v1/videos/stream/1A",
      },
      {
        id: "2A",
        title: "Gentle Wake-up",
        tag: "Yoga",
        duration: "15 minutes",
        videoUrl: "http://54.234.26.129:8082/api/v1/videos/stream/2A",
      },
      {
        id: "3A",
        title: "Gentle Wake-up",
        tag: "Meditation",
        duration: "7 minutes",
        videoUrl: "http://54.234.26.129:8082/api/v1/videos/stream/3A",
      },
    ],
    []
  );

  const lessons = useMemo(() => playlist.slice(1), [playlist]);
  const currentVideo = playlist[currentIndex];

  const requestFullscreen = useCallback(() => {
    const video = videoRef.current;
    if (!video || document.fullscreenElement) return;

    const anyVideo = video as HTMLVideoElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
      mozRequestFullScreen?: () => Promise<void> | void;
      msRequestFullscreen?: () => Promise<void> | void;
    };

    const request =
      video.requestFullscreen ||
      anyVideo.webkitRequestFullscreen ||
      anyVideo.mozRequestFullScreen ||
      anyVideo.msRequestFullscreen;

    if (request) {
      try {
        const result = request.call(video);
        if (result instanceof Promise) {
          result.catch(() => undefined);
        }
      } catch {
        /* ignore */
      }
    }
  }, []);

  const handlePlayAll = useCallback(() => {
    setCurrentIndex(0);
    setIsPlayAllActive(true);
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => undefined);
    requestFullscreen();
  }, [requestFullscreen]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.load();
    if (isPlayAllActive) {
      video.play().catch(() => setIsPlayAllActive(false));
    }
  }, [currentIndex, isPlayAllActive]);

  const handleVideoEnded = useCallback(() => {
    if (isPlayAllActive && currentIndex < playlist.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsPlayAllActive(false);
    }
  }, [currentIndex, isPlayAllActive, playlist.length]);

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
            <span className="active-tab"> Free Guided Yoga</span>
          </a>
          <a href="/personalised-yoga" className="nav-link" onClick={(e) => {
            e.preventDefault();
          }}>
            Personalised Yoga
          </a>
          <a href="/meditation" className="nav-link" onClick={(e) => {
            e.preventDefault();
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
          key={currentVideo.id}
          ref={videoRef}
          src={currentVideo.videoUrl}
          controls
          preload="auto"
          className="main-video"
          playsInline
          onPlay={requestFullscreen}
          onEnded={handleVideoEnded}
          onError={() =>
            alert("This video could not be played. Please check the stream URL.")
          }
        ></video>
        <div className="video-details">
          <h5>{currentVideo.title}</h5>
          <button className="play-all-btn" onClick={handlePlayAll} aria-pressed={isPlayAllActive}>
            <span>▶</span>
            <span>{isPlayAllActive ? "Playing..." : "Play all"}</span>
          </button>
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

    </div>
  );
};
