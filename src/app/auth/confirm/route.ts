import { NextResponse } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

const allowedTypes = new Set<EmailOtpType>([
  "signup",
  "recovery",
  "invite",
  "magiclink",
  "email",
  "email_change",
])

function toSafeNextPath(raw: string | null, origin: string): string {
  if (!raw) return "/"

  try {
    const decoded = decodeURIComponent(raw)
    if (decoded.startsWith("/")) return decoded

    const parsed = new URL(decoded)
    if (parsed.origin === origin) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`
    }
  } catch {
    return "/"
  }

  return "/"
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin
  const tokenHash = requestUrl.searchParams.get("token_hash")
  const typeParam = (requestUrl.searchParams.get("type") ?? "").toLowerCase()
  const next = toSafeNextPath(requestUrl.searchParams.get("next"), origin)

  if (!tokenHash || !allowedTypes.has(typeParam as EmailOtpType)) {
    const url = new URL("/", origin)
    url.searchParams.set("auth_error", "認証リンクが無効です。最新メールのリンクを開いてください。")
    return NextResponse.redirect(url)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: typeParam as EmailOtpType,
  })

  if (error) {
    const url = new URL("/", origin)
    url.searchParams.set("auth_error", error.message)
    return NextResponse.redirect(url)
  }

  return NextResponse.redirect(new URL(next, origin))
}
