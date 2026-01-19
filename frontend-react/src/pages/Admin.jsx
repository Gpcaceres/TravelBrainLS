import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import '../styles/Admin.css';

function Admin() {
  const { getUser, logout } = useAuth();
  const [user, setUser] = useState(getUser());
  const [users, setUsers] = useState([]);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    role: ''
  });
  const navigate = useNavigate();
  const usersPerPage = 10;
  const isInitialLoad = !users.length && loading;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 1000);

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest('.user-menu')) {
        setShowMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [searchInput, showMenu]);

  useEffect(() => {
    fetchData();
  }, [currentPage, searchTerm, filters]);

  const fetchData = async () => {
    try {
      // Use updating state for non-initial loads to avoid full page reload appearance
      if (users.length > 0) {
        setUpdating(true);
      } else {
        setLoading(true);
      }
      
      // Build query params
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: usersPerPage.toString()
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (filters.status) {
        params.append('status', filters.status);
      }
      
      if (filters.role) {
        params.append('role', filters.role);
      }
      
      const [usersResponse, statsResponse] = await Promise.all([
        api.get(`/users?${params.toString()}`),
        api.get('/users/stats')
      ]);
      
      setUsers(usersResponse.data.data || []);
      setPagination(usersResponse.data.pagination);
      setStats(statsResponse.data.stats);
      setError('');
    } catch (err) {
      console.error('Error al cargar datos:', err);
      if (err.response?.status === 403) {
        setError('No tienes permisos de administrador');
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        setError('Error al cargar los datos de usuarios');
      }
    } finally {
      setLoading(false);
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    setShowMenu(false);
    logout();
    navigate('/login');
  };

  const handleActivateUser = async (userId) => {
    setUpdatingUserId(userId);
    try {
      const response = await api.patch(`/users/${userId}/activate`);
      setSuccessMessage(response.data.message);
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchData();
    } catch (err) {
      console.error('Error al activar usuario:', err);
      setError(err.response?.data?.message || 'Error al activar usuario');
      setTimeout(() => setError(''), 3000);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeactivateUser = async (userId) => {
    setUpdatingUserId(userId);
    try {
      const response = await api.patch(`/users/${userId}/deactivate`);
      setSuccessMessage(response.data.message);
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchData();
    } catch (err) {
      console.error('Error al desactivar usuario:', err);
      setError(err.response?.data?.message || 'Error al desactivar usuario');
      setTimeout(() => setError(''), 3000);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('¿Seguro que deseas eliminar este usuario?')) return;
    setDeletingUserId(userId);
    try {
      const response = await api.delete(`/users/${userId}`);
      setSuccessMessage(response.data.message || 'Usuario eliminado');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchData();
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      setError(err.response?.data?.message || 'Error al eliminar usuario');
      setTimeout(() => setError(''), 3000);
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    if (currentStatus === 'ACTIVE') {
      await handleDeactivateUser(userId);
    } else {
      await handleActivateUser(userId);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      const response = await api.patch(`/users/${userId}/role`, { role: newRole });
      setSuccessMessage(response.data.message);
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchData();
    } catch (err) {
      console.error('Error al cambiar rol:', err);
      setError(err.response?.data?.message || 'Error al cambiar rol de usuario');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleSearch = (e) => {
    setSearchInput(e.target.value);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setCurrentPage(1); // Reset to first page on filter
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN': return 'role-admin';
      case 'REGISTERED': return 'role-registered';
      case 'USER': return 'role-user';
      default: return '';
    }
  };

  const getStatusColor = (status) => {
    return status === 'ACTIVE' ? 'status-active' : 'status-inactive';
  };

  if (isInitialLoad) {
    return (
      <div className="admin-container">
        <div className="loading">Cargando panel de administración...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Navbar */}
      <nav className="admin-navbar">
        <div className="container navbar-content">
          <div className="navbar-left">
            <img src="/assets/images/logo.png" alt="Logo" className="navbar-logo" />
            <span className="navbar-brand">TravelBrain</span>
          </div>
          
          <div className="navbar-center">
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/trips" className="nav-link">My Trips</Link>
            <Link to="/destinations" className="nav-link">Destinations</Link>
            <Link to="/weather" className="nav-link">Weather</Link>
          </div>

          <div className="navbar-right">
            <div className="user-menu">
              <button 
                className="user-menu-btn"
                onClick={() => setShowMenu(!showMenu)}
              >
                <div className="user-avatar">
                  {(user?.name || user?.username || 'U').substring(0, 2).toUpperCase()}
                </div>
                <span className="user-name">{user?.name || user?.username || 'User'}</span>
                <span className={`dropdown-arrow ${showMenu ? 'rotated' : ''}`}>▼</span>
              </button>

              {showMenu && (
                <div className="user-menu-dropdown">
                  <div className="dropdown-header">
                    <div className="dropdown-user-info">
                      <div className="dropdown-avatar">
                        {(user?.name || user?.username || 'U').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="dropdown-name">{user?.name || user?.username || 'User'}</p>
                        <p className="dropdown-email">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link to="/profile" className="dropdown-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm2.5 1h-5A2.5 2.5 0 003 11.5V13a1 1 0 001 1h8a1 1 0 001-1v-1.5A2.5 2.5 0 0010.5 9z"/>
                    </svg>
                    Profile Settings
                  </Link>
                  {user?.role === 'ADMIN' && (
                    <Link to="/admin" className="dropdown-item">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M1.5 1.5A.5.5 0 012 1h12a.5.5 0 01.5.5v2a.5.5 0 01-.128.334L10 8.692V13.5a.5.5 0 01-.342.474l-3 1A.5.5 0 016 14.5V8.692L1.628 3.834A.5.5 0 011.5 3.5v-2z"/>
                      </svg>
                      Admin Panel
                    </Link>
                  )}
                  <div className="dropdown-divider"></div>
                  <button onClick={handleLogout} className="dropdown-item logout-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path fillRule="evenodd" d="M10 12.5a.5.5 0 01-.5.5h-8a.5.5 0 01-.5-.5v-9a.5.5 0 01.5-.5h8a.5.5 0 01.5.5v2a.5.5 0 001 0v-2A1.5 1.5 0 009.5 2h-8A1.5 1.5 0 000 3.5v9A1.5 1.5 0 001.5 14h8a1.5 1.5 0 001.5-1.5v-2a.5.5 0 00-1 0v2z"/>
                      <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 000-.708l-3-3a.5.5 0 00-.708.708L14.293 7.5H5.5a.5.5 0 000 1h8.793l-2.147 2.146a.5.5 0 00.708.708l3-3z"/>
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="admin-container">
        <div className="admin-header">
          <div className="admin-header-left">
            <h1>Panel de Administración</h1>
          </div>
        </div>

      {error && <div className="alert alert-error">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      {/* Estadísticas */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total de Usuarios</h3>
            <p className="stat-number">{stats.total}</p>
          </div>
          <div className="stat-card">
            <h3>Usuarios Activos</h3>
            <p className="stat-number stat-active">{stats.byStatus.active}</p>
          </div>
          <div className="stat-card">
            <h3>Usuarios Inactivos</h3>
            <p className="stat-number stat-inactive">{stats.byStatus.inactive}</p>
          </div>
          <div className="stat-card">
            <h3>Administradores</h3>
            <p className="stat-number stat-admin">{stats.byRole.admin}</p>
          </div>
        </div>
      )}

      {/* Tabla de Usuarios */}
      <div className="users-section">
        <h2>Gestión de Usuarios</h2>
        
        {/* Search and Filters */}
        <div className="search-filter-container">
          <div className="search-box">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11.742 10.344a6.5 6.5 0 10-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 001.415-1.414l-3.85-3.85a1.007 1.007 0 00-.115-.1zM12 6.5a5.5 5.5 0 11-11 0 5.5 5.5 0 0111 0z"/>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por email, nombre o username..."
              value={searchInput}
              onChange={handleSearch}
            />
            {searchInput && (
              <button 
                className="clear-search-btn"
                onClick={() => {
                  setSearchInput('');
                  setSearchTerm('');
                }}
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>
          
          <div className="filters">
            <select 
              className="filter-select"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="ACTIVE">Activos</option>
              <option value="INACTIVE">Inactivos</option>
            </select>
            
            <select 
              className="filter-select"
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
            >
              <option value="">Todos los roles</option>
              <option value="ADMIN">Administrador</option>
              <option value="REGISTERED">Registrado</option>
              <option value="USER">Usuario</option>
            </select>
          </div>
        </div>

        {/* Results Info */}
        {pagination && (
          <div className="results-info">
            Mostrando {users.length} de {pagination.totalUsers} usuarios
            {searchTerm && ` (filtrado por "${searchTerm}")`}
          </div>
        )}

        <div className={`table-container ${updating ? 'updating' : ''}`}>
          {updating && (
            <div className="table-updating-indicator">
              <div className="spinner-small"></div>
            </div>
          )}
          <table className="users-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Nombre</th>
                <th>Username</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Fecha Creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>{user.email}</td>
                  <td>{user.name || '-'}</td>
                  <td>{user.username || '-'}</td>
                  <td>
                    <select
                      value={user.role}
                      onChange={(e) => handleChangeRole(user._id, e.target.value)}
                      className={`role-select ${getRoleColor(user.role)}`}
                    >
                      <option value="USER">Usuario</option>
                      <option value="REGISTERED">Registrado</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                  </td>
                  <td>
                    <div className="toggle-switch-container">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={user.status === 'ACTIVE'}
                          onChange={() => handleToggleUserStatus(user._id, user.status)}
                          disabled={updatingUserId === user._id}
                        />
                        <span className="toggle-slider">
                          {updatingUserId === user._id && <span className="toggle-spinner"></span>}
                        </span>
                      </label>
                    </div>
                  </td>
                  <td>
                    {user.createdAt 
                      ? new Date(user.createdAt).toLocaleDateString('es-ES')
                      : '-'
                    }
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteUser(user._id)}
                        title="Quitar usuario"
                        disabled={deletingUserId === user._id}
                      >
                        {deletingUserId === user._id ? 'Eliminando...' : 'Quitar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!pagination.hasPrevPage}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 010 .708L5.707 8l5.647 5.646a.5.5 0 01-.708.708l-6-6a.5.5 0 010-.708l6-6a.5.5 0 01.708 0z"/>
              </svg>
              Anterior
            </button>
            
            <div className="pagination-info">
              {/* First page */}
              {currentPage > 3 && (
                <>
                  <button
                    className="pagination-number"
                    onClick={() => handlePageChange(1)}
                  >
                    1
                  </button>
                  {currentPage > 4 && <span className="pagination-ellipsis">...</span>}
                </>
              )}
              
              {/* Pages around current */}
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(page => {
                  return page === currentPage ||
                         page === currentPage - 1 ||
                         page === currentPage + 1 ||
                         page === currentPage - 2 ||
                         page === currentPage + 2;
                })
                .map(page => (
                  <button
                    key={page}
                    className={`pagination-number ${page === currentPage ? 'active' : ''}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ))}
              
              {/* Last page */}
              {currentPage < pagination.totalPages - 2 && (
                <>
                  {currentPage < pagination.totalPages - 3 && <span className="pagination-ellipsis">...</span>}
                  <button
                    className="pagination-number"
                    onClick={() => handlePageChange(pagination.totalPages)}
                  >
                    {pagination.totalPages}
                  </button>
                </>
              )}
              
              <span className="pagination-text">
                Página {currentPage} de {pagination.totalPages}
              </span>
            </div>
            
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!pagination.hasNextPage}
            >
              Siguiente
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 01.708 0l6 6a.5.5 0 010 .708l-6 6a.5.5 0 01-.708-.708L10.293 8 4.646 2.354a.5.5 0 010-.708z"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}

export default Admin;
