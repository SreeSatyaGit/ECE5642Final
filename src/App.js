import React, { useEffect, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import Plot from 'react-plotly.js';
import 'chart.js/auto'; // Automatically registers all components of Chart.js

// Dummy fallback data if the API call fails.
const fallbackData = {
  pl_orbper: [1.5, 2.3, 3.1, 4.8, 6.0, 7.2, 8.0, 9.5, 10.1, 11.0],
  pl_tranmid: [
    2457001.5, 2457003.7, 2457005.9, 2457008.1, 2457010.3,
    2457012.5, 2457014.7, 2457016.9, 2457019.1, 2457021.3,
  ],
  pl_trandur: [2.3, 2.8, 3.0, 1.9, 2.5, 3.2, 2.0, 2.7, 2.4, 3.1],
  pl_trandep: [150, 200, 175, 180, 210, 190, 160, 205, 195, 185],
};

// Helper function: Convert current epoch to Julian Date.
// Formula: JD = (currentMillis/86400000) + 2440587.5
function getCurrentJulianDate() {
  return new Date().getTime() / 86400000 + 2440587.5;
}

// Given a reference mid-transit (JD) and period, compute the next transit time (in JD).
function getNextTransit(midTransit, period) {
  const currentJD = getCurrentJulianDate();
  if (currentJD < midTransit) {
    return midTransit;
  } else {
    const n = Math.ceil((currentJD - midTransit) / period);
    return midTransit + n * period;
  }
}

// Convert a Julian Date to a readable local date string.
function jdToLocalDate(jd) {
  const epoch = (jd - 2440587.5) * 86400000;
  return new Date(epoch).toLocaleString();
}

function App() {
  const [transitData, setTransitData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from the Python API endpoint.
  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/toi_visualization_data')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setTransitData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading API data; using fallback data', err);
        setTransitData(fallbackData);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading transit data...</div>;
  if (error) return <div>Error loading data: {error.message}</div>;

  // Prepare 2D charts as before.
  const periodVsDurationData = {
    labels: transitData.pl_orbper.map((_, i) => `Planet ${i + 1}`),
    datasets: [
      {
        label: 'Transit Duration (hours)',
        data: transitData.pl_trandur,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        pointRadius: 4,
      },
    ],
  };

  const periodHistogramData = {
    labels: transitData.pl_orbper.map((_, i) => `Planet ${i + 1}`),
    datasets: [
      {
        label: 'Orbital Period (days)',
        data: transitData.pl_orbper,
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  };

  const depthVsDurationData = {
    labels: transitData.pl_trandur.map((_, i) => `Planet ${i + 1}`),
    datasets: [
      {
        label: 'Transit Depth (ppm)',
        data: transitData.pl_trandep,
        backgroundColor: 'rgba(255, 159, 64, 0.6)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1,
        pointRadius: 4,
      },
    ],
  };

  // Calculate transit ephemeris for each planet.
  const currentJD = getCurrentJulianDate();
  const ephemeris = transitData.pl_tranmid.map((midTransit, i) => {
    const period = transitData.pl_orbper[i];
    const nextTransitJD = getNextTransit(midTransit, period);
    const nextTransitLocal = jdToLocalDate(nextTransitJD);
    const timeRemaining = nextTransitJD - currentJD;
    return {
      planet: `Planet ${i + 1}`,
      period,
      transitDuration: transitData.pl_trandur[i],
      initialCountdown: parseFloat(timeRemaining.toFixed(2)),
      nextTransitJD: parseFloat(nextTransitJD.toFixed(2)),
      nextTransitLocal,
    };
  });

  // For the interactive 3D plot, we use:
  // X axis: Orbital Period
  // Y axis: Transit Duration
  // Z axis: Countdown (time until next transit)
  // We simulate time passing by creating animation frames where
  // countdown = initialCountdown - deltaTime (never below zero)
  const numFrames = 20;
  const frameStep = 0.5; // days per frame
  const frames = [];
  for (let frame = 0; frame < numFrames; frame++) {
    const delta = frame * frameStep;
    const updatedZ = ephemeris.map((planet) =>
      Math.max(planet.initialCountdown - delta, 0)
    );
    frames.push({
      name: `${delta}`,
      data: [
        {
          x: ephemeris.map((p) => p.period),
          y: ephemeris.map((p) => p.transitDuration),
          z: updatedZ,
          mode: 'markers',
          marker: { size: 8, color: updatedZ, colorscale: 'Viridis', opacity: 0.8 },
          type: 'scatter3d',
          hovertemplate:
            '<b>%{text}</b><br>Period: %{x} days<br>Duration: %{y} hours<br>Countdown: %{z} days<extra></extra>',
          text: ephemeris.map((p) => p.planet),
        },
      ],
    });
  }

  const initialFrame = frames[0];

  return (
    <div style={{ margin: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>TOI Transit and Orbital Visualizations</h1>
      <div>
        <h2>Orbital Period vs. Transit Duration</h2>
        <Line
          data={periodVsDurationData}
          options={{
            responsive: true,
            plugins: { legend: { position: 'top' } },
            scales: {
              x: { title: { display: true, text: 'Orbital Period (days)' } },
              y: { title: { display: true, text: 'Transit Duration (hours)' } },
            },
          }}
        />
      </div>
      <div style={{ marginTop: '40px' }}>
        <h2>Distribution of Orbital Periods</h2>
        <Bar
          data={periodHistogramData}
          options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              x: { title: { display: true, text: 'Planet' } },
              y: { title: { display: true, text: 'Orbital Period (days)' } },
            },
          }}
        />
      </div>
      <div style={{ marginTop: '40px' }}>
        <h2>Transit Depth vs. Transit Duration</h2>
        <Line
          data={depthVsDurationData}
          options={{
            responsive: true,
            plugins: { legend: { position: 'top' } },
            scales: {
              x: { title: { display: true, text: 'Transit Duration (hours)' } },
              y: { title: { display: true, text: 'Transit Depth (ppm)' } },
            },
          }}
        />
      </div>
      
      <div style={{ marginTop: '40px' }}>
        <h2>Interactive 3D Transit Countdown</h2>
        <Plot
          data={initialFrame.data}
          layout={{
            title: '3D Scatter of Transit Countdown',
            scene: {
              xaxis: { title: 'Orbital Period (days)' },
              yaxis: { title: 'Transit Duration (hours)' },
              zaxis: { title: 'Days Until Next Transit' },
            },
            updatemenus: [
              {
                type: 'buttons',
                showactive: false,
                buttons: [
                  {
                    label: 'Play',
                    method: 'animate',
                    args: [null, { frame: { duration: 500, redraw: true }, fromcurrent: true }],
                  },
                  {
                    label: 'Pause',
                    method: 'animate',
                    args: [[null], { mode: 'immediate', frame: { duration: 0 }, transition: { duration: 0 } }],
                  },
                ],
              },
            ],
          }}
          frames={frames}
          config={{ responsive: true }}
          style={{ width: '100%', height: '600px' }}
        />
      </div>
    </div>
  );
}

export default App;
