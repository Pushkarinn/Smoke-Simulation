import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// Set Mapbox access token from environment variable or fallback
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || 'YOUR_MAPBOX_ACCESS_TOKEN';

const MapboxThreeComponent: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Check if Mapbox access token is provided
    if (!mapboxgl.accessToken || mapboxgl.accessToken === 'YOUR_MAPBOX_ACCESS_TOKEN') {
      setError('Please provide a valid Mapbox access token');
      setIsLoading(false);
      return;
    }

    // Initialize the map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/standard',
      zoom: 18,
      center: [148.9819, -35.3981],
      pitch: 60,
      antialias: true, // create the gl context with MSAA antialiasing
    });

    // Parameters to ensure the model is georeferenced correctly on the map
    const modelOrigin: [number, number] = [148.9819, -35.39847];
    const modelAltitude = 0;
    const modelRotate = [Math.PI / 2, 0, 0];

    const modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
      modelOrigin,
      modelAltitude
    );

    // Transformation parameters to position, rotate and scale the 3D model onto the map
    const modelTransform = {
      translateX: modelAsMercatorCoordinate.x,
      translateY: modelAsMercatorCoordinate.y,
      translateZ: modelAsMercatorCoordinate.z,
      rotateX: modelRotate[0],
      rotateY: modelRotate[1],
      rotateZ: modelRotate[2],
      /* Since the 3D model is in real world meters, a scale transform needs to be
       * applied since the CustomLayerInterface expects units in MercatorCoordinates.
       */
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

        // Create two three.js lights to illuminate the model
        const directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.position.set(0, -70, 100).normalize();
        if (this.scene) {
          this.scene.add(directionalLight);
        }

        const directionalLight2 = new THREE.DirectionalLight(0xffffff);
        directionalLight2.position.set(0, 70, 100).normalize();
        if (this.scene) {
          this.scene.add(directionalLight2);
        }

        // Use the three.js GLTF loader to add the 3D model to the three.js scene
        const loader = new GLTFLoader();
        loader.load(
          'https://docs.mapbox.com/mapbox-gl-js/assets/34M_17/34M_17.gltf',
          (gltf: any) => {
            if (this.scene) {
              this.scene.add(gltf.scene);
            }
            setIsLoading(false);
          },
          (progress: any) => {
            console.log('Loading progress:', progress);
          },
          (error: any) => {
            console.error('Error loading 3D model:', error);
            setError('Failed to load 3D model');
            setIsLoading(false);
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
            modelTransform.translateZ
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
      },
    };

    map.current.on('style.load', () => {
      if (map.current) {
        map.current.addLayer(customLayer);
      }
    });

    map.current.on('error', (e: any) => {
      console.error('Mapbox error:', e);
      setError('Failed to load map');
      setIsLoading(false);
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  return (
    <div>
      <div ref={mapContainer} className="map-container" />
      <div className="info-panel">
        <h3>3D Model on Mapbox</h3>
        {isLoading && <p>Loading 3D model...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {!error && !isLoading && (
          <>
            <p>3D model loaded successfully!</p>
            <p>This example shows how to add a 3D model to a Mapbox map using React and Three.js.</p>
          </>
        )}
        <p><strong>Note:</strong> You need to add your Mapbox access token to see the map.</p>
        <p>The 3D model is loaded using the GLTF format and positioned using Mercator coordinates.</p>
      </div>
    </div>
  );
};

export default MapboxThreeComponent;