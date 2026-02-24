import React from "react";
import PropTypes from "prop-types";
import Spinner from "../atoms/Spinner";

/**
 * A reusable loading state component that centers a spinner and an optional text label.
 */
const LoadingState = ({ text, className = "", spinnerSize = "md" }) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 gap-3 text-slate-500 dark:text-slate-400 ${className}`}
    >
      <Spinner
        size={spinnerSize}
        className="opacity-70 text-cyan-500 dark:text-cyan-400"
      />
      {text && <p className="text-sm font-medium animate-pulse">{text}</p>}
    </div>
  );
};

LoadingState.propTypes = {
  text: PropTypes.node,
  className: PropTypes.string,
  spinnerSize: PropTypes.oneOf(["xs", "sm", "md", "lg", "xl"]),
};

export default LoadingState;
