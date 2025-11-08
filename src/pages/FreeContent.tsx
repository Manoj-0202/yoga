import React, { useEffect, useMemo, useRef, useState } from "react";
import "../styles/FreeContent.css";
import Logo from "../assets/Nirvaana Yoga logo- circular logo image 1.png";
import { PlayIcon } from "../icons/PlayIcon";
import { PauseIcon } from "../icons/PauseIcon";
import { FullscreenIcon } from "../icons/FullscreenIcon";
import { VolumeOnIcon } from "../icons/VolumeOnIcon";
import { VolumeOffIcon } from "../icons/VolumeOffIcon";
import { FullscreenExitIcon } from "../icons/FullscreenExitIcon";

type VideoLesson = {
  id: string;
  title: string;
  tag: string;
  duration: string;
  videoUrl: string;
  description: string;
};

const formatTime = (timeInSeconds: number) => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
};

export const FreeContent = () => {
  const playlist = useMemo<VideoLesson[]>(
    () => [
      {
        id: "hero",
        title: "Beginner's Guide to Yoga",
        tag: "Yoga",
        duration: "13 minutes",
        videoUrl: "http://54.234.26.129:8082/api/v1/videos/stream/10A",
        description:
          "Ease into your practice with a guided sequence that wakes the body and centers the breath.",
      },
      {
        id: "1A",
        title: "Gentle Wake-up",
        tag: "Yoga",
        duration: "10 minutes",
        videoUrl: "http://54.234.26.129:8082/api/v1/videos/stream/1A",
        description:
          "Set your goals for a personalized experience—or skip. Start with a light stretch to wake the body.",
      },
      {
        id: "2A",
        title: "Gentle Wake-up",
        tag: "Yoga",
        duration: "15 minutes",
        videoUrl: "http://54.234.26.129:8082/api/v1/videos/stream/2A",
        description:
          "Ease into mindful movement and breathwork to bring balance into your day.",
      },
      {
        id: "3A",
        title: "Gentle Wake-up",
        tag: "Meditation",
        duration: "7 minutes",
        videoUrl: "http://54.234.26.129:8082/api/v1/videos/stream/3A",
        description:
          "Find stillness with a calm visualisation that helps you reset and prepare.",
      },
    ],
    []
  );

  const lessonCards = playlist.slice(1);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlayAllActive, setIsPlayAllActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  const activeVideo = playlist[currentVideoIndex];
  const upcomingVideo =
    currentVideoIndex < playlist.length - 1
      ? playlist[currentVideoIndex + 1]
      : null;

  useEffect(() => {
    const player = videoRef.current;
    if (!player) return;

    player.load();
    if (isPlayAllActive) {
      player.play().catch(() => {
        setIsPlayAllActive(false);
      });
    }
  }, [currentVideoIndex, isPlayAllActive]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = document.fullscreenElement != null;
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleSelectVideo = (index: number) => {
    setCurrentVideoIndex(index);
    setIsPlayAllActive(false);
  };

  const toggleFullscreen = () => {
    const player = playerRef.current;
    if (!player) return;

    if (!isFullscreen) {
      const anyPlayer = player as HTMLDivElement & {
        webkitRequestFullscreen?: () => Promise<void> | void;
        mozRequestFullScreen?: () => Promise<void> | void;
        msRequestFullscreen?: () => Promise<void> | void;
      };

      if (anyPlayer.requestFullscreen) {
        anyPlayer.requestFullscreen().catch(() => undefined);
      } else if (anyPlayer.webkitRequestFullscreen) {
        anyPlayer.webkitRequestFullscreen();
      } else if (anyPlayer.mozRequestFullScreen) {
        anyPlayer.mozRequestFullScreen();
      } else if (anyPlayer.msRequestFullscreen) {
        anyPlayer.msRequestFullscreen();
      }
    } else {
      document.exitFullscreen();
    }
  };

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    const progressPercent = (video.currentTime / video.duration) * 100;
    setProgress(progressPercent);
    setCurrentTime(video.currentTime);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
  };

  const handleProgressSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressContainer = progressRef.current;
    const video = videoRef.current;
    if (!progressContainer || !video) return;

    const clickPosition = e.nativeEvent.offsetX;
    const width = progressContainer.clientWidth;
    const duration = video.duration;

    video.currentTime = (clickPosition / width) * duration;
  };

  const handlePlayAll = () => {
    setCurrentVideoIndex(0);
    setIsPlayAllActive(true);
    const player = videoRef.current;
    if (!player) return;
    toggleFullscreen();
    player.play().catch(() => setIsPlayAllActive(false));
  };

  const handleVideoEnded = () => {
    if (!isPlayAllActive) return;
    if (currentVideoIndex < playlist.length - 1) {
      setCurrentVideoIndex((prev) => prev + 1);
    } else {
      setIsPlayAllActive(false);
      setCurrentVideoIndex(0);
    }
  };

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
          <a
            href="/free-guided-yoga"
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState(null, "", "/free-guided-yoga");
            }}
          >
            <span className="active-tab"> Free Guided Yoga</span>
          </a>
          <a
            href="/personalised-yoga"
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState(null, "", "/personalised-yoga");
            }}
          >
            Personalised Yoga
          </a>
          <a
            href="/meditation"
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState(null, "", "/meditation");
            }}
          >
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
        <div className="hero-video-panel">
          <div className="custom-video-player" ref={playerRef}>
            <video
              key={activeVideo.id}
              ref={videoRef}
              src={activeVideo.videoUrl}
              preload="auto"
              className="main-video"
              playsInline
              onEnded={handleVideoEnded}
              onError={() =>
                alert("This video could not be played. Please check the stream URL.")
              }
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onClick={togglePlayPause}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
            ></video>
            <div className="controls-overlay">
              <div className="control-bar">
                <div className="controls-group-left">
                  <button className="video-control-btn" onClick={togglePlayPause}>
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                  </button>
                  <button className="video-control-btn" onClick={toggleMute}>
                    {isMuted ? <VolumeOffIcon /> : <VolumeOnIcon />}
                  </button>
                  <span className="time-display">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
                <div className="progress-bar" ref={progressRef} onClick={handleProgressSeek}>
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="controls-group-right">
                  <button className="video-control-btn" onClick={toggleFullscreen}>
                    {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="video-details">
            <div className="video-title-row">
              <h5>{activeVideo.title}</h5>
              <button
                className="play-all-btn"
                onClick={handlePlayAll}
                aria-pressed={isPlayAllActive}
              >
                {isPlayAllActive ? (
                  "Playing..."
                ) : (
                  <>
                    <PlayIcon />
                    <span>Play all</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- LET'S BEGIN SECTION ---------- */}
      <div className="lets-section">
        <div className="lets-header">
          <h4>Let's Begin!</h4>
          <button className="see-more">see more</button>
        </div>

        <div className="lets-list">
          {lessonCards.map((lesson, index) => (
            <div key={lesson.id} className="lesson-card">
              <button
                type="button"
                className="lesson-thumb-wrapper"
                onClick={() => handleSelectVideo(index + 1)}
              >
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
              </button>

              <div className="lesson-content">
                <div className="lesson-title-row">
                  <h5>{lesson.title}</h5>
                  <span className="lesson-tag">{lesson.tag}</span>
                </div>
                <p className="para-content">{lesson.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
