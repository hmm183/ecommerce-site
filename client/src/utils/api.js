export function getApiUrl(path) {
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  return `${cleanBase}${cleanPath}`;
}
