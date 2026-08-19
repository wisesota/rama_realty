'use client'

import { useEffect } from 'react'
import { usePostHog } from '@posthog/react'
import { createClient } from '@/lib/supabase/client'

export function TelemetryIdentity() {
  const posthog = usePostHog()
  const supabase = createClient()

  useEffect(() => {
    if (!posthog) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        posthog.identify(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        posthog.reset()
      }
    })

    // Also check initial state in case they are already logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        posthog.identify(user.id)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [posthog, supabase.auth])

  return null
}
