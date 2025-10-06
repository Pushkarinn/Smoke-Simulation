import React from 'react';
import { useMapboxThree, UseMapboxThreeOptions } from '../hooks/useMapboxThree';

interface MapboxThreeWithHookProps {
  options?: UseMapboxThreeOptions;
  controlsComponent?: React.ReactNode;
}

const MapboxThreeWithHook: React.FC<MapboxThreeWithHookProps> = ({ options = {}, controlsComponent }) => {
  const { mapContainer, loadingState } = useMapboxThree(options);

  const renderContent = () => {
    if (loadingState.error) {
      return (
        <div className="error-content">
          <h3>Error</h3>
          <p style={{ color: 'red' }}>{loadingState.error}</p>
          {loadingState.error.includes('access token') && (
            <div>
              <p>To fix this:</p>
              <ol>
                <li>Get your access token from <a href="https://account.mapbox.com/" target="_blank" rel="noopener noreferrer">Mapbox Account</a></li>
                <li>Create a <code>.env</code> file in the project root</li>
                <li>Add: <code>REACT_APP_MAPBOX_ACCESS_TOKEN=your_token_here</code></li>
                <li>Restart the development server</li>
              </ol>
            </div>
          )}
        </div>
      );
    }

    if (loadingState.isLoading) {
      return (
        <div className="loading-content">
          <h3>Loading 3D Model</h3>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${loadingState.progress}%` }}
            ></div>
          </div>
          <p>{Math.round(loadingState.progress)}% loaded</p>
        </div>
      );
    }

    return (
      <div className="success-content">
        <h3>3D Model Loaded</h3>
        <p>Successfully loaded 3D model with smoke particle system!</p>
        <div className="info-details">
          <h4>Technical Details:</h4>
          <ul>
            <li>GLTF model format</li>
            <li>Three.js particle system</li>
            <li>Real-time smoke simulation</li>
            <li>Custom Mapbox layer</li>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="mapbox-three-container">
      <div ref={mapContainer} className="map-container" />
      <div className="info-panel">
        {renderContent()}
      </div>
      {/* Always show controls, positioned separately for better visibility */}
      {controlsComponent && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(255, 255, 255, 0.98)',
          padding: '15px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(10px)',
          zIndex: 1001,
          maxWidth: '400px',
          border: '2px solid rgba(0, 123, 255, 0.2)'
        }}>
          {controlsComponent}
        </div>
      )}
    </div>
  );
};

export default MapboxThreeWithHook;