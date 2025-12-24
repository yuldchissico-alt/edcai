import React from "react";

const SNOWFLAKE_COUNT = 320;

const Snowfall: React.FC = () => {
  return (
    <div className="snowfall" aria-hidden="true">
      {Array.from({ length: SNOWFLAKE_COUNT }).map((_, index) => {
        const left = Math.random() * 100;
        const delay = Math.random() * -18;
        const duration = 14 + Math.random() * 10;
        const size = 18 + Math.random() * 22;
        const opacity = 0.6 + Math.random() * 0.4;

        return (
          <span
            key={index}
            className="snowflake"
            style={{
              left: `${left}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              fontSize: `${size}px`,
              opacity,
            }}
          >
            ❄
          </span>
        );
      })}
    </div>
  );
};

export default Snowfall;
