import React, { useEffect, useMemo, useRef, useState } from 'react';
import RetreatSessionImage from '../assets/2636cf86fd541058796aa888a22308faa76d54c6.png';
import SunriseYogaImage from '../assets/2ac9587117280e79e082f330735cc66ae2b7a734.jpg';
import MeditationFlowImage from '../assets/e983ce2b4b2ccbf0bbc60eaa3641675e75f0d223.jpg';
import './Carousel.css';

type Slide = {
  src: string;
  description: React.ReactNode;
  showCta?: boolean;
};

const AUTO_ADVANCE_MS = 4000;

type CarouselProps = {
  onContinue?: () => void;
};

const Carousel: React.FC<CarouselProps> = ({ onContinue }) => {
  const slides = useMemo<Slide[]>(
    () => [
      {
        src: RetreatSessionImage,
        description: (
          <>
            <span className="carousel__description-primary">Yoga</span>{' '}
            made personal
            <br />
            for a <span className="carousel__description-primary">healthy, happy</span>{' '}
            you.
          </>
        ),
      },
      {
        src: SunriseYogaImage,
        description: (
          <>
            <span className="carousel__description-primary">Yoga</span>{' '}
            made personal
            <br />
            for a <span className="carousel__description-primary">healthy, happy</span>{' '}
            you.
          </>
        ),
      },
      {
        src: MeditationFlowImage,
        description: (
          <>
            <span className="carousel__description-primary">Yoga</span>{' '}
            made personal
            <br />
            for a <span className="carousel__description-primary">healthy, happy</span>{' '}
            you.
          </>
        ),
        showCta: true,
      },
    ],
    []
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchCurrentX = useRef<number | null>(null);

  useEffect(() => {
    if (slides.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, AUTO_ADVANCE_MS);

    return () => window.clearInterval(timer);
  }, [slides]);

  const goTo = (nextIndex: number) => {
    const boundedIndex = (nextIndex + slides.length) % slides.length;
    setActiveIndex(boundedIndex);
  };

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    }
  };

  const resetTouchTracking = () => {
    touchStartX.current = null;
    touchCurrentX.current = null;
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0].clientX;
    touchCurrentX.current = null;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    touchCurrentX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchCurrentX.current === null) {
      resetTouchTracking();
      return;
    }

    const delta = touchStartX.current - touchCurrentX.current;
    if (Math.abs(delta) > 40) {
      goTo(activeIndex + (delta > 0 ? 1 : -1));
    }

    resetTouchTracking();
  };

  return (
    <div className="carousel">
      <div
        className="carousel__viewport"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={resetTouchTracking}
      >
        <div
          className="carousel__track"
          style={{
            transform: `translateX(-${activeIndex * 100}%)`,
          }}
        >
          {slides.map((slide) => (
            <div key={slide.src} className="carousel__slide">
              <img src={slide.src} className="carousel__image" draggable={false} />
              <div className="carousel__overlay">
                <div className="carousel__copy">
                  <p className="carousel__description">{slide.description}</p>
                </div>
                {slide.showCta && (
                  <button type="button" className="carousel__cta-button" onClick={handleContinue}>
                    Continue
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="carousel__indicators" role="tablist" aria-label="Carousel slides">
        {slides.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            className={`carousel__dot${index === activeIndex ? ' carousel__dot--active' : ''}`}
            aria-label={`Go to slide ${index + 1}`}
            onClick={() => goTo(index)}
            role="tab"
            aria-selected={index === activeIndex}
          />
        ))}
      </div>
    </div>
  );
};

export default Carousel;
