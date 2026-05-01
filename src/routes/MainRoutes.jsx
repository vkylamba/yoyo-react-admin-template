import { lazy } from 'react';

// project import
import Loadable from 'components/Loadable';
import Dashboard from 'layout/Dashboard';

const Color = Loadable(lazy(() => import('pages/component-overview/color')));
const Typography = Loadable(lazy(() => import('pages/component-overview/typography')));
const Shadow = Loadable(lazy(() => import('pages/component-overview/shadows')));
const DashboardDefault = Loadable(lazy(() => import('pages/dashboard/index')));

// render - sample page
const SamplePage = Loadable(lazy(() => import('pages/extra-pages/sample-page')));

// render - expense pages
const ExpenseDashboard = Loadable(lazy(() => import('pages/expenses/dashboard')));
const ExpenseAdd = Loadable(lazy(() => import('pages/expenses/add')));
const ExpenseEdit = Loadable(lazy(() => import('pages/expenses/edit')));
const ExpenseList = Loadable(lazy(() => import('pages/expenses/list')));
const RecurringRules = Loadable(lazy(() => import('pages/expenses/recurring')));
const PeopleManagement = Loadable(lazy(() => import('pages/expenses/people')));
const ReportsPage = Loadable(lazy(() => import('pages/expenses/reports')));
const MyExpenses = Loadable(lazy(() => import('pages/expenses/my')));
const TagsPage = Loadable(lazy(() => import('pages/expenses/tags')));
const TripList = Loadable(lazy(() => import('pages/expenses/trips/list')));
const TripDetail = Loadable(lazy(() => import('pages/expenses/trips/detail')));

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: <Dashboard />,
  children: [
    {
      path: '/',
      element: <DashboardDefault />
    },
    {
      path: 'color',
      element: <Color />
    },
    {
      path: 'dashboard',
      children: [
        {
          path: 'default',
          element: <DashboardDefault />
        }
      ]
    },
    {
      path: 'sample-page',
      element: <SamplePage />
    },
    {
      path: 'shadow',
      element: <Shadow />
    },
    {
      path: 'typography',
      element: <Typography />
    },
    {
      path: 'expenses',
      children: [
        { path: 'dashboard', element: <ExpenseDashboard /> },
        { path: 'add', element: <ExpenseAdd /> },
        { path: 'edit/:id', element: <ExpenseEdit /> },
        { path: 'list', element: <ExpenseList /> },
        { path: 'recurring', element: <RecurringRules /> },
        { path: 'people', element: <PeopleManagement /> },
        { path: 'reports', element: <ReportsPage /> },
        { path: 'my', element: <MyExpenses /> },
        { path: 'tags', element: <TagsPage /> },
        { path: 'trips', element: <TripList /> },
        { path: 'trips/:id', element: <TripDetail /> }
      ]
    }
  ]
};

export default MainRoutes;
