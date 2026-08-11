// Context Imports
import { VerticalNavProvider } from '@menu/contexts/verticalNavContext'
import { SettingsProvider } from '@core/contexts/settingsContext'
import ThemeProvider from '@components/theme'
import AuthClientProvider from '@components/AuthClientProvider'

// Util Imports
import { getMode, getSettingsFromCookie, getSystemMode } from '@core/utils/serverHelpers'

const Providers = async props => {
  // Props
  const { children, direction, forcedMode } = props

  // Vars
  const mode = forcedMode || (await getMode())
  const settingsCookie = await getSettingsFromCookie()
  const systemMode = forcedMode || (await getSystemMode())
  const resolvedSettingsCookie = forcedMode ? { ...settingsCookie, mode: forcedMode } : settingsCookie

  return (
    <VerticalNavProvider>
      <SettingsProvider settingsCookie={resolvedSettingsCookie} mode={mode}>
        <ThemeProvider direction={direction} systemMode={systemMode}>
          <AuthClientProvider>{children}</AuthClientProvider>
        </ThemeProvider>
      </SettingsProvider>
    </VerticalNavProvider>
  )
}

export default Providers
