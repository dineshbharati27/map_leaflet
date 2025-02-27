import React from "react";
import MapComponent from "./MapComponent";
import "./styles.css"; // Import CSS

const App = () => {
  return (
    <div className="app-container">
      <h1>React Leaflet Route Map</h1>
      <MapComponent />
    </div>
  );
};

export default App;
