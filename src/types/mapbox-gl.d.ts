// This file extends the Mapbox GL types to include the Three.js properties
// that we add to the custom layer

import * as THREE from 'three';
import { Map } from 'mapbox-gl';

declare module 'mapbox-gl' {
  interface CustomLayerInterface {
    camera?: THREE.Camera;
    scene?: THREE.Scene;
    renderer?: THREE.WebGLRenderer;
    map?: Map;
  }
}