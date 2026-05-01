import {
  CarOutlined,
  DollarOutlined,
  PlusCircleOutlined,
  TagOutlined,
  UnorderedListOutlined,
  UserOutlined,
  SyncOutlined,
  TeamOutlined,
  PieChartOutlined,
  MailOutlined
} from '@ant-design/icons';

const icons = {
  CarOutlined,
  DollarOutlined,
  PlusCircleOutlined,
  TagOutlined,
  UnorderedListOutlined,
  UserOutlined,
  SyncOutlined,
  TeamOutlined,
  PieChartOutlined,
  MailOutlined
};

const expenses = {
  id: 'group-expenses',
  title: 'Expenses',
  type: 'group',
  children: [
    {
      id: 'expense-dashboard',
      title: 'Expense Dashboard',
      type: 'item',
      url: '/expenses/dashboard',
      icon: icons.PieChartOutlined,
      breadcrumbs: false
    },
    {
      id: 'my-expenses',
      title: 'My Expenses',
      type: 'item',
      url: '/expenses/my',
      icon: icons.UserOutlined
    },
    {
      id: 'expense-add',
      title: 'Add Expense',
      type: 'item',
      url: '/expenses/add',
      icon: icons.PlusCircleOutlined
    },
    {
      id: 'expense-list',
      title: 'Expenses List',
      type: 'item',
      url: '/expenses/list',
      icon: icons.UnorderedListOutlined
    },
    {
      id: 'recurring-rules',
      title: 'Recurring Rules',
      type: 'item',
      url: '/expenses/recurring',
      icon: icons.SyncOutlined
    },
    {
      id: 'trips',
      title: 'Trips',
      type: 'item',
      url: '/expenses/trips',
      icon: icons.CarOutlined
    },
    {
      id: 'tags',
      title: 'Tags',
      type: 'item',
      url: '/expenses/tags',
      icon: icons.TagOutlined
    },
    {
      id: 'people',
      title: 'People',
      type: 'item',
      url: '/expenses/people',
      icon: icons.TeamOutlined
    },
    {
      id: 'report-subscription',
      title: 'Reports',
      type: 'item',
      url: '/expenses/reports',
      icon: icons.MailOutlined
    }
  ]
};

export default expenses;
