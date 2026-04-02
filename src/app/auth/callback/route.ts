import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const authError = requestUrl.searchParams.get("error")
  const errorDescription = requestUrl.searchParams.get("error_description")
  const origin = requestUrl.origin

  if (authError || errorDescription) {
    const message = errorDescription || authError || "ログインに失敗しました"
    const nextUrl = new URL("/", origin)
    nextUrl.searchParams.set("auth_error", message)
    return NextResponse.redirect(nextUrl)
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      const nextUrl = new URL("/", origin)
      nextUrl.searchParams.set("auth_error", error.message)
      return NextResponse.redirect(nextUrl)
    }
  }

  return NextResponse.redirect(new URL("/", origin))
}
