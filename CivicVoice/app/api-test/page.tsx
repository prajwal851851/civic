"use client"

import { useEffect, useMemo, useState } from "react"
import api from "@/lib/api/axios"
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearTokens,
} from "@/lib/api/token"

// DIAGNOSTIC: verify the axios instance has interceptors attached
const interceptorCount = api.interceptors.request.handlers?.length ?? 0
console.log("[api-test] Axios request interceptor count:", interceptorCount)
console.log("[api-test] api.defaults.baseURL:", api.defaults.baseURL)
console.log("[api-test] getAccessToken() at page load:", getAccessToken())

if (interceptorCount === 0) {
  console.error("[api-test] FATAL: No request interceptors attached to axios instance!")
}

type TestResult = {
  label: string
  status: "pass" | "fail" | "pending"
  detail?: string
}

function urlTest(): TestResult {
  const url = process.env.NEXT_PUBLIC_API_URL || "NOT SET"
  return {
    label: "NEXT_PUBLIC_API_URL",
    status: url !== "NOT SET" ? "pass" : "fail",
    detail: url,
  }
}

function axiosConfigTest(): TestResult {
  try {
    const baseURL = api.defaults.baseURL
    const contentType =
      api.defaults.headers.common["Content-Type"] ||
      api.defaults.headers["Content-Type"] ||
      ""
    const hasJsonContentType = contentType === "application/json"
    const timeoutOk = api.defaults.timeout === 30000
    const ok = !!(baseURL && hasJsonContentType && timeoutOk)
    return {
      label: "Axios instance config",
      status: ok ? "pass" : "fail",
      detail: `baseURL: ${baseURL}, Content-Type: ${contentType}, timeout: ${timeoutOk}`,
    }
  } catch (e) {
    return {
      label: "Axios instance config",
      status: "fail",
      detail: String(e),
    }
  }
}

function tokenTest(): TestResult {
  try {
    const savedAccess = getAccessToken()
    const savedRefresh = getRefreshToken()

    clearTokens()
    const beforeAccess = getAccessToken()
    const beforeRefresh = getRefreshToken()
    saveTokens("test_access", "test_refresh")
    const afterAccess = getAccessToken()
    const afterRefresh = getRefreshToken()
    clearTokens()
    const cleared = getAccessToken()

    if (savedAccess && savedRefresh) {
      saveTokens(savedAccess, savedRefresh)
    }

    const ok =
      beforeAccess === null &&
      beforeRefresh === null &&
      afterAccess === "test_access" &&
      afterRefresh === "test_refresh" &&
      cleared === null

    return {
      label: "Token helpers",
      status: ok ? "pass" : "fail",
      detail: ok
        ? "saveTokens / getAccessToken / getRefreshToken / clearTokens all work"
        : "Token helper test failed",
    }
  } catch (e) {
    return {
      label: "Token helpers",
      status: "fail",
      detail: String(e),
    }
  }
}

export default function ApiTestPage() {
  const apiUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL || "NOT SET",
    [],
  )

  const initial = useMemo(() => {
    const results: TestResult[] = [urlTest(), axiosConfigTest()]
    results.push({
      label: "Token helpers",
      status: "pending",
      detail: "Testing...",
    })
    results.push({
      label: "Backend connectivity",
      status: "pending",
      detail: 'Click "Test Backend" to check connectivity',
    })
    return results
  }, [])

  const [results, setResults] = useState<TestResult[]>(initial)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const result = tokenTest()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client-only init
    setResults((prev) =>
      prev.map((r) => (r.label === "Token helpers" ? result : r)),
    )
  }, [])

  async function handleTestConnection() {
    setLoading(true)
    setResults((prev) =>
      prev.map((r) =>
        r.label === "Backend connectivity"
          ? { ...r, status: "pending", detail: "Connecting..." }
          : r,
      ),
    )

    try {
      const start = Date.now()
      await api.get("/map/markers/")
      const elapsed = Date.now() - start
      setResults((prev) =>
        prev.map((r) =>
          r.label === "Backend connectivity"
            ? { ...r, status: "pass", detail: `Backend responded in ${elapsed}ms` }
            : r,
        ),
      )
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status: number }; message?: string }
      setResults((prev) =>
        prev.map((r) =>
          r.label === "Backend connectivity"
            ? {
                ...r,
                status: axiosErr.response ? "pass" : "fail",
                detail: axiosErr.response
                  ? `Backend reachable (responded with ${axiosErr.response.status})`
                  : `Backend unreachable: ${axiosErr.message || "Unknown error"}`,
              }
            : r,
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  const passed = results.filter((r) => r.status === "pass").length
  const failed = results.filter((r) => r.status === "fail").length
  const total = results.length

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          API Foundation Test
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          This page validates the API infrastructure before connecting UI
          components.
        </p>

        <div className="mb-6 flex items-center gap-4 text-sm">
          <span className="rounded bg-green-100 px-3 py-1 font-medium text-green-800">
            Passed: {passed}/{total}
          </span>
          {failed > 0 && (
            <span className="rounded bg-red-100 px-3 py-1 font-medium text-red-800">
              Failed: {failed}/{total}
            </span>
          )}
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={loading}
            className="ml-auto rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Testing..." : "Test Backend"}
          </button>
        </div>

        <div className="space-y-3">
          {results.map((r, i) => (
            <div
              key={i}
              className={`rounded-lg border p-4 ${
                r.status === "pass"
                  ? "border-green-200 bg-green-50"
                  : r.status === "fail"
                    ? "border-red-200 bg-red-50"
                    : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-lg ${
                    r.status === "pass"
                      ? "text-green-600"
                      : r.status === "fail"
                        ? "text-red-600"
                        : "text-gray-400"
                  }`}
                >
                  {r.status === "pass"
                    ? "\u2713"
                    : r.status === "fail"
                      ? "\u2717"
                      : "\u23F3"}
                </span>
                <span className="font-medium text-gray-800">{r.label}</span>
                <span
                  className={`ml-auto text-xs font-medium uppercase ${
                    r.status === "pass"
                      ? "text-green-600"
                      : r.status === "fail"
                        ? "text-red-600"
                        : "text-gray-400"
                  }`}
                >
                  {r.status}
                </span>
              </div>
              {r.detail && (
                <p className="mt-1 text-sm text-gray-600">{r.detail}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <strong>API URL:</strong> {apiUrl}
          </p>
          <p className="mt-1 text-sm text-blue-800">
            <strong>Next step:</strong> Start the backend server, then click
            &quot;Test Backend&quot; to verify connectivity.
          </p>
        </div>
      </div>
    </main>
  )
}
