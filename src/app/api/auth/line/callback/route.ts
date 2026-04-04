import { NextRequest, NextResponse } from "next/server"

function getBaseUrl(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (siteUrl) return siteUrl.replace(/\/$/, "")
  return "http://localhost:3000"
}

function toHomeWithParams(params: Record<string, string>) {
  const baseUrl = getBaseUrl()
  const url = new URL("/", baseUrl)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return NextResponse.redirect(url)
}

export async function GET(request: NextRequest) {
  const clientId = process.env.LINE_CHANNEL_ID?.trim()
  const clientSecret = process.env.LINE_CHANNEL_SECRET?.trim()

  if (!clientId || !clientSecret) {
    return toHomeWithParams({ auth_error: "LINE設定が不足しています（CHANNEL_ID/SECRET）" })
  }

  const code = request.nextUrl.searchParams.get("code")
  const state = request.nextUrl.searchParams.get("state")
  const cookieState = request.cookies.get("line_oauth_state")?.value

  if (!code || !state || !cookieState || state !== cookieState) {
    return toHomeWithParams({ auth_error: "LINE認証の検証に失敗しました。もう一度お試しください。" })
  }

  const redirectUri = `${getBaseUrl()}/api/auth/line/callback`

  const tokenBody = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  })

  const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenBody.toString(),
    cache: "no-store",
  })

  const tokenData = await tokenRes.json().catch(() => null)
  if (!tokenRes.ok || !tokenData?.id_token) {
    const detail = tokenData?.error_description || tokenData?.error || `status:${tokenRes.status}`
    console.error("[LINE callback] token error:", JSON.stringify(tokenData), "redirectUri:", redirectUri)
    return toHomeWithParams({ auth_error: `LINEトークン交換失敗: ${detail}` })
  }

  const verifyBody = new URLSearchParams({
    id_token: tokenData.id_token as string,
    client_id: clientId,
  })

  const verifyRes = await fetch("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: verifyBody.toString(),
    cache: "no-store",
  })

  const verifyData = await verifyRes.json().catch(() => null)
  if (!verifyRes.ok) {
    return toHomeWithParams({ auth_error: "LINE本人確認に失敗しました" })
  }

  const email = typeof verifyData?.email === "string" ? verifyData.email : ""
  const response = email
    ? toHomeWithParams({ line_oauth: "ok", line_email: email })
    : toHomeWithParams({ auth_error: "LINEからメールアドレスを取得できませんでした。メールログインをご利用ください。" })

  response.cookies.set("line_oauth_state", "", { path: "/", maxAge: 0 })
  response.cookies.set("line_oauth_nonce", "", { path: "/", maxAge: 0 })
  return response
}
