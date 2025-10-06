import React, { useState } from 'react';
import * as THREE from 'three';
import MapboxThreeWithHook from '../components/MapboxThreeWithHook';
import { UseMapboxThreeOptions } from '../hooks/useMapboxThree';

// Different 3D model configurations
const modelConfigurations: Record<string, UseMapboxThreeOptions> = {
  default: {
    modelUrl: 'https://docs.mapbox.com/mapbox-gl-js/assets/34M_17/34M_17.gltf',
    modelOrigin: [148.9819, -35.39847],
    initialCenter: [148.9819, -35.3981],
    initialZoom: 18,
    initialPitch: 60,
    enableSmoke: true,
    smokePosition: [0, 8, 0],
    smokeOptions: {
      particleCount: 120,
      particleSize: 20.0,
      particleColor: 0x666666,
      emissionRate: 10,
      particleLifetime: 7.0,
      gravity: -0.15,
      startVelocity: new THREE.Vector3(0, 0.3, 0),
      wind: new THREE.Vector3(0.04, 0, 0.02),
      startVelocityRandomness: 0.12
    }
  },
  
  // You can add more configurations here for different models
  // Example for a different location:
  customLocation: {
    modelUrl: 'https://docs.mapbox.com/mapbox-gl-js/assets/34M_17/34M_17.gltf',
    modelOrigin: [-74.006, 40.7128], // New York coordinates
    initialCenter: [-74.006, 40.7128],
    initialZoom: 16,
    initialPitch: 45,
    modelAltitude: 10,
    modelRotation: [0, 0, 0],
    enableSmoke: true,
    smokePosition: [0, 15, 0],
    smokeOptions: {
      particleCount: 100,
      particleSize: 22.0,
      particleColor: 0x777777,
      emissionRate: 6,
      particleLifetime: 8.0,
      gravity: -0.10,
      startVelocity: new THREE.Vector3(0, 0.28, 0),
      wind: new THREE.Vector3(0.05, 0, 0.03),
      startVelocityRandomness: 0.12
    }
  },

  smokeDemo: {
    modelUrl: 'https://docs.mapbox.com/mapbox-gl-js/assets/34M_17/34M_17.gltf',
    modelOrigin: [148.9819, -35.39847],
    initialCenter: [148.9819, -35.3981],
    initialZoom: 19,
    initialPitch: 70,
    enableSmoke: true,
    smokePosition: [0, 5, 0],
    smokeOptions: {
      particleCount: 180,
      particleSize: 18.0,
      particleColor: 0x555555,
      emissionRate: 25,
      particleLifetime: 9.0,
      gravity: -0.18,
      wind: new THREE.Vector3(0.06, 0, 0.04),
      startVelocity: new THREE.Vector3(0, 0.35, 0),
      startVelocityRandomness: 0.18,
      fadeIn: 0.1,
      fadeOut: 0.4
    }
  }
};

const MultiModelDemo: React.FC = () => {
  const [selectedConfig, setSelectedConfig] = useState<keyof typeof modelConfigurations>('default');
  const [smokeEnabled, setSmokeEnabled] = useState<boolean>(true);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>      
      <MapboxThreeWithHook 
        key={`${selectedConfig}-${smokeEnabled}`} // Force re-render when config or smoke changes
        options={{
          ...modelConfigurations[selectedConfig],
          enableSmoke: smokeEnabled && modelConfigurations[selectedConfig].enableSmoke
        }}
        controlsComponent={
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            <div>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#444', fontWeight: '600' }}>🎮 Model Configuration</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {Object.keys(modelConfigurations).map((configKey) => (
                  <button
                    key={configKey}
                    onClick={() => setSelectedConfig(configKey as keyof typeof modelConfigurations)}
                    style={{
                      padding: '8px 12px',
                      border: selectedConfig === configKey ? '2px solid #007bff' : '2px solid #e0e0e0',
                      background: selectedConfig === configKey ? '#007bff' : 'white',
                      color: selectedConfig === configKey ? 'white' : '#333',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: selectedConfig === configKey ? 'bold' : '500',
                      textTransform: 'capitalize',
                      transition: 'all 0.2s ease',
                      boxShadow: selectedConfig === configKey ? '0 2px 8px rgba(0, 123, 255, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedConfig !== configKey) {
                        e.currentTarget.style.background = '#f8f9fa';
                        e.currentTarget.style.borderColor = '#007bff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedConfig !== configKey) {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.borderColor = '#e0e0e0';
                      }
                    }}
                  >
                    {configKey.replace(/([A-Z])/g, ' $1').trim()}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#444', fontWeight: '600' }}>💨 Smoke Effect</h4>
              <button
                onClick={() => setSmokeEnabled(!smokeEnabled)}
                style={{
                  padding: '10px 20px',
                  border: '2px solid ' + (smokeEnabled ? '#28a745' : '#dc3545'),
                  background: smokeEnabled ? '#28a745' : '#dc3545',
                  color: 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  width: '140px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                }}
              >
                {smokeEnabled ? '✅ ON' : '❌ OFF'}
              </button>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default MultiModelDemo;