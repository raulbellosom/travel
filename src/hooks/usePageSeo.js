import { useEffect } from "react";

const setMeta = (name, content) => {
  if (!name) return;
  const selector = `meta[name="${name}"]`;
  let meta = document.head.querySelector(selector);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", name);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content || "");
};

export const usePageSeo = ({ title, description, robots } = {}) => {
  useEffect(() => {
    if (title) {
      document.title = title;
    }
    if (description) {
      setMeta("description", description);
    }
    if (robots) {
      setMeta("robots", robots);
    }
  }, [description, robots, title]);
};
