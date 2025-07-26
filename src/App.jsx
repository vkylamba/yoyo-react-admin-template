import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from 'context/AuthProvider';

// project imports
import router from 'routes';
import ThemeCustomization from 'themes';

import ScrollTop from 'components/ScrollTop';

// ==============================|| APP - THEME, ROUTER, LOCAL ||============================== //

export default function App() {
  return (
    <ThemeCustomization>
      <ScrollTop>
        <AuthProvider>
+          <RouterProvider router={router} />
+        </AuthProvider>
      </ScrollTop>
    </ThemeCustomization>
  );
}
