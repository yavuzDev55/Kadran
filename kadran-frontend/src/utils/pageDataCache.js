const pageData = new Map();
const MAX_CACHED_PAGES = 30;

export const getPageData = (key) => {
  if (!pageData.has(key)) return undefined;
  const value = pageData.get(key);
  pageData.delete(key);
  pageData.set(key, value);
  return value;
};

export const setPageData = (key, value) => {
  pageData.delete(key);
  pageData.set(key, value);
  if (pageData.size > MAX_CACHED_PAGES) {
    pageData.delete(pageData.keys().next().value);
  }
};
