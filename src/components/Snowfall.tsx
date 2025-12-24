import React from "react";

const SNOWFLAKE_COUNT = 260;

const Snowfall: React.FC = () => {
  return (
    <div className="snowfall" aria-hidden="true">
      {Array.from({ length: SNOWFLAKE_COUNT }).map((_, index) => {
        const left = Math.random() * 100;
        const delay = Math.random() * -24;
        const duration = 14 + Math.random() * 14;
        const size = 3 + Math.random() * 4;
        const opacity = 0.3 + Math.random() * 0.5;

        return (
          <span
            key={index}
            className="snowflake"
            style={{
              left: `${left}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              width: `${size}px`,
              height: `${size}px`,
              opacity,
            }}
          />
        );
      })}
    </div>
  );
};

export default Snowfall;
