'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { PostHog } from 'posthog-js'
import type { PublicLocale } from '@/lib/i18n'

const copy = {
  en: {
    title: 'Respecting your space',
    body: 'With your permission, Rama uses PostHog analytics to measure aggregate product behavior. We exclude property briefs, voice transcripts, model content, contact details, and tokens.',
    accept: 'Accept',
    decline: 'Decline',
  },
  ar: {
    title: 'نحترم خصوصيتك',
    body: 'بإذنك، تستخدم راما تحليلات PostHog لقياس سلوك المنتج بشكل مجمّع. نستبعد موجزات العقارات والنصوص الصوتية ومحتوى النموذج وبيانات الاتصال والرموز.',
    accept: 'أوافق',
    decline: 'أرفض',
  },
} as const

export function CookieConsentBanner({ locale }: { locale: PublicLocale }) {
  const [showBanner, setShowBanner] = useState(false)
  const [posthog, setPosthog] = useState<PostHog | null>(null)
  const initialization = useRef<Promise<PostHog | null> | null>(null)
  const pathname = usePathname()
  const content = copy[locale]

  const initializePostHog = useCallback(() => {
    if (initialization.current) return initialization.current
    if (!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) return Promise.resolve(null)

    initialization.current = import('posthog-js').then(({ default: client }) => {
      if (!client.__loaded) {
        client.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN as string, {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
          defaults: '2026-05-30',
          opt_out_capturing_by_default: true,
        })
      }
      client.opt_in_capturing()
      setPosthog(client)
      return client
    })
    return initialization.current
  }, [])

  useEffect(() => {
    const choice = localStorage.getItem('rama_cookie_consent')
    if (choice === 'accepted') {
      void initializePostHog()
      return
    }
    if (choice === 'declined') return

    const timer = window.setTimeout(() => setShowBanner(true), 50)
    return () => window.clearTimeout(timer)
  }, [initializePostHog])

  useEffect(() => {
    if (!posthog || !pathname) return
    posthog.capture('$pageview', {
      $current_url: `${window.origin}${pathname}`,
    })
  }, [pathname, posthog])

  useEffect(() => {
    if (!posthog) return
    let disposed = false
    let unsubscribe: (() => void) | undefined

    void import('@/lib/supabase/client').then(({ createClient }) => {
      if (disposed) return
      const supabase = createClient()
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) posthog.identify(session.user.id)
        else if (event === 'SIGNED_OUT') posthog.reset()
      })
      unsubscribe = () => subscription.unsubscribe()
      void supabase.auth.getUser().then(({ data: { user } }) => {
        if (!disposed && user) posthog.identify(user.id)
      })
    })

    return () => {
      disposed = true
      unsubscribe?.()
    }
  }, [posthog])

  const acceptCookies = () => {
    localStorage.setItem('rama_cookie_consent', 'accepted')
    setShowBanner(false)
    void initializePostHog()
  }

  const declineCookies = () => {
    localStorage.setItem('rama_cookie_consent', 'declined')
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div
      aria-describedby="rama-cookie-consent-description"
      aria-labelledby="rama-cookie-consent-title"
      className="cookie-consent-banner"
      role="dialog"
    >
      <div className="cookie-consent-banner__copy">
        <h3 id="rama-cookie-consent-title">{content.title}</h3>
        <p id="rama-cookie-consent-description">{content.body}</p>
      </div>
      <div className="cookie-consent-banner__actions">
        <button
          onClick={acceptCookies}
          data-action="accept"
        >
          {content.accept}
        </button>
        <button
          onClick={declineCookies}
          data-action="decline"
        >
          {content.decline}
        </button>
      </div>
    </div>
  )
}
