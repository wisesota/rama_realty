'use client'

import { useEffect, useState } from 'react'
import { usePostHog } from '@posthog/react'

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const posthog = usePostHog()

  useEffect(() => {
    let mounted = true
    if (posthog) {
      const timer = setTimeout(() => {
        if (!mounted) return
        
        // We use our own localStorage key to track if they have made a choice,
        // because PostHog's `has_opted_out_capturing()` returns true if
        // `opt_out_capturing_by_default: true` is set, making it hard to distinguish
        // between "default opt-out" and "explicitly rejected".
        const hasMadeChoice = localStorage.getItem('rama_cookie_consent')
        
        if (!hasMadeChoice) {
          setShowBanner(true)
        }
      }, 50)
      
      return () => {
        mounted = false
        clearTimeout(timer)
      }
    }
  }, [posthog])

  const acceptCookies = () => {
    localStorage.setItem('rama_cookie_consent', 'accepted')
    posthog?.opt_in_capturing()
    setShowBanner(false)
  }

  const declineCookies = () => {
    localStorage.setItem('rama_cookie_consent', 'declined')
    posthog?.opt_out_capturing()
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-8 left-8 z-50 max-w-sm rounded-[16px] border border-stone-200 bg-[#fbfbf8] p-6 shadow-sm">
      <h3 className="font-source-serif text-lg text-stone-900 mb-2">Respecting your space</h3>
      <p className="font-instrument-sans text-sm text-stone-600 mb-6 leading-relaxed">
        We use telemetry to understand how you explore properties, so we can refine our experience. We never sell your data or deploy third-party trackers.
      </p>
      <div className="flex gap-4">
        <button
          onClick={acceptCookies}
          className="flex-1 bg-stone-900 text-stone-50 font-instrument-sans text-sm py-2 px-4 rounded-[6px] transition-colors hover:bg-stone-800"
        >
          Accept
        </button>
        <button
          onClick={declineCookies}
          className="flex-1 border border-stone-200 text-stone-600 font-instrument-sans text-sm py-2 px-4 rounded-[6px] transition-colors hover:bg-stone-100"
        >
          Decline
        </button>
      </div>
    </div>
  )
}
