import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// Configuration object for easy customization
const CONFIG = {
  // Map configuration
  mapStyle: 'mapbox://styles/mapbox/standard',
  initialZoom: 18,
  initialCenter: [148.9819, -35.3981] as [number, number],
  initialPitch: 60,
  
  // 3D Model configuration
  modelUrl: 'https://docs.mapbox.com/mapbox-gl-js/assets/34M_17/34M_17.gltf',
  modelOrigin: [148.9819, -35.39847] as [number, number],
  modelAltitude: 0,
  modelRotation: [Math.PI / 2, 0, 0] as [number, number, number],
  
  // Lighting configuration
  lightColor: 0xffffff,
  lightPositions: [
    [0, -70, 100],
    [0, 70, 100]
  ] as Array<[number, number, number]>
};

// Set Mapbox access token from environment variable or fallback
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || 'YOUR_MAPBOX_ACCESS_TOKEN';

interface LoadingState {
  isLoading: boolean;
  error: string | null;
  progress: number;
}

const MapboxThreeComponent: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    error: null,
    progress: 0
  });

  useEffect(() => {
    if (!mapContainer.current) return;

    // Check if Mapbox access token is provided
    if (!mapboxgl.accessToken || mapboxgl.accessToken === 'YOUR_MAPBOX_ACCESS_TOKEN') {
      setLoadingState({
        isLoading: false,
        error: 'Please provide a valid Mapbox access token',
        progress: 0
      });
      return;
    }

    // Initialize the map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: CONFIG.mapStyle,
      zoom: CONFIG.initialZoom,
      center: CONFIG.initialCenter,
      pitch: CONFIG.initialPitch,
      antialias: true, // create the gl context with MSAA antialiasing
    });

    // Calculate model transformation parameters
    const modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
      CONFIG.modelOrigin,
      CONFIG.modelAltitude
    );

    const modelTransform = {
      translateX: modelAsMercatorCoordinate.x,
      translateY: modelAsMercatorCoordinate.y,
      translateZ: modelAsMercatorCoordinate.z,
      rotateX: CONFIG.modelRotation[0],
      rotateY: CONFIG.modelRotation[1],
      rotateZ: CONFIG.modelRotation[2],
      scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits(),
    };

    // Configuration of the custom layer for a 3D model per the CustomLayerInterface
    const customLayer: mapboxgl.CustomLayerInterface = {
      id: '3d-model',
      type: 'custom',
      renderingMode: '3d',
      
      onAdd: function (map: mapboxgl.Map, gl: WebGLRenderingContext) {
        // Initialize Three.js components
        this.camera = new THREE.Camera();
        this.scene = new THREE.Scene();

        // Create lights to illuminate the model
        CONFIG.lightPositions.forEach(position => {
          const directionalLight = new THREE.DirectionalLight(CONFIG.lightColor);
          directionalLight.position.set(...position).normalize();
          if (this.scene) {
            this.scene.add(directionalLight);
          }
        });

        // Use the three.js GLTF loader to add the 3D model to the three.js scene
        const loader = new GLTFLoader();
        loader.load(
          CONFIG.modelUrl,
          (gltf: any) => {
            if (this.scene) {
              this.scene.add(gltf.scene);
            }
            setLoadingState(prev => ({
              ...prev,
              isLoading: false,
              progress: 100
            }));
          },
          (progress: any) => {
            if (progress.lengthComputable) {
              const percentComplete = (progress.loaded / progress.total) * 100;
              setLoadingState(prev => ({
                ...prev,
                progress: percentComplete
              }));
            }
          },
          (error: any) => {
            console.error('Error loading 3D model:', error);
            setLoadingState({
              isLoading: false,
              error: 'Failed to load 3D model',
              progress: 0
            });
          }
        );

        this.map = map;

        // Use the Mapbox GL JS map canvas for three.js
        this.renderer = new THREE.WebGLRenderer({
          canvas: map.getCanvas(),
          context: gl,
          antialias: true,
        });

        this.renderer.autoClear = false;
      },
      
      render: function (gl: WebGLRenderingContext, matrix: number[]) {
        // Create rotation matrices
        const rotationX = new THREE.Matrix4().makeRotationAxis(
          new THREE.Vector3(1, 0, 0),
          modelTransform.rotateX
        );
        const rotationY = new THREE.Matrix4().makeRotationAxis(
          new THREE.Vector3(0, 1, 0),
          modelTransform.rotateY
        );
        const rotationZ = new THREE.Matrix4().makeRotationAxis(
          new THREE.Vector3(0, 0, 1),
          modelTransform.rotateZ
        );

        // Create transformation matrix
        const m = new THREE.Matrix4().fromArray(matrix);
        const l = new THREE.Matrix4()
          .makeTranslation(
            modelTransform.translateX,
            modelTransform.translateY,
            modelTransform.translateZ || 0
          )
          .scale(
            new THREE.Vector3(
              modelTransform.scale,
              -modelTransform.scale,
              modelTransform.scale
            )
          )
          .multiply(rotationX)
          .multiply(rotationY)
          .multiply(rotationZ);

        // Render the scene
        if (this.camera && this.renderer && this.scene && this.map) {
          this.camera.projectionMatrix = m.multiply(l);
          this.renderer.resetState();
          this.renderer.render(this.scene, this.camera);
          this.map.triggerRepaint();
        }
      },
    };

    // Add event listeners
    map.current.on('style.load', () => {
      if (map.current) {
        map.current.addLayer(customLayer);
      }
    });

    map.current.on('error', (e: any) => {
      console.error('Mapbox error:', e);
      setLoadingState({
        isLoading: false,
        error: 'Failed to load map',
        progress: 0
      });
    });

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

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
        <p>Successfully loaded 3D model on Mapbox using React and Three.js!</p>
        <div className="info-details">
          <h4>Technical Details:</h4>
          <ul>
            <li>GLTF model format</li>
            <li>Mercator coordinate system</li>
            <li>Three.js WebGL renderer</li>
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
    </div>
  );
};

export default MapboxThreeComponent;