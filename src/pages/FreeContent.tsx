import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import "../styles/FreeContent.css";
import Logo from "../assets/Nirvaana Yoga logo- circular logo image 1.png";
import {
  FREE_ASANA_CODES_ENDPOINT,
  VIDEO_STREAM_ENDPOINT_BASE,
} from "../constants";

type ScreenOrientationLike = {
  lock?: (
    orientation:
      | "portrait"
      | "portrait-primary"
      | "portrait-secondary"
      | "landscape"
      | "landscape-primary"
      | "landscape-secondary"
  ) => Promise<void> | void;
  unlock?: () => void;
};

type VideoItem = {
  id: string;
  title: string;
  tag: string;
  duration: string;
  videoUrl: string;
  resolution?: string;
};

export const FreeContent = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playlist, setPlaylist] = useState<VideoItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlayAllActive, setIsPlayAllActive] = useState(true); // Set to true to enable autoplay
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [attemptedResolutions, setAttemptedResolutions] = useState<{ [videoId: string]: string[] }>({});

  const loadVideoBlob = useCallback(async (videoId: string, token: string, resolution: string = '1080p') => {
    const url = `${VIDEO_STREAM_ENDPOINT_BASE}/${videoId}?token=${token}&resolution=${resolution}`;
    const res = await CapacitorHttp.request({
      method: 'GET',
      url,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'video/mp4',
      },
      responseType: 'arraybuffer',
    });
    if (res.status === 206 || res.status === 200) {
      const blob = new Blob([res.data], { type: 'video/mp4' });
      const blobUrl = URL.createObjectURL(blob);
      return blobUrl;
    } else {
      throw new Error(`Failed to load video: ${res.status}`);
    }
  }, []);

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

  const lockLandscape = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    if (!document.fullscreenElement && video.requestFullscreen) {
      try {
        await video.requestFullscreen();
      } catch {
        /* ignore fullscreen errors */
      }
    }
    const orientation = (window.screen as any).orientation as ScreenOrientationLike | undefined;
    if (orientation?.lock) {
      try {
        await orientation.lock("landscape");
      } catch {
        /* ignore orientation lock errors */
      }
    }
  }, []);

  const lockPortrait = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    if (!document.fullscreenElement && video.requestFullscreen) {
      try {
        await video.requestFullscreen();
      } catch {
        /* ignore fullscreen errors */
      }
    }
    const orientation = (window.screen as any).orientation as ScreenOrientationLike | undefined;
    if (orientation?.lock) {
      try {
        await orientation.lock("portrait");
      } catch {
        /* ignore orientation lock errors */
      }
    }
  }, []);

  const unlockOrientation = useCallback(() => {
    const orientation = (window.screen as any).orientation as ScreenOrientationLike | undefined;
    if (orientation?.unlock) {
      try {
        orientation.unlock();
      } catch {
        /* ignore unlock errors */
      }
    }
  }, []);

  const handlePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.videoWidth > video.videoHeight) {
      lockLandscape();
    } else {
      lockPortrait();
    }
  }, [lockLandscape, lockPortrait]);

  const fetchPlaylist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { value: fetchedToken } = await Preferences.get({ key: "accessToken" });
      console.log("Fetched accessToken from Preferences:", fetchedToken ? "Token found" : "No token found");
      if (!fetchedToken) {
        throw new Error("You must be logged in to view this content.");
      }
      setAccessToken(fetchedToken);

      const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${fetchedToken}`,
      };
      console.log("Request Headers for FREE_ASANA_CODES_ENDPOINT:", headers);

      let videoIds: string[] = [];
      if (Capacitor.getPlatform() === "web") {
        const res = await fetch(FREE_ASANA_CODES_ENDPOINT, { headers });
        if (res.status === 401) throw new Error("Your session has expired. Please log in again.");
        if (!res.ok) throw new Error(`Video API failed (${res.status})`);
        const text = await res.text();
        videoIds = text ? JSON.parse(text) : [];
      } else {
        const res = await CapacitorHttp.get({
          url: FREE_ASANA_CODES_ENDPOINT,
          headers,
        });
        if (res.status === 401) throw new Error("Your session has expired. Please log in again.");
        videoIds = res.data;
      }

      if (
        !Array.isArray(videoIds) ||
        videoIds.some((id) => typeof id !== "string")
      ) {
        throw new Error("Invalid data from API: expected an array of strings.");
      }

      const normalized = await Promise.all(videoIds.map(async (id, index) => {
        let videoUrl: string;
        if (Capacitor.getPlatform() === "web") {
          videoUrl = `${VIDEO_STREAM_ENDPOINT_BASE}/${id}?token=${fetchedToken}`;
        } else {
          try {
            videoUrl = await loadVideoBlob(id, fetchedToken, '1080p');
          } catch (err) {
            console.error(`Failed to load blob for ${id}:`, err);
            videoUrl = `${VIDEO_STREAM_ENDPOINT_BASE}/${id}?token=${fetchedToken}`;
          }
        }
        return {
          id: id,
          title: `Yoga Video ${index + 1}`,
          tag: "Yoga",
          duration: "",
          videoUrl,
          resolution: '1080p',
        };
      }));

      if (!normalized.length)
        throw new Error("No videos returned from the API.");

      setPlaylist(normalized);
      setCurrentIndex(0);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const lessons = useMemo(
    () => (playlist.length > 0 ? playlist.slice(1) : []),
    [playlist]
  );
  const currentVideo = playlist[currentIndex];

  const handleVideoError = useCallback(async (): Promise<void> => {
    const video = videoRef.current;
    if (video && video.error) {
      console.error("Video Playback Error:", video.error.message, "Code:", video.error.code);
      setError(`Video Error: ${video.error.message} (Code: ${video.error.code})`);
    } else {
      console.error("An unknown video error occurred.");
      setError("An unknown video error occurred.");
    }

    if (!currentVideo || !accessToken) return;

    const videoId = currentVideo.id;
    const currentResolution = currentVideo.resolution || '1080p';
    const attempted = attemptedResolutions[videoId] || [];

    if (currentResolution === '1080p' && !attempted.includes('720p')) {
        let newVideoUrl: string;
        if (Capacitor.getPlatform() === "web") {
          newVideoUrl = `${VIDEO_STREAM_ENDPOINT_BASE}/${videoId}?token=${accessToken}&resolution=720p`;
        } else {
          try {
            newVideoUrl = await loadVideoBlob(videoId, accessToken, '720p');
          } catch (err) {
            console.error(`Failed to load blob for ${videoId} at 720p:`, err);
            newVideoUrl = `${VIDEO_STREAM_ENDPOINT_BASE}/${videoId}?token=${accessToken}&resolution=720p`;
          }
        }
        setPlaylist(prevPlaylist => prevPlaylist.map(item =>
            item.id === videoId ? { ...item, videoUrl: newVideoUrl, resolution: '720p' } : item
        ));
        setAttemptedResolutions(prev => ({
            ...prev,
            [videoId]: [...attempted, '720p']
        }));
    } else {
        alert("This video could not be played. Please check the stream URL.");
    }
  }, [currentVideo, accessToken, attemptedResolutions, setPlaylist, setAttemptedResolutions, loadVideoBlob]);

  useEffect(() => {
    fetchPlaylist();
  }, [fetchPlaylist]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playlist.length) return;
    
    video.load(); // Load the new video source when the index or playlist changes

    if (isPlayAllActive) {
      video.play().catch(() => {
        console.warn("Autoplay was prevented. User interaction might be required.");
        setIsPlayAllActive(false); // If autoplay fails, update state to reflect it
      });
    } else {
      video.pause();
    }
  }, [currentIndex, isPlayAllActive, playlist]);

  useEffect(() => {
    if (currentVideo) {
      console.log("Attempting to play video with URL:", currentVideo.videoUrl);
    }
  }, [currentVideo]);

  const handleVideoEnded = useCallback(() => {
    if (isPlayAllActive && currentIndex < playlist.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsPlayAllActive(false);
    }
    unlockOrientation();
  }, [currentIndex, isPlayAllActive, playlist.length, unlockOrientation]);

  return (
    <div className="free-content">
      {/* HEADER */}
      <div className="free-header">
        <div className="free-logo-section">
          <img src={Logo} alt="Nirvaana Yoga Logo" className="free-logo" />
          <h3>Welcome <span>there</span></h3>
        </div>

        <div className="free-tabs">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              fetchPlaylist();
            }}
          >
            <span className="active-tab">Free Guided Yoga</span>
          </a>
        </div>
      </div>

      {/* MAIN VIDEO */}
      <div className="video-container">
        {currentVideo ? (
          <video
            key={currentVideo.id}
            ref={videoRef}
            src={currentVideo.videoUrl}
            controls
            preload="auto"
            className="main-video"
            playsInline
            onPlay={handlePlay}
            onEnded={handleVideoEnded}
            onError={handleVideoError}
          ></video>
        ) : (
          <div className="video-fallback">
            {loading ? "Loading videos..." : error || "No videos available."}
          </div>
        )}

        <div className="video-details">
          <h5>{currentVideo ? currentVideo.title : "Loading..."}</h5>
          <button
            className="play-all-btn"
            onClick={() => setIsPlayAllActive(prev => !prev)}
            aria-pressed={isPlayAllActive}
            disabled={!playlist.length}
          >
            {isPlayAllActive ? "❚❚ Pause" : "▶ Play"}
          </button>
        </div>
      </div>

      {/* LESSONS */}
      <div className="lets-section">
        {lessons.map((lesson) => (
          <div key={lesson.id} className="lesson-card">
            <video
              src={lesson.videoUrl}
              muted
              playsInline
              preload="metadata"
              className="lesson-thumb"
              onError={() => console.warn(`Thumbnail failed for ${lesson.id}`)}
            />
            <h5>{lesson.title}</h5>
          </div>
        ))}
      </div>
    </div>
  );
};
