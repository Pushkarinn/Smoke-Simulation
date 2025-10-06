import React, { useState } from 'react';
import MapboxThreeComponent from './components/MapboxThreeComponent';
import MapboxThreeComponentEnhanced from './components/MapboxThreeComponentEnhanced';
import MultiModelDemo from './components/MultiModelDemo';
import './App.css';

type ComponentVersion = 'basic' | 'enhanced' | 'demo';

function App() {
  const [currentVersion, setCurrentVersion] = useState<ComponentVersion>('demo');

  const renderComponent = () => {
    switch (currentVersion) {
      case 'basic':
        return <MapboxThreeComponent />;
      case 'enhanced':
        return <MapboxThreeComponentEnhanced />;
      case 'demo':
        return <MultiModelDemo />;
      default:
        return <MultiModelDemo />;
    }
  };

  return (
    <div className="App">
      <div className="version-selector">
        <button 
          className={currentVersion === 'basic' ? 'active' : ''}
          onClick={() => setCurrentVersion('basic')}
        >
          Basic Version
        </button>
        <button 
          className={currentVersion === 'enhanced' ? 'active' : ''}
          onClick={() => setCurrentVersion('enhanced')}
        >
          Enhanced Version
        </button>
        <button 
          className={currentVersion === 'demo' ? 'active' : ''}
          onClick={() => setCurrentVersion('demo')}
        >
          Multi-Model Demo
        </button>
      </div>
      {renderComponent()}
    </div>
  );
}

export default App;