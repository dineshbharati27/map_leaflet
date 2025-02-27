import React, { useState, useEffect } from "react";
import axios from "axios";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet/dist/leaflet.css";

const MapComponent = () => {
  const [locations, setLocations] = useState({ from: "", to: "" });
  const [coordinates, setCoordinates] = useState({ from: null, to: null });
  const [mapInstance, setMapInstance] = useState(null);
  const [routingControl, setRoutingControl] = useState(null);
  const [distance, setDistance] = useState(null);
  const [prevDistance, setPrevDistance] = useState(null); // Store last computed distance

  useEffect(() => {
    const map = L.map("map", { center: [20.5937, 78.9629], zoom: 5 });
    setMapInstance(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    return () => {
      map.remove();
    };
  }, []);

  const getCoordinates = async (location, type) => {
    if (!location) return;
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${location}`
      );
      if (response.data.length > 0) {
        const { lat, lon } = response.data[0];
        setCoordinates((prev) => ({
          ...prev,
          [type]: { lat: parseFloat(lat), lng: parseFloat(lon) },
        }));
      } else {
        alert(`Location "${location}" not found`);
      }
    } catch (error) {
      console.error("Error fetching coordinates:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLocations((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    setDistance(null); // Reset distance only on search
    setPrevDistance(null); // Reset saved distance
    getCoordinates(locations.from, "from");
    getCoordinates(locations.to, "to");
  };

  const handleSwitch = () => {
    setLocations({ from: locations.to, to: locations.from });
    setCoordinates({ from: coordinates.to, to: coordinates.from });

    // Preserve distance when switching
    if (distance !== null) {
      setPrevDistance(distance);
    }
  };

  useEffect(() => {
    if (coordinates.from && coordinates.to && mapInstance) {
      if (routingControl) {
        mapInstance.removeControl(routingControl);
      }

      mapInstance.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
          mapInstance.removeLayer(layer);
        }
      });

      const startIcon = new L.Icon({
        iconUrl:
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      });

      const destinationIcon = new L.Icon({
        iconUrl:
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      });

      L.marker([coordinates.from.lat, coordinates.from.lng], { icon: startIcon })
        .addTo(mapInstance)
        .bindPopup("Starting Point");

      L.marker([coordinates.to.lat, coordinates.to.lng], { icon: destinationIcon })
        .addTo(mapInstance)
        .bindPopup(`<b>Destination</b>: ${locations.to}`)
        .openPopup();

      const routing = L.Routing.control({
        waypoints: [
          L.latLng(coordinates.from.lat, coordinates.from.lng),
          L.latLng(coordinates.to.lat, coordinates.to.lng),
        ],
        routeWhileDragging: false,
        createMarker: () => null,
        addWaypoints: false,
        fitSelectedRoutes: true,
        draggableWaypoints: false,
        show: false,
        lineOptions: {
          styles: [{ color: "#007bff", weight: 5 }],
        },
        router: L.Routing.osrmv1({
          suppressDemoServerWarning: true,
          serviceUrl: "https://router.project-osrm.org/route/v1",
        }),
      }).addTo(mapInstance);

      routing.on("routesfound", function (e) {
        const route = e.routes[0];
        const totalDistance = (route.summary.totalDistance / 1000).toFixed(2);

        // Set new distance only if switching didn't happen
        if (prevDistance !== null) {
          setDistance(prevDistance);
        } else {
          setDistance(totalDistance);
        }
      });

      document.querySelector(".leaflet-routing-container")?.remove();
      setRoutingControl(routing);
    }
  }, [coordinates, mapInstance]);

  return (
    <div className="app-container">
      <h2>Enter Locations</h2>
      <div className="input-container">
        <input type="text" name="from" placeholder="From (Your location)" value={locations.from} onChange={handleInputChange} />
        <button onClick={handleSwitch} className="switch-button">↔</button>
        <input type="text" name="to" placeholder="To (Your destination)" value={locations.to} onChange={handleInputChange} />
        <button onClick={handleSearch}>Search</button>
      </div>

      {distance !== null && (
        <p className="distance-text">Total Distance: {distance} km</p>
      )}

      <div id="map" className="map"></div>
    </div>
  );
};

export default MapComponent;
