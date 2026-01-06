import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import MySkills from './pages/MySkills';
import Marketplace from './pages/Marketplace';
import Settings from './pages/Settings';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/my-skills" replace />,
      },
      {
        path: 'my-skills',
        element: <MySkills />,
      },
      {
        path: 'marketplace',
        element: <Marketplace />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/my-skills" replace />,
  }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
