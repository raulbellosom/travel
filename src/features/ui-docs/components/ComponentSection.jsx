import React from "react";
import { motion } from "framer-motion";

/**
 * Section wrapper component for UI docs
 */
const ComponentSection = ({ title, description, children }) => (
  <motion.section
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-12"
  >
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
        {title}
      </h2>
      {description && (
        <p className="text-gray-600 dark:text-gray-400">{description}</p>
      )}
    </div>
    <div className="space-y-8">{children}</div>
  </motion.section>
);

export default ComponentSection;
