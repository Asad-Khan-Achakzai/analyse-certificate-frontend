// Context Imports
import { VerticalNavProvider } from '@menu/contexts/verticalNavContext'
import { SettingsProvider } from '@core/contexts/settingsContext'
import ThemeProvider from '@components/theme'
import AuthClientProvider from '@components/AuthClientProvider'

// Config Imports
import themeConfig from '@configs/themeConfig'
import primaryColorConfig from '@configs/primaryColorConfig'

// Util Imports
import { getMode, getSettingsFromCookie, getSystemMode } from '@core/utils/serverHelpers'

const defaultSettings = {
  mode: themeConfig.mode,
  skin: themeConfig.skin,
  semiDark: themeConfig.semiDark,
  layout: themeConfig.layout,
  navbarContentWidth: themeConfig.navbar.contentWidth,
  contentWidth: themeConfig.contentWidth,
  footerContentWidth: themeConfig.footer.contentWidth,
  primaryColor: primaryColorConfig[0].main
}

const Providers = async props => {
  // Props
  const { children, direction, forcedMode } = props

  // Vars
  const mode = forcedMode || (await getMode())
  const settingsCookie = await getSettingsFromCookie()
  const systemMode = forcedMode || (await getSystemMode())

  // When forcing mode (e.g. public verify), merge full defaults so primaryColor etc. are never missing
  const resolvedSettingsCookie = forcedMode
    ? { ...defaultSettings, ...settingsCookie, mode: forcedMode }
    : settingsCookie

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
