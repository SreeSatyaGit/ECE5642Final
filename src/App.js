import React, { useEffect, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import 'chart.js/auto'; // Automatically registers all components of Chart.js

// Dummy data to use as fallback if the API call fails (or no back end is provided)
const fallbackData = {
  pl_orbper: [1.5, 2.3, 3.1, 4.8, 6.0, 7.2, 8.0, 9.5, 10.1, 11.0],
  pl_tranmid: [
    2457001.5, 2457003.7, 2457005.9, 2457008.1, 2457010.3, 2457012.5, 2457014.7,
    2457016.9, 2457019.1, 2457021.3,
  ],
  pl_trandur: [2.3, 2.8, 3.0, 1.9, 2.5, 3.2, 2.0, 2.7, 2.4, 3.1],
  pl_trandep: [150, 200, 175, 180, 210, 190, 160, 205, 195, 185],
};

function App() {
  const [transitData, setTransitData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from your Python API endpoint.
  // In StackBlitz, if no back end is available, this request will fail and we will fall back to dummy data.

  useEffect(() => {
    fetch('https://SatyaEECE5642.pythonanywhere.com/api/toi_visualization_data')
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

  // Prepare chart data:
  // Chart 1: Orbital Period vs. Transit Duration (Scatter Plot)
  const periodVsDurationData = {
    labels: transitData.pl_orbper.map((val, i) => `Planet ${i + 1}`),
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

  // Chart 2: Histogram of Orbital Periods using a Bar chart.
  // For a histogram we assume that the data is binned; here we simply use the provided orbital periods.
  const periodHistogramData = {
    labels: transitData.pl_orbper.map((val, i) => `Planet ${i + 1}`),
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

  // Chart 3: Transit Depth vs. Transit Duration (Scatter Plot)
  const depthVsDurationData = {
    labels: transitData.pl_trandur.map((val, i) => `Planet ${i + 1}`),
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
    </div>
  );
}

export default App;
