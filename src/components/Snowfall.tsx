import React from "react";

const SNOWFLAKE_COUNT = 80;

const Snowfall: React.FC = () => {
  return (
    <div className="snowfall" aria-hidden="true">
      {Array.from({ length: SNOWFLAKE_COUNT }).map((_, index) => {
        const left = Math.random() * 100;
        const delay = Math.random() * -20;
        const duration = 10 + Math.random() * 10;
        const size = 10 + Math.random() * 16;

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
