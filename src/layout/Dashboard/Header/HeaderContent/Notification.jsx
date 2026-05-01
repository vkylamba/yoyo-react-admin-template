import { useEffect, useRef, useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project import
import MainCard from 'components/MainCard';
import Transitions from 'components/@extended/Transitions';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from 'services/expenses';

// assets
import BellOutlined from '@ant-design/icons/BellOutlined';
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined';
import DollarOutlined from '@ant-design/icons/DollarOutlined';
import EditOutlined from '@ant-design/icons/EditOutlined';
import TeamOutlined from '@ant-design/icons/TeamOutlined';

// sx styles
const avatarSX = { width: 36, height: 36, fontSize: '1rem' };
const actionSX = { mt: '6px', ml: 1, top: 'auto', right: 'auto', alignSelf: 'flex-start', transform: 'none' };

const typeConfig = {
  expense_created: { icon: <DollarOutlined />, color: 'success' },
  expense_updated: { icon: <EditOutlined />, color: 'primary' },
  expense_split: { icon: <TeamOutlined />, color: 'warning' }
};

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

// ==============================|| HEADER CONTENT - NOTIFICATION ||============================== //

export default function Notification() {
  const theme = useTheme();
  const matchesXs = useMediaQuery(theme.breakpoints.down('md'));

  const anchorRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  const load = () => {
    getNotifications(10)
      .then((data) => {
        setUnreadCount(data.unread_count);
        setNotifications(data.notifications);
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  const handleToggle = () => {
    if (!open) load(); // refresh on open
    setOpen((prev) => !prev);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) return;
    setOpen(false);
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead().then(() => {
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    });
  };

  const handleClickNotification = (n) => {
    if (!n.is_read) {
      markNotificationRead(n.id).then(() => {
        setUnreadCount((c) => Math.max(0, c - 1));
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      });
    }
  };

  const iconBackColorOpen = 'grey.100';

  return (
    <Box sx={{ flexShrink: 0, ml: 0.75 }}>
      <IconButton
        color="secondary"
        variant="light"
        sx={{ color: 'text.primary', bgcolor: open ? iconBackColorOpen : 'transparent' }}
        aria-label="open notifications"
        ref={anchorRef}
        aria-controls={open ? 'notification-grow' : undefined}
        aria-haspopup="true"
        onClick={handleToggle}
      >
        <Badge badgeContent={unreadCount} color="primary">
          <BellOutlined />
        </Badge>
      </IconButton>
      <Popper
        placement={matchesXs ? 'bottom' : 'bottom-end'}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        popperOptions={{ modifiers: [{ name: 'offset', options: { offset: [matchesXs ? -5 : 0, 9] } }] }}
      >
        {({ TransitionProps }) => (
          <Transitions type="grow" position={matchesXs ? 'top' : 'top-right'} in={open} {...TransitionProps}>
            <Paper sx={{ boxShadow: theme.customShadows.z1, width: '100%', minWidth: 285, maxWidth: { xs: 285, md: 420 } }}>
              <ClickAwayListener onClickAway={handleClose}>
                <MainCard
                  title="Notifications"
                  elevation={0}
                  border={false}
                  content={false}
                  secondary={
                    unreadCount > 0 ? (
                      <Tooltip title="Mark all as read">
                        <IconButton color="success" size="small" onClick={handleMarkAllRead}>
                          <CheckCircleOutlined style={{ fontSize: '1.15rem' }} />
                        </IconButton>
                      </Tooltip>
                    ) : null
                  }
                >
                  <List
                    component="nav"
                    sx={{
                      p: 0,
                      maxHeight: 400,
                      overflow: 'auto',
                      '& .MuiListItemButton-root': {
                        py: 0.5,
                        '&.Mui-selected': { bgcolor: 'grey.50', color: 'text.primary' },
                        '& .MuiAvatar-root': avatarSX,
                        '& .MuiListItemSecondaryAction-root': { ...actionSX, position: 'relative' }
                      }
                    }}
                  >
                    {notifications.length === 0 && (
                      <ListItemButton>
                        <ListItemText
                          primary={
                            <Typography variant="h6" color="text.secondary" align="center">
                              No notifications
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    )}
                    {notifications.map((n, i) => {
                      const config = typeConfig[n.type] || typeConfig.expense_created;
                      return (
                        <Box key={n.id}>
                          <ListItemButton selected={!n.is_read} onClick={() => handleClickNotification(n)}>
                            <ListItemAvatar>
                              <Avatar sx={{ color: `${config.color}.main`, bgcolor: `${config.color}.lighter` }}>
                                {config.icon}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={<Typography variant="h6">{n.message}</Typography>}
                              secondary={timeAgo(n.created_at)}
                            />
                            <ListItemSecondaryAction>
                              <Typography variant="caption" noWrap>
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </Typography>
                            </ListItemSecondaryAction>
                          </ListItemButton>
                          {i < notifications.length - 1 && <Divider />}
                        </Box>
                      );
                    })}
                  </List>
                </MainCard>
              </ClickAwayListener>
            </Paper>
          </Transitions>
        )}
      </Popper>
    </Box>
  );
}
