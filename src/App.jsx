import React from "react";
import MapComponent from "./MapComponent";
import "./styles.css"; // Import CSS

const App = () => {
  return (
    <div className="app-container">
      <h1>Find The Route to Your Destination</h1>
      <MapComponent />
    </div>
  );
};

export default App;
