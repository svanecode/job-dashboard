'use client'

import { useAuth } from '@/contexts/AuthContext'
import TopNav from './TopNav'
import UserMenu from './UserMenu'

export default function NavigationWrapper() {
  const { user, loading, initialized } = useAuth()

  // Vis kun intet, hvis appen initialiserer for første gang,
  // ELLER hvis den indlæser OG vi endnu ikke har en bruger.
  // Dette forhindrer, at navigationen forsvinder ved session-genvalidering.
  if (!initialized || (loading && !user)) {
    return null
  }

  // Hvis initialiseringen er færdig, og der ikke er nogen bruger, skal du heller ikke vise noget.
  if (!user) {
    return null
  }

  return (
    <div className="flex items-center justify-between mb-4 md:mb-6">
      <TopNav />
      <UserMenu />
    </div>
  )
} 