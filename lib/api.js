// lib/api.js

const DEFAULT_TIMEOUT = 20_000;

export class ApiError extends Error {
  constructor(message, status, code, payload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code || null;
    this.payload = payload || null;
  }
}

function broadcastSessionExpired() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("tf:session-expired"));
}

function broadcastForbidden(payload) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("tf:forbidden", { detail: payload || {} })
  );
}

async function request(url, options = {}) {
  const {
    method = "GET",
    body,
    signal: externalSignal,
    timeout = DEFAULT_TIMEOUT,
    headers: extraHeaders,
    ...rest
  } = options;

  const headers = { ...extraHeaders };

  let payload;
  if (body !== undefined) {
    if (body instanceof FormData) {
      payload = body;
    } else {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else
      externalSignal.addEventListener("abort", () => controller.abort(), {
        once: true,
      });
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: payload,
      signal: controller.signal,
      credentials: "same-origin",
      cache: "no-store",
      ...rest,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err?.name === "AbortError") {
      throw new ApiError("Request was cancelled.", 0, "ABORTED", null);
    }
    throw new ApiError(
      "Network error. Please check your connection.",
      0,
      "NETWORK",
      null
    );
  }
  clearTimeout(timer);

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!res.ok) {
    const isAuthEndpoint = url.startsWith("/api/auth/");
    if (res.status === 401 && !isAuthEndpoint) {
      broadcastSessionExpired();
    }
    if (res.status === 403) {
      broadcastForbidden(data);
    }
    throw new ApiError(
      data?.error || `Request failed (${res.status})`,
      res.status,
      data?.code || null,
      data
    );
  }

  return data ?? {};
}

export const api = {
  get: (url, opts) => request(url, { ...opts, method: "GET" }),
  post: (url, body, opts) => request(url, { ...opts, method: "POST", body }),
  patch: (url, body, opts) => request(url, { ...opts, method: "PATCH", body }),
  put: (url, body, opts) => request(url, { ...opts, method: "PUT", body }),
  delete: (url, opts) => request(url, { ...opts, method: "DELETE" }),

  owner: (path) => `/api/owner${path}`,
  admin: (path) => `/api/admin${path}`,
  member: (path) => `/api/member${path}`,
  auth: (path) => `/api/auth${path}`,
};

export function qs(params = {}) {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined || v === "") continue;
    search.set(k, String(v));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}