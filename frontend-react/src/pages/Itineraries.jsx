import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { tripService } from '../services/tripService';
import { generateItinerary, getItineraryByTripId } from '../services/itineraryService';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import '../styles/Itineraries.css';

const Itineraries = () => {
  const { getUser, logout } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(getUser());
  const [showMenu, setShowMenu] = useState(false);
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [interestType, setInterestType] = useState('');
  const [budgetType, setBudgetType] = useState('');
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState(null);
  const [error, setError] = useState('');

  const interestTypes = [
    'Cultura e Historia',
    'Naturaleza y Aventura',
    'Gastronomía',
    'Deportes y Aventura'
  ];

  const budgetTypes = [
    'Económico',
    'Medio',
    'Alto'
  ];

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const response = await tripService.getAllTrips();
      console.log('Response from tripService:', response);
      
      // Handle different response formats
      let allTrips = [];
      if (response.success && response.data) {
        allTrips = response.data;
      } else if (Array.isArray(response)) {
        allTrips = response;
      }
      
      console.log(`Found ${allTrips.length} trips`);
      setTrips(Array.isArray(allTrips) ? allTrips : []);
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError('Error al cargar los viajes');
    }
  };

  const handleTripChange = async (e) => {
    const tripId = e.target.value;
    const trip = trips.find(t => t._id === tripId);
    setSelectedTrip(trip);
    setItinerary(null);
    setError('');

    // Check if itinerary already exists for this trip
    if (tripId) {
      try {
        const response = await getItineraryByTripId(tripId);
        if (response.success) {
          setItinerary(response.data);
          setInterestType(response.data.interestType);
        }
      } catch (err) {
        // No itinerary exists yet, that's ok
        console.log('No existing itinerary found');
      }
    }
  };

  const handleGenerateItinerary = async () => {
    if (!selectedTrip) {
      setError('Por favor selecciona un viaje');
      return;
    }
    if (!interestType) {
      setError('Por favor selecciona un tipo de interés');
      return;
    }
    if (!budgetType) {
      setError('Por favor selecciona un tipo de presupuesto');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await generateItinerary({
        tripId: selectedTrip._id,
        interestType: interestType,
        budgetType: budgetType
      });
      if (response.success) {
        setItinerary(response.data);
      }
    } catch (err) {
      console.error('Error generating itinerary:', err);
      setError(err.message || 'Error al generar el itinerario');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!itinerary || !selectedTrip) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPos = 20;

    // Colors
    const primaryColor = [71, 245, 154]; // #47F59A
    const darkBg = [26, 26, 26];
    const lightText = [160, 160, 160];
    const whiteText = [255, 255, 255];

    // ========== HEADER ==========
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    // Logo/Title
    doc.setTextColor(26, 26, 26);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('TravelBrain', 15, 15);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Plan de Itinerario', 15, 25);

    // Date generated
    doc.setFontSize(9);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, pageWidth - 15, 15, { align: 'right' });

    yPos = 45;

    // ========== TRIP INFORMATION ==========
    doc.setFillColor(245, 245, 245);
    doc.rect(15, yPos, pageWidth - 30, 35, 'F');
    
    doc.setTextColor(26, 26, 26);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`Destino: ${selectedTrip.destination}`, 20, yPos + 8);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fechas: ${formatDate(selectedTrip.startDate)} - ${formatDate(selectedTrip.endDate)}`, 20, yPos + 16);
    doc.text(`Presupuesto Total: ${formatCurrency(selectedTrip.budget)}`, 20, yPos + 23);
    doc.text(`Tipo de Interés: ${itinerary.interestType}`, 20, yPos + 30);
    doc.text(`Categoría: ${itinerary.budgetType}`, pageWidth - 20, yPos + 30, { align: 'right' });

    yPos += 42;

    // ========== USER INFORMATION ==========
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 245, 154);
    doc.text('Información del Usuario', 15, yPos);
    
    yPos += 7;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Nombre: ${user?.name || user?.username || 'Usuario'}`, 20, yPos);
    doc.text(`Email: ${user?.email || 'N/A'}`, 20, yPos + 5);

    yPos += 15;

    // ========== WEATHER SUMMARY ==========
    if (itinerary.weatherInfo?.averageTemp) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 245, 154);
      doc.text('Pronóstico del Clima', 15, yPos);
      
      yPos += 7;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(`Temperatura Promedio: ${itinerary.weatherInfo.averageTemp}°C`, 20, yPos);
      doc.text(`Condiciones: ${itinerary.weatherInfo.conditions || 'Variable'}`, 20, yPos + 5);
      
      yPos += 15;
    }

    // ========== BUDGET BREAKDOWN ==========
    if (itinerary.budgetBreakdown) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 245, 154);
      doc.text('Desglose de Presupuesto', 15, yPos);
      
      yPos += 5;

      const budgetData = [
        ['Categoría', 'Monto'],
        ['Hospedaje', formatCurrency(itinerary.budgetBreakdown.accommodation || 0)],
        ['Alimentación', formatCurrency(itinerary.budgetBreakdown.food || 0)],
        ['Actividades', formatCurrency(itinerary.budgetBreakdown.activities || 0)],
        ['Transporte', formatCurrency(itinerary.budgetBreakdown.transport || 0)],
        ['Extras', formatCurrency(itinerary.budgetBreakdown.extras || 0)],
        ['TOTAL', formatCurrency(itinerary.budgetBreakdown.total || 0)]
      ];

      doc.autoTable({
        startY: yPos,
        head: [budgetData[0]],
        body: budgetData.slice(1),
        theme: 'grid',
        headStyles: { 
          fillColor: [71, 245, 154], 
          textColor: [26, 26, 26],
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: { 
          fontSize: 9,
          textColor: [50, 50, 50]
        },
        footStyles: {
          fillColor: [245, 245, 245],
          textColor: [26, 26, 26],
          fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        margin: { left: 15, right: 15 },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 'auto', halign: 'right' }
        }
      });

      yPos = doc.lastAutoTable.finalY + 15;
    }

    // ========== DAILY ITINERARY ==========
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 245, 154);
    
    // Check if we need a new page
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.text('Itinerario Detallado', 15, yPos);
    yPos += 10;

    // Iterate through each day
    itinerary.dailyActivities.forEach((day, dayIndex) => {
      // Check if we need a new page
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
      }

      // Day header with weather
      doc.setFillColor(71, 245, 154);
      doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F');
      
      doc.setTextColor(26, 26, 26);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Día ${day.day} - ${formatDate(day.date)}`, 20, yPos + 2);

      // Weather info for the day
      const dayWeather = itinerary.weatherInfo?.dailyForecasts?.find((f, i) => i === day.day - 1);
      if (dayWeather) {
        doc.setFontSize(9);
        doc.text(`${dayWeather.temp}°C - ${dayWeather.condition}`, pageWidth - 20, yPos + 2, { align: 'right' });
      }

      yPos += 10;

      // Activities table
      const activitiesData = day.activities.map(activity => [
        activity.time,
        activity.title,
        activity.description || '',
        formatCurrency(activity.cost || 0)
      ]);

      doc.autoTable({
        startY: yPos,
        head: [['Hora', 'Actividad', 'Descripción', 'Costo']],
        body: activitiesData,
        theme: 'striped',
        headStyles: { 
          fillColor: [245, 245, 245], 
          textColor: [26, 26, 26],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: { 
          fontSize: 8,
          textColor: [50, 50, 50]
        },
        alternateRowStyles: { fillColor: [252, 252, 252] },
        margin: { left: 20, right: 20 },
        columnStyles: {
          0: { cellWidth: 20, fontStyle: 'bold' },
          1: { cellWidth: 50 },
          2: { cellWidth: 70 },
          3: { cellWidth: 25, halign: 'right' }
        }
      });

      yPos = doc.lastAutoTable.finalY + 8;
    });

    // ========== FOOTER ==========
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Página ${i} de ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      doc.text(
        'TravelBrain - Tu compañero de viaje',
        pageWidth - 15,
        pageHeight - 10,
        { align: 'right' }
      );
    }

    // Save PDF
    const filename = `Itinerario_${selectedTrip.destination.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="itineraries-page">
      {/* Navbar */}
      <nav className="navbar itineraries-navbar">
        <div className="container navbar-content">
          <div className="navbar-left">
            <img src="/assets/images/logo.png" alt="Logo" className="navbar-logo" />
            <span className="navbar-brand">TravelBrain</span>
          </div>

          <div className="navbar-center">
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/trips" className="nav-link">My Trips</Link>
            <Link to="/itineraries" className="nav-link active">Itineraries</Link>
            <Link to="/destinations" className="nav-link">Destinations</Link>
            <Link to="/weather" className="nav-link">Weather</Link>
          </div>

          <div className="navbar-right">
            <div className="user-menu">
              <button 
                className="user-menu-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
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

      <div className="itineraries-container">
        <div className="itineraries-header">
          <h1>Generador de Itinerarios</h1>
          <p>Crea itinerarios personalizados para tus viajes</p>
        </div>

      <div className="itinerary-form">
        <div className="form-group">
          <label htmlFor="trip-select">Seleccionar Viaje</label>
          <select
            id="trip-select"
            value={selectedTrip?._id || ''}
            onChange={handleTripChange}
            className="form-control"
          >
            <option value="">-- Selecciona un viaje --</option>
            {trips.map((trip) => (
              <option key={trip._id} value={trip._id}>
                {trip.destination} - {formatDate(trip.startDate)} a {formatDate(trip.endDate)}
              </option>
            ))}
          </select>
        </div>

        {selectedTrip && (
          <>
            <div className="trip-details">
              <h3>Detalles del Viaje</h3>
              <div className="trip-info">
                <p><strong>Destino:</strong> {selectedTrip.destination}</p>
                <p><strong>Fecha de inicio:</strong> {formatDate(selectedTrip.startDate)}</p>
                <p><strong>Fecha de fin:</strong> {formatDate(selectedTrip.endDate)}</p>
                <p><strong>Presupuesto:</strong> {formatCurrency(selectedTrip.budget || 0)}</p>
                <p><strong>Descripción:</strong> {selectedTrip.description || 'Sin descripción'}</p>
              </div>
            </div>

            <div className="form-group">
              <label>Tipo de Interés</label>
              <div className="interest-types">
                {interestTypes.map((type) => (
                  <button
                    key={type}
                    className={`interest-btn ${interestType === type ? 'active' : ''}`}
                    onClick={() => setInterestType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Tipo de Presupuesto</label>
              <div className="interest-types">
                {budgetTypes.map((type) => (
                  <button
                    key={type}
                    className={`interest-btn ${budgetType === type ? 'active' : ''}`}
                    onClick={() => setBudgetType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="generate-btn"
              onClick={handleGenerateItinerary}
              disabled={loading || !interestType || !budgetType}
            >
              {loading ? 'Generando...' : 'Generar Itinerario'}
            </button>
          </>
        )}

        {error && <div className="error-message">{error}</div>}
      </div>

      {itinerary && (
        <div className="itinerary-result" id="itinerary-content">
          <div className="itinerary-header-section">
            <div className="itinerary-title-row">
              <div>
                <h2>Itinerario generado</h2>
                <h3>Plan de Viaje: {selectedTrip?.destination}</h3>
              </div>
              <button 
                className="download-pdf-btn"
                onClick={handleDownloadPDF}
                title="Descargar PDF"
              >
                <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M.5 9.9a.5.5 0 01.5.5v2.5a1 1 0 001 1h12a1 1 0 001-1v-2.5a.5.5 0 011 0v2.5a2 2 0 01-2 2H2a2 2 0 01-2-2v-2.5a.5.5 0 01.5-.5z"/>
                  <path d="M7.646 11.854a.5.5 0 00.708 0l3-3a.5.5 0 00-.708-.708L8.5 10.293V1.5a.5.5 0 00-1 0v8.793L5.354 8.146a.5.5 0 10-.708.708l3 3z"/>
                </svg>
                Descargar PDF
              </button>
            </div>
            <div className="itinerary-meta">
              <span className="badge badge-interest">{itinerary.interestType}</span>
              <span className="badge badge-budget">{itinerary.budgetType}</span>
              {itinerary.weatherInfo?.averageTemp && (
                <span className="badge badge-weather">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 11.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zm0 1a4.5 4.5 0 110-9 4.5 4.5 0 010 9z"/>
                    <path d="M8 0a.5.5 0 01.5.5v2a.5.5 0 01-1 0v-2A.5.5 0 018 0zm0 13a.5.5 0 01.5.5v2a.5.5 0 01-1 0v-2A.5.5 0 018 13zm8-5a.5.5 0 01-.5.5h-2a.5.5 0 010-1h2a.5.5 0 01.5.5zM3 8a.5.5 0 01-.5.5h-2a.5.5 0 010-1h2A.5.5 0 013 8z"/>
                  </svg>
                  {itinerary.weatherInfo.averageTemp}°C promedio
                </span>
              )}
            </div>
          </div>

          <div className="itinerary-details">
            <h4>Itinerario Detallado</h4>
            {itinerary.dailyActivities.map((day) => {
              // Find weather forecast for this day
              const dayWeather = itinerary.weatherInfo?.dailyForecasts?.find((forecast, index) => index === day.day - 1);
              
              return (
                <div key={day.day} className="day-section">
                  <div className="day-header">
                    <div className="day-title">
                      <h5>Día {day.day} - {formatDate(day.date)}</h5>
                    </div>
                    {dayWeather && (
                      <div className="day-weather">
                        <img 
                          src={dayWeather.icon.startsWith('//') ? `https:${dayWeather.icon}` : dayWeather.icon} 
                          alt={dayWeather.condition}
                          className="weather-icon"
                        />
                        <div className="weather-info">
                          <span className="weather-temp">{dayWeather.temp}°C</span>
                          <span className="weather-condition">{dayWeather.condition}</span>
                          {dayWeather.chanceOfRain > 0 && (
                            <span className="weather-rain">
                              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M8 0a.5.5 0 01.5.5v.5a.5.5 0 01-1 0V.5A.5.5 0 018 0zM0 8a.5.5 0 01.5-.5h.5a.5.5 0 010 1h-.5A.5.5 0 010 8zm13 0a.5.5 0 01.5-.5h.5a.5.5 0 010 1h-.5a.5.5 0 01-.5-.5zM8 13a.5.5 0 01.5.5v.5a.5.5 0 01-1 0v-.5a.5.5 0 01.5-.5zm6.5-8a.5.5 0 00-.5.5 6 6 0 11-12 0 .5.5 0 00-1 0 7 7 0 1014 0 .5.5 0 00-.5-.5z"/>
                              </svg>
                              {dayWeather.chanceOfRain}%
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="activities-list">
                    {day.activities.map((activity, index) => (
                      <div key={index} className="activity-item">
                        <div className="activity-time">{activity.time}</div>
                        <div className="activity-details">
                          <div className="activity-title">{activity.title}</div>
                          <div className="activity-cost">${activity.cost}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {itinerary.budgetBreakdown && (
            <div className="budget-section">
              <h4>Presupuesto Estimado</h4>
              <div className="budget-breakdown">
                <div className="budget-item">
                  <span>Hospedaje</span>
                  <span>{formatCurrency(itinerary.budgetBreakdown.accommodation)}</span>
                </div>
                <div className="budget-item">
                  <span>Alimentación</span>
                  <span>{formatCurrency(itinerary.budgetBreakdown.food)}</span>
                </div>
                <div className="budget-item">
                  <span>Actividades y Tours</span>
                  <span>{formatCurrency(itinerary.budgetBreakdown.activities)}</span>
                </div>
                <div className="budget-item">
                  <span>Transporte Local</span>
                  <span>{formatCurrency(itinerary.budgetBreakdown.transport)}</span>
                </div>
                <div className="budget-item">
                  <span>Extras - Compras</span>
                  <span>{formatCurrency(itinerary.budgetBreakdown.extras)}</span>
                </div>
                <div className="budget-item budget-total">
                  <span><strong>Total Estimado</strong></span>
                  <span><strong>{formatCurrency(itinerary.budgetBreakdown.total)}</strong></span>
                </div>
              </div>
            </div>
          )}

          <div className="itinerary-actions">
            <button className="download-btn" onClick={handleDownloadPDF}>
              📄 Guardar como PDF
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Itineraries;
