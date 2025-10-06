# 3D Model on Mapbox with React and Three.js

This project demonstrates how to add a 3D model to a Mapbox map using React and Three.js, based on the [Mapbox GL JS 3D Model example](https://docs.mapbox.com/mapbox-gl-js/example/add-3d-model/).

## ✨ Features

- 🗺️ **React-based Mapbox Integration**: Modern React implementation with hooks
- 🎯 **Three.js 3D Rendering**: High-performance WebGL rendering
- 🔧 **TypeScript Support**: Full type safety and IntelliSense
- 📦 **GLTF Model Loading**: Support for industry-standard 3D model format
- 🌍 **Proper Georeferencing**: Accurate positioning using Mercator coordinates
- ⚡ **Multiple Implementation Patterns**: Basic, enhanced, and hook-based approaches
- 🎛️ **Configurable Components**: Easy customization of models, lighting, and positioning
- 📊 **Loading States & Progress**: User-friendly loading experience
- 🚨 **Error Handling**: Comprehensive error handling and user feedback

## 🎯 Live Demo

The project includes several implementation examples:

1. **Basic Implementation** - Direct port from the Mapbox example
2. **Enhanced Implementation** - Improved UX with loading states and error handling  
3. **Hook-based Implementation** - Reusable custom hook for easy integration
4. **Multi-model Demo** - Example with configurable model options

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Mapbox access token (free at [account.mapbox.com](https://account.mapbox.com/))

## 🚀 Quick Start

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd Smoke-Simulation
   npm install
   ```

2. **Configure Mapbox Access Token:**
   
   **Option A: Environment Variable (Recommended)**
   ```bash
   # Create .env file in project root
   echo "REACT_APP_MAPBOX_ACCESS_TOKEN=your_actual_token_here" > .env
   ```
   
   **Option B: Direct replacement**
   - Get your access token from [Mapbox Account](https://account.mapbox.com/)
   - Replace `YOUR_MAPBOX_ACCESS_TOKEN` in the component files

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## 🏗️ Project Structure

```
src/
├── components/
│   ├── MapboxThreeComponent.tsx          # Basic implementation
│   ├── MapboxThreeComponentEnhanced.tsx  # Enhanced with UX improvements
│   ├── MapboxThreeWithHook.tsx          # Hook-based implementation
│   └── MultiModelDemo.tsx               # Multi-configuration demo
├── hooks/
│   └── useMapboxThree.ts                # Reusable custom hook
├── types/
│   └── mapbox-gl.d.ts                   # TypeScript type extensions
├── App.tsx                              # Main application
├── App.css                              # Application styles
├── index.tsx                            # React entry point
└── index.css                            # Global styles with enhanced UI
```

## 💻 Implementation Examples

### Basic Implementation
```tsx
import MapboxThreeComponent from './components/MapboxThreeComponent';

function App() {
  return <MapboxThreeComponent />;
}
```

### Enhanced Implementation with Loading States
```tsx
import MapboxThreeComponentEnhanced from './components/MapboxThreeComponentEnhanced';

function App() {
  return <MapboxThreeComponentEnhanced />;
}
```

### Hook-based Implementation
```tsx
import { useMapboxThree } from './hooks/useMapboxThree';

function CustomMapComponent() {
  const { mapContainer, loadingState } = useMapboxThree({
    modelUrl: 'your-model.gltf',
    modelOrigin: [longitude, latitude],
    initialZoom: 18
  });

  return (
    <div>
      <div ref={mapContainer} className="map-container" />
      {loadingState.isLoading && <div>Loading...</div>}
    </div>
  );
}
```

## 🔧 How It Works

### Architecture Overview

1. **Map Initialization**: Creates a Mapbox GL JS map with 3D perspective
2. **Custom Layer**: Implements Mapbox's CustomLayerInterface for Three.js integration
3. **WebGL Context Sharing**: Uses Mapbox's canvas and WebGL context for Three.js
4. **3D Model Loading**: Loads GLTF models using Three.js GLTFLoader
5. **Coordinate Transformation**: Converts geographic coordinates to Mercator coordinates
6. **Real-time Rendering**: Synchronizes Three.js rendering with Mapbox's render loop

### Key Components

#### MapboxThreeComponent (Basic)
- Direct implementation following the Mapbox example
- Simple error handling
- Static configuration

#### MapboxThreeComponentEnhanced 
- Progress tracking during model loading
- Enhanced error handling with user guidance
- Improved UI with loading states and progress bars
- Better TypeScript integration

#### useMapboxThree Hook
- Reusable logic for multiple components
- Configurable options interface
- State management built-in
- Cleanup handling

### Coordinate System & Positioning

The positioning system works in several layers:

1. **Geographic Coordinates** (WGS84)
   ```typescript
   const modelOrigin: [number, number] = [148.9819, -35.39847]; // [lng, lat]
   ```

2. **Mercator Projection**
   ```typescript
   const modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
     modelOrigin, 
     modelAltitude
   );
   ```

3. **3D Transformation Matrix**
   ```typescript
   const modelTransform = {
     translateX: modelAsMercatorCoordinate.x,
     translateY: modelAsMercatorCoordinate.y,
     translateZ: modelAsMercatorCoordinate.z,
     rotateX: Math.PI / 2, // Rotation in radians
     scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()
   };
   ```

## 🎨 Customization Guide

### Changing the 3D Model

**Using the Enhanced Component:**
```typescript
const myConfig = {
  modelUrl: 'https://example.com/your-model.gltf',
  modelOrigin: [longitude, latitude],
  modelAltitude: 0,
  modelRotation: [0, 0, 0]
};
```

**Using the Hook:**
```typescript
const { mapContainer, loadingState } = useMapboxThree({
  modelUrl: 'https://example.com/your-model.gltf',
  modelOrigin: [-74.006, 40.7128], // New York
  initialZoom: 16,
  initialPitch: 60
});
```

### Map Styling Options

```typescript
// Available map styles
const mapStyles = {
  standard: 'mapbox://styles/mapbox/standard',
  streets: 'mapbox://styles/mapbox/streets-v12',
  outdoors: 'mapbox://styles/mapbox/outdoors-v12',
  light: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11',
  satellite: 'mapbox://styles/mapbox/satellite-v9'
};
```

### Lighting Configuration

```typescript
const customLighting = {
  lightColor: 0xffffff,
  lightPositions: [
    [0, -70, 100],    // Light from below
    [0, 70, 100],     // Light from above
    [70, 0, 100],     // Light from right
    [-70, 0, 100]     // Light from left
  ]
};
```

### Model Positioning Guide

1. **Find your coordinates**: Use [latlong.net](https://www.latlong.net/) or Google Maps
2. **Set the origin**: Place your model at specific coordinates
3. **Adjust altitude**: Raise/lower the model (in meters)
4. **Fine-tune rotation**: Rotate around X, Y, Z axes (in radians)

```typescript
const positioning = {
  modelOrigin: [longitude, latitude],
  modelAltitude: 0,           // meters above ground
  modelRotation: [
    Math.PI / 2,              // X-axis rotation (pitch)
    0,                        // Y-axis rotation (yaw)  
    0                         // Z-axis rotation (roll)
  ]
};
```

## 🛠️ Advanced Usage

### Creating Custom Hooks

```typescript
import { useMapboxThree } from './hooks/useMapboxThree';

function useAnimatedModel() {
  const [rotation, setRotation] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => prev + 0.01);
    }, 16);
    return () => clearInterval(interval);
  }, []);

  return useMapboxThree({
    modelRotation: [Math.PI / 2, rotation, 0]
  });
}
```

### Multiple Models

```typescript
const models = [
  { url: 'model1.gltf', position: [lng1, lat1] },
  { url: 'model2.gltf', position: [lng2, lat2] }
];

// Render multiple MapboxThree components or extend the hook
```

## 🧪 Available Scripts

```bash
npm start          # Start development server
npm run build      # Create production build
npm test           # Run tests
npm run eject      # Eject from Create React App (irreversible)
```

## 📦 Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | ^18.2.0 | UI Framework |
| **TypeScript** | ^4.9.5 | Type Safety |
| **Mapbox GL JS** | ^3.0.1 | Map Rendering |
| **Three.js** | ^0.158.0 | 3D Graphics |
| **React Scripts** | 5.0.1 | Build Tools |

## 🚨 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **Map not loading** | Check Mapbox access token in `.env` file |
| **3D model not appearing** | Verify GLTF model URL and CORS settings |
| **Console errors** | Check browser WebGL support and network connectivity |
| **Performance issues** | Reduce model complexity or implement LOD |
| **TypeScript errors** | Ensure all types are properly imported |

### Debug Mode

Add debug information to your component:

```typescript
// Enable debug mode
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Model transform:', modelTransform);
  console.log('Loading state:', loadingState);
}
```

### WebGL Troubleshooting

```typescript
// Check WebGL support
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
if (!gl) {
  console.error('WebGL not supported');
}
```

## 📄 License

This project is based on Mapbox's example code and is provided under the MIT License for educational purposes.

## 🔗 Resources & References

- 📚 [Mapbox GL JS Documentation](https://docs.mapbox.com/mapbox-gl-js/)
- 🎯 [Three.js Documentation](https://threejs.org/docs/)
- 📦 [GLTF Format Specification](https://www.khronos.org/gltf/)
- 🗺️ [Mapbox Style Specification](https://docs.mapbox.com/style-spec/)
- 🎨 [Three.js Examples](https://threejs.org/examples/)
- 🔧 [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) (Alternative approach)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🆘 Support

If you encounter issues:

1. Check the [troubleshooting section](#-troubleshooting)
2. Search existing GitHub issues
3. Create a new issue with detailed information
4. Include browser console errors and environment details