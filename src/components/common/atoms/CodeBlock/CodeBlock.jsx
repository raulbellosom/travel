import React, { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  vscDarkPlus,
  vs,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import { useUI } from "../../../../contexts/UIContext";

/**
 * Enhanced CodeBlock component with syntax highlighting and copy functionality
 */
const CodeBlock = ({
  code,
  language = "jsx",
  showLineNumbers = true,
  className = "",
  ...props
}) => {
  const { theme } = useUI();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const codeStyle = theme === "dark" ? vscDarkPlus : vs;

  return (
    <div className={`relative group ${className}`} {...props}>
      {/* Copy Button */}
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 z-10 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-200 dark:hover:bg-gray-600"
        aria-label="Copy code"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
        ) : (
          <Copy className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        )}
      </button>

      {/* Language Label */}
      <div className="absolute top-3 left-3 z-10 px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded opacity-75">
        {language.toUpperCase()}
      </div>

      {/* Code Block */}
      <SyntaxHighlighter
        language={language}
        style={codeStyle}
        showLineNumbers={showLineNumbers}
        customStyle={{
          margin: 0,
          borderRadius: "0.5rem",
          fontSize: "0.875rem",
          lineHeight: "1.5",
          padding: "1rem",
          paddingTop: "3rem", // Space for language label and copy button
        }}
        codeTagProps={{
          style: {
            fontFamily: "Consolas, 'Courier New', monospace",
          },
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeBlock;
