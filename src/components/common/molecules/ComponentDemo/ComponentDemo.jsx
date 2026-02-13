import React, { useState } from "react";
import { motion } from "framer-motion";
import { Code, Eye } from "lucide-react";
import { IconButton } from "../../atoms";
import Modal from "../../organisms/Modal";
import CodeBlock from "../../atoms/CodeBlock";

/**
 * ComponentDemo wrapper
 * Shows component with optional code view button and modal
 */
const ComponentDemo = ({
  title,
  description,
  children,
  code,
  className = "",
  id,
}) => {
  const [showCode, setShowCode] = useState(false);

  return (
    <div
      id={id}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 scroll-mt-20 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>

        {code && (
          <div className="flex gap-2">
            <IconButton
              icon={Code}
              variant="secondary"
              size="sm"
              onClick={() => setShowCode(true)}
              aria-label="Ver código"
            />
          </div>
        )}
      </div>

      {/* Component Demo */}
      <motion.div
        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>

      {/* Code Modal */}
      {code && (
        <Modal
          isOpen={showCode}
          onClose={() => setShowCode(false)}
          title={`Código: ${title}`}
          size="xl"
        >
          <CodeBlock
            code={code}
            language="jsx"
            title={`${title}.jsx`}
            maxHeight="60vh"
          />
        </Modal>
      )}
    </div>
  );
};

export default ComponentDemo;
