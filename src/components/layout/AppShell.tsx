import { useEffect, useState, type ReactNode } from "react";
import type { Page, Role } from "../../types";
import type { AuthenticatedUser } from "../../lib/auth";
import { getUnreadNotificationCountApi } from "../../lib/notifications";
import { Button, Icon, Logo, Modal } from "../ui";

interface SidebarProps {
  role: Role;
  page: Page;
  navigate: (page: Page) => void;
  open: boolean;
  close: () => void;
  onLogout: () => void;
  unreadCount: number;
}

const studentNav = [
  ["dashboard", "grid", "Dashboard"],
  ["new", "plus", "New Request"],
  ["requests", "file", "My Requests"],
  ["notifications", "bell", "Notifications"],
  ["settings", "user", "Profile"],
];

const approverNav = [
  ["dashboard", "grid", "Dashboard"],
  ["requests", "clock", "Pending Approvals"],
  ["processed", "file", "Assigned Documents"],
  ["signature", "pen", "My E-Signature"],
  ["notifications", "bell", "Notifications"],
  ["settings", "user", "Profile"],
];

function getInitials(user: AuthenticatedUser) {
  const first = user.givenName?.trim().charAt(0) || "";
  const last = user.familyName?.trim().charAt(0) || "";

  return (first + last).toUpperCase() || "U";
}

function getDisplayName(user: AuthenticatedUser) {
  return [user.givenName, user.middleName, user.familyName]
    .filter(Boolean)
    .join(" ");
}

export function Sidebar({
  role,
  page,
  navigate,
  open,
  close,
  onLogout,
  unreadCount,
}: SidebarProps) {
  const nav = role === "student" ? studentNav : approverNav;

  return (
    <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
      <div className="sidebar-head">
        <Logo light />
        <button
          className="mobile-close"
          onClick={close}
          aria-label="Close menu"
        >
          <Icon name="x" />
        </button>
      </div>

      <div className="role-label">
        {role === "student" ? "Student Portal" : "Approver Workspace"}
      </div>

      <nav>
        {nav.map(([target, icon, label]) => (
          <button
            key={`${label}-${target}`}
            className={page === target ? "nav-active" : ""}
            onClick={() => {
              navigate(target as Page);
              close();
            }}
          >
            <Icon name={icon} />
            <span>{label}</span>

            {label === "Notifications" && unreadCount > 0 && (
              <em>{unreadCount > 99 ? "99+" : unreadCount}</em>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-support">
        <div className="support-icon">?</div>
        <strong>Need help?</strong>
        <p>Visit the service guide or contact ICTC support.</p>
        <button>
          View support center <Icon name="arrow" size={14} />
        </button>
      </div>

      <button className="signout" onClick={onLogout}>
        <Icon name="logout" />
        <span>Sign out</span>
      </button>
    </aside>
  );
}

interface ShellProps {
  children: ReactNode;
  role: Role;
  user: AuthenticatedUser;
  page: Page;
  navigate: (page: Page) => void;
  onLogout: () => void;
  title: string;
  subtitle: string;
}

export function Shell({
  children,
  role,
  user,
  page,
  navigate,
  onLogout,
  title,
  subtitle,
}: ShellProps) {
  const [menu, setMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  useEffect(() => {
    let active = true;

    const loadUnreadCount = async () => {
      try {
        const count = await getUnreadNotificationCountApi();

        if (active) {
          setUnreadCount(count);
        }
      } catch (error) {
        console.error("Unable to load unread notification count:", error);
      }
    };

    loadUnreadCount();

    const interval = window.setInterval(loadUnreadCount, 10000);

    const handleNotificationsUpdated = () => {
      loadUnreadCount();
    };

    window.addEventListener(
      "notifications-updated",
      handleNotificationsUpdated,
    );

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener(
        "notifications-updated",
        handleNotificationsUpdated,
      );
    };
  }, [user.id]);

  return (
    <div className="app-shell">
      <Sidebar
        role={role}
        page={page}
        navigate={navigate}
        open={menu}
        close={() => setMenu(false)}
        onLogout={() => {
          setMenu(false);
          setConfirmSignOut(true);
        }}
        unreadCount={unreadCount}
      />

      {menu && <div className="scrim" onClick={() => setMenu(false)} />}

      <main className="main">
        <header className="topbar">
          <button
            className="menu-btn"
            onClick={() => setMenu(true)}
            aria-label="Open menu"
          >
            <Icon name="menu" />
          </button>

          <div className="page-heading">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          <div className="top-actions">
            <button
              className="icon-btn"
              onClick={() => navigate("notifications")}
              aria-label={
                unreadCount > 0
                  ? `Notifications, ${unreadCount} unread`
                  : "Notifications"
              }
            >
              <Icon name="bell" />
              {unreadCount > 0 && <i />}
            </button>

            <div className="profile">
              <div className="avatar">{getInitials(user)}</div>
              <div>
                <strong>{getDisplayName(user)}</strong>
                <small>{user.email}</small>
              </div>
              <Icon name="chevron" size={15} />
            </div>
          </div>
        </header>

        <div className="content">{children}</div>
      </main>

      {confirmSignOut && (
        <Modal title="Sign out?" close={() => setConfirmSignOut(false)}>
          <p>Are you sure you want to sign out of your account?</p>

          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setConfirmSignOut(false)}>
              Cancel
            </Button>
            <Button icon="logout" onClick={onLogout}>
              Sign out
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}