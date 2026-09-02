import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <NavLink to={isAdmin ? '/admin' : '/'} className="brand">
            Receipt Hub
          </NavLink>
          {isAdmin ? (
            <>
              <NavLink to="/admin" end>Dashboard</NavLink>
              <NavLink to="/admin/receipts">Receipts</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/" end>Dashboard</NavLink>
              <NavLink to="/upload">Upload</NavLink>
              <NavLink to="/receipts">Receipts</NavLink>
              <NavLink to="/vouchers">Vouchers</NavLink>
              <NavLink to="/settings">Settings</NavLink>
            </>
          )}
          <button
            className="secondary"
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
          >
            Log out
          </button>
        </div>
      </nav>
      <div className="container">
        <Outlet />
      </div>
    </>
  );
}
