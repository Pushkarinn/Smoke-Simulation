import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { SmokeParticleSystem, SmokeParticleOptions } from '../utils/SmokeParticleSystem';

interface UseMapboxThreeOptions {
  mapStyle?: string;
  initialZoom?: number;
  initialCenter?: [number, number];
  initialPitch?: number;
  modelUrl?: string;
  modelOrigin?: [number, number];
  modelAltitude?: number;
  modelRotation?: [number, number, number];
  lightColor?: number;
  lightPositions?: Array<[number, number, number]>;
  enableSmoke?: boolean;
  smokeOptions?: SmokeParticleOptions;
  smokePosition?: [number, number, number];
}

interface LoadingState {
  isLoading: boolean;
  error: string | null;
  progress: number;
}

export const useMapboxThree = (options: UseMapboxThreeOptions = {}) => {
  const {
    mapStyle = 'mapbox://styles/mapbox/standard',
    initialZoom = 18,
    initialCenter = [148.9819, -35.3981],
    initialPitch = 60,
    modelUrl = 'https://docs.mapbox.com/mapbox-gl-js/assets/34M_17/34M_17.gltf',
    modelOrigin = [148.9819, -35.39847],
    modelAltitude = 0,
    modelRotation = [Math.PI / 2, 0, 0],
    lightColor = 0xffffff,
    lightPositions = [[0, -70, 100], [0, 70, 100]],
    enableSmoke = true,
    smokeOptions = {},
    smokePosition = [0, 5, 0]
  } = options;

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const customLayerRef = useRef<mapboxgl.CustomLayerInterface | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    error: null,
    progress: 0
  });

  // Set Mapbox access token only once
  if (!mapboxgl.accessToken || mapboxgl.accessToken === 'YOUR_MAPBOX_ACCESS_TOKEN') {
    mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || 'YOUR_MAPBOX_ACCESS_TOKEN';
  }

  useEffect(() => {
    if (!mapContainer.current) return;
    
    // Prevent multiple map instances
    if (map.current) {
      map.current.remove();
      map.current = null;
    }

    // Check if Mapbox access token is provided
    if (!mapboxgl.accessToken || mapboxgl.accessToken === 'YOUR_MAPBOX_ACCESS_TOKEN') {
      setLoadingState({
        isLoading: false,
        error: 'Please provide a valid Mapbox access token',
        progress: 0
      });
      return;
    }

    // Initialize the map with better WebGL handling
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle,
        zoom: initialZoom,
        center: initialCenter,
        pitch: initialPitch,
        antialias: true,
        preserveDrawingBuffer: true,
        failIfMajorPerformanceCaveat: false
      });
    } catch (error) {
      console.error('Failed to initialize Mapbox map:', error);
      setLoadingState({
        isLoading: false,
        error: 'Failed to initialize map. WebGL may not be supported.',
        progress: 0
      });
      return;
    }

    // Calculate model transformation parameters
    const modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
      modelOrigin,
      modelAltitude
    );

    const modelTransform = {
      translateX: modelAsMercatorCoordinate.x,
      translateY: modelAsMercatorCoordinate.y,
      translateZ: modelAsMercatorCoordinate.z,
      rotateX: modelRotation[0],
      rotateY: modelRotation[1],
      rotateZ: modelRotation[2],
      scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits(),
    };

    // Configuration of the custom layer for a 3D model
    customLayerRef.current = {
      id: '3d-model',
      type: 'custom',
      renderingMode: '3d',
      
      onAdd: function (map: mapboxgl.Map, gl: WebGLRenderingContext) {
        try {
          this.camera = new THREE.Camera();
          this.scene = new THREE.Scene();
          (this as any).clock = new THREE.Clock();

          // Create lights
          lightPositions.forEach(position => {
            const directionalLight = new THREE.DirectionalLight(lightColor);
            directionalLight.position.set(...position).normalize();
            if (this.scene) {
              this.scene.add(directionalLight);
            }
          });

          // Initialize smoke particle system if enabled
          if (enableSmoke) {
            (this as any).smokeSystem = new SmokeParticleSystem({
              particleCount: 250,
              particleSize: 12.0,
              particleOpacity: 0.8,
              particleColor: 0xcccccc,
              emissionRate: 25,
              particleLifetime: 5.0,
              gravity: -0.0008,
              wind: new THREE.Vector3(0.003, 0, 0.002),
              startVelocity: new THREE.Vector3(0, 0.02, 0),
              startVelocityRandomness: 0.01,
              fadeIn: 0.1,
              fadeOut: 0.7,
              ...smokeOptions
            });
            
            const smokeParticles = (this as any).smokeSystem.getParticleSystem();
            smokeParticles.position.set(...smokePosition);
            if (this.scene) {
              this.scene.add(smokeParticles);
            }
          }

          // Load 3D model
          const loader = new GLTFLoader();
          loader.load(
            modelUrl,
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
          this.renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: true,
            preserveDrawingBuffer: true
          });
          this.renderer.autoClear = false;
        } catch (error) {
          console.error('Error in custom layer onAdd:', error);
          setLoadingState({
            isLoading: false,
            error: 'Failed to initialize 3D layer',
            progress: 0
          });
        }
      },
      
      render: function (gl: WebGLRenderingContext, matrix: number[]) {
        try {
          // Update smoke particles if enabled
          if (enableSmoke && (this as any).smokeSystem && (this as any).clock) {
            const deltaTime = (this as any).clock.getDelta();
            (this as any).smokeSystem.update(deltaTime);
          }

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

          if (this.camera && this.renderer && this.scene && this.map) {
            this.camera.projectionMatrix = m.multiply(l);
            this.renderer.resetState();
            this.renderer.render(this.scene, this.camera);
            this.map.triggerRepaint();
          }
        } catch (error) {
          console.error('Error in custom layer render:', error);
        }
      }
    };

    // Add event listeners
    map.current.on('style.load', () => {
      if (map.current && customLayerRef.current) {
        try {
          map.current.addLayer(customLayerRef.current);
        } catch (error) {
          console.error('Failed to add custom layer:', error);
          setLoadingState({
            isLoading: false,
            error: 'Failed to add 3D layer',
            progress: 0
          });
        }
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
        try {
          // Remove custom layer first
          if (customLayerRef.current && map.current.getLayer('3d-model')) {
            map.current.removeLayer('3d-model');
          }
          // Remove map
          map.current.remove();
          map.current = null;
          customLayerRef.current = null;
        } catch (error) {
          console.error('Error during cleanup:', error);
        }
      }
    };
  }, [
    modelUrl,
    JSON.stringify(modelOrigin),
    enableSmoke,
    JSON.stringify(smokeOptions),
    JSON.stringify(smokePosition)
  ]);

  return {
    mapContainer,
    map: map.current,
    loadingState
  };
};

export type { UseMapboxThreeOptions, LoadingState };