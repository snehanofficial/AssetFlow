const API_BASE = '/api/v1';

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
}

/**
 * Custom fetch wrapper that handles:
 * - Base URL prefixing
 * - Automatic JSON parsing
 * - Cookies/credentials inclusion
 * - Token refresh interceptor for 401 unauthorized errors
 */
export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  // Set default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Extract accessToken if stored in memory/sessionStorage
  const accessToken = sessionStorage.getItem('accessToken');
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const fetchOptions = {
    ...options,
    headers,
    credentials: 'include', // Crucial for HTTP-only cookies
  };

  if (options.body && typeof options.body === 'object') {
    fetchOptions.body = JSON.stringify(options.body);
  }

  try {
    let response = await fetch(url, fetchOptions);

    // Auto-refresh token if 401 unauthorized is received
    if (
      response.status === 401 &&
      !endpoint.includes('/auth/login') &&
      !endpoint.includes('/auth/signup') &&
      !endpoint.includes('/auth/refresh')
    ) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            const newAccessToken = refreshData.data?.accessToken;
            if (newAccessToken) {
              sessionStorage.setItem('accessToken', newAccessToken);
              onRefreshed(newAccessToken);
            }
          } else {
            // Refresh failed, clear session
            sessionStorage.removeItem('accessToken');
            onRefreshed(null);
          }
        } catch {
          sessionStorage.removeItem('accessToken');
          onRefreshed(null);
        } finally {
          isRefreshing = false;
        }
      }

      // Queue the retry request
      const retryPromise = new Promise((resolve) => {
        subscribeTokenRefresh((token) => {
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            resolve(fetch(url, fetchOptions));
          } else {
            resolve(response); // Fail with original response
          }
        });
      });

      response = await retryPromise;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.error?.message || 'Something went wrong');
      error.status = response.status;
      error.code = data.error?.code;
      error.details = data.error?.details || [];
      throw error;
    }

    return data;
  } catch (error) {
    // If the error has status/code/details, it is our custom Error
    if (error.status) throw error;

    // Otherwise it's a network error
    const netErr = new Error('Network error: Cannot connect to server.');
    netErr.status = 500;
    netErr.code = 'NETWORK_ERROR';
    throw netErr;
  }
}

export default apiFetch;
