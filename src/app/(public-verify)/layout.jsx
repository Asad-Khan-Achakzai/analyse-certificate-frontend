import Providers from '@components/Providers'
import BlankLayout from '@layouts/BlankLayout'

/** Public QR verify pages — always light mode (ignore device/system dark preference). */
const Layout = props => {
  const { children } = props
  const direction = 'ltr'

  return (
    <Providers direction={direction} forcedMode='light'>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var d=document.documentElement;d.setAttribute('data-mui-color-scheme','light');d.setAttribute('data-color-scheme','light');d.style.colorScheme='light';}catch(e){}})();`
        }}
      />
      <BlankLayout systemMode='light'>{children}</BlankLayout>
    </Providers>
  )
}

export default Layout
