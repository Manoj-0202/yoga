import React from "react";

export const PersonalisedYoga = () => {
  return (
    <div>
      <h1>Personalised Yoga</h1>
      <a
        href="/free-content"
        onClick={(e) => {
          e.preventDefault();
          window.history.pushState(null, "", "/free-content");
        }}
        style={{
          textDecoration: "none",
          color: "black",
          fontSize: "24px",
          margin: "10px",
          display: "inline-block",
        }}
      >
        &#x2190;
      </a>
    </div>
  );
};
