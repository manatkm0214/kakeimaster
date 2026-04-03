import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin
  const rawEmail = requestUrl.searchParams.get("email") || ""
  const email = rawEmail.trim().toLowerCase()

  const redirectUrl = new URL("/", origin)

  if (!email || !isEmail(email)) {
    redirectUrl.searchParams.set("qr_error", "有効なメールアドレスが必要です")
    return NextResponse.redirect(redirectUrl)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!supabaseUrl || !supabaseAnonKey) {
    redirectUrl.searchParams.set("qr_error", "認証設定が未完了です")
    return NextResponse.redirect(redirectUrl)
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  const callbackUrl = `${origin}/auth/callback`
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: callbackUrl,
    },
  })

  if (error) {
    redirectUrl.searchParams.set("login_email", email)
    redirectUrl.searchParams.set("qr_error", error.message)
    return NextResponse.redirect(redirectUrl)
  }

  redirectUrl.searchParams.set("login_email", email)
  redirectUrl.searchParams.set("qr_magic_sent", "1")
  return NextResponse.redirect(redirectUrl)
}
