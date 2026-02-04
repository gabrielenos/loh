"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const backendUrl = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000",
    []
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              setError(null)
              setLoading(true)

              const form = new FormData(e.currentTarget)
              const email = String(form.get("email") ?? "")
              const password = String(form.get("password") ?? "")

              try {
                const body = new URLSearchParams()
                body.set("username", email)
                body.set("password", password)

                const res = await fetch(`${backendUrl}/token`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                  },
                  body,
                })

                if (!res.ok) {
                  const t = await res.text()
                  throw new Error(t || `Login failed (${res.status})`)
                }

                const data = (await res.json()) as {
                  access_token?: string
                  token_type?: string
                }

                if (!data?.access_token) {
                  throw new Error("Login response missing access_token")
                }

                localStorage.setItem("access_token", data.access_token)
                router.push("/dashboard")
              } catch (err) {
                setError(err instanceof Error ? err.message : "Login failed")
              } finally {
                setLoading(false)
              }
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input id="password" name="password" type="password" required />
              </Field>
              <Field>
                {error ? (
                  <div className="text-sm text-red-600">{error}</div>
                ) : null}
                <Button type="submit" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </Button>
                <Button variant="outline" type="button" disabled={loading}>
                  Login with Google
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account? <Link href="/signup">Sign up</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
