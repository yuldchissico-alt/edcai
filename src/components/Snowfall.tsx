import React from "react";

const SNOWFLAKE_COUNT = 180;

const Snowfall: React.FC = () => {
  return (
    <div className="snowfall" aria-hidden="true">
      {Array.from({ length: SNOWFLAKE_COUNT }).map((_, index) => {
        const left = Math.random() * 100;
        const delay = Math.random() * -25;
        const duration = 12 + Math.random() * 14;
        const size = 12 + Math.random() * 20;

        return (
          <span
            key={index}
            className="snowflake"
            style={{
              left: `${left}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              fontSize: `${size}px`,
            }}
          >
            ✦
          </span>
        );
      })}
    </div>
  );
};

export default Snowfall;
