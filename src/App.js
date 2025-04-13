import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import './index.css';

// Full list of all features.
const ALL_FEATURES_LIST = [
  'tid', 'toi', 'toidisplay', 'toipfx', 'ctoi_alias', 'pl_pnum', 'tfopwg_disp',
  'st_tmag', 'st_tmagerr1', 'st_tmagerr2', 'st_tmagsymerr', 'st_tmaglim',
  'rastr', 'ra', 'raerr1', 'raerr2', 'rasymerr', 'decstr', 'dec', 'decerr1',
  'decerr2', 'decsymerr', 'st_pmra', 'st_pmraerr1', 'st_pmraerr2', 'st_pmrasymerr',
  'st_pmralim', 'st_pmdec', 'st_pmdecerr1', 'st_pmdecerr2', 'st_pmdecsymerr',
  'st_pmdeclim', 'pl_tranmid', 'pl_tranmiderr1', 'pl_tranmiderr2', 'pl_tranmidsymerr',
  'pl_tranmidlim', 'pl_orbper', 'pl_orbpererr1', 'pl_orbpererr2', 'pl_orbpersymerr',
  'pl_orbperlim', 'pl_trandurh', 'pl_trandurherr1', 'pl_trandurherr2', 'pl_trandurhsymerr',
  'pl_trandurhlim', 'pl_trandep', 'pl_trandeperr1', 'pl_trandeperr2', 'pl_trandepsymerr',
  'pl_trandeplim', 'pl_rade', 'pl_radeerr1', 'pl_radeerr2', 'pl_radesymerr', 'pl_radelim',
  'pl_insol', 'pl_insolerr1', 'pl_insolerr2', 'pl_insolsymerr', 'pl_insollim', 'pl_eqt',
  'pl_eqterr1', 'pl_eqterr2', 'pl_eqtsymerr', 'pl_eqtlim', 'st_dist', 'st_disterr1',
  'st_disterr2', 'st_distsymerr', 'st_distlim', 'st_teff', 'st_tefferr1', 'st_tefferr2',
  'st_teffsymerr', 'st_tefflim', 'st_logg', 'st_loggerr1', 'st_loggerr2', 'st_loggsymerr',
  'st_logglim', 'st_rad', 'st_raderr1', 'st_raderr2', 'st_radsymerr', 'st_radlim',
  'sectors', 'toi_created', 'rowupdate', 'release_date'
];

// A fallback dataset (for demonstration) with a subset of keys.
const fallbackData = {
  toi: ['TOI-123', 'TOI-456', 'TOI-789', 'TOI-101', 'TOI-102', 'TOI-103', 'TOI-104', 'TOI-105', 'TOI-106', 'TOI-107'],
  pl_orbper: [1.5, 2.3, 3.1, 4.8, 6.0, 7.2, 8.0, 9.5, 10.1, 11.0],
  pl_tranmid: [
    2457001.5, 2457003.7, 2457005.9, 2457008.1, 2457010.3,
    2457012.5, 2457014.7, 2457016.9, 2457019.1, 2457021.3,
  ],
  pl_trandur: [2.3, 2.8, 3.0, 1.9, 2.5, 3.2, 2.0, 2.7, 2.4, 3.1],
  pl_trandep: [150, 200, 175, 180, 210, 190, 160, 205, 195, 185],
  pl_temp: [500, 600, 550, 700, 650, 800, 750, 850, 900, 950],
};

// Preprocess data: keep only keys that are arrays and filter out rows with invalid values.
function preprocessFullData(data) {
  const processed = {};
  ALL_FEATURES_LIST.forEach((key) => {
    if (data[key] !== undefined && Array.isArray(data[key])) {
      processed[key] = data[key];
    }
  });
  // Determine the minimum row length among the arrays.
  const lengths = Object.values(processed).map((arr) => arr.length);
  const totalRows = Math.min(...lengths);
  const validIndices = [];
  for (let i = 0; i < totalRows; i++) {
    let valid = true;
    for (let key in processed) {
      const val = processed[key][i];
      if (
        val === null ||
        val === undefined ||
        (typeof val === 'number' && val === 0) ||
        (typeof val === 'string' && val.trim() === '')
      ) {
        valid = false;
        break;
      }
    }
    if (valid) validIndices.push(i);
  }
  const cleanedData = {};
  Object.keys(processed).forEach((key) => {
    cleanedData[key] = validIndices.map((i) => processed[key][i]);
  });
  return cleanedData;
}

// Helper: Convert current time (ms) to Julian Date.
function getCurrentJulianDate() {
  return new Date().getTime() / 86400000 + 2440587.5;
}

// Compute next transit (JD) given mid-transit (JD) and orbital period.
function getNextTransit(midTransit, period) {
  const currentJD = getCurrentJulianDate();
  if (currentJD < midTransit) return midTransit;
  const n = Math.ceil((currentJD - midTransit) / period);
  return midTransit + n * period;
}

// Convert a Julian Date to a local date string.
function jdToLocalDate(jd) {
  const epoch = (jd - 2440587.5) * 86400000;
  return new Date(epoch).toLocaleString();
}

// Map a temperature in Kelvin to a color (blue for 500K to red for 1000K)
function mapTempToColor(temp) {
  const minTemp = 500;
  const maxTemp = 1000;
  let ratio = (temp - minTemp) / (maxTemp - minTemp);
  ratio = Math.min(Math.max(ratio, 0), 1);
  const red = Math.round(ratio * 255);
  const blue = Math.round((1 - ratio) * 255);
  return `rgb(${red},0,${blue})`;
}

// Simple helper to prettify feature keys.
function prettifyKey(key) {
  return key
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Define a subset for visualization dropdowns.
const availableFeatures = {
  pl_orbper: 'Orbital Period (days)',
  pl_trandur: 'Transit Duration (hours)',
  pl_trandep: 'Transit Depth (ppm)',
  pl_temp: 'Temperature (K)',
  pl_tranmid: 'Transit Mid (JD)',
};

// Component to render a searchable table of features.
function DataTable({ data, featureList, searchTerm }) {
  if (!data) return null;

  // Filter feature list based on search term.
  const filteredFeatures = featureList.filter(feature =>
    feature.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Determine number of rows from one key (assumes all arrays are same length)
  const numRows = data[filteredFeatures[0]] ? data[filteredFeatures[0]].length : 0;

  return (
    <div className="overflow-auto mt-4 border p-2">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr>
            {filteredFeatures.map((feature) => (
              <th
                key={feature}
                className="border px-2 py-1 bg-gray-200 text-gray-800"
              >
                {prettifyKey(feature)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: numRows }, (_, rowIndex) => (
            <tr key={rowIndex}>
              {filteredFeatures.map((feature) => (
                <td
                  key={feature + rowIndex}
                  className="border px-2 py-1 text-gray-800"
                >
                  {data[feature] ? data[feature][rowIndex] : 'N/A'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function App() {
  const [transitData, setTransitData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States for user-selected features in the chart.
  const [xFeature, setXFeature] = useState('pl_orbper');
  const [yFeature, setYFeature] = useState('pl_trandur');
  const [sizeFeature, setSizeFeature] = useState('pl_trandep');
  const [colorFeature, setColorFeature] = useState('pl_temp');

  // States for the features table panel.
  const [showFeatures, setShowFeatures] = useState(false);
  const [featureSearch, setFeatureSearch] = useState('');

  // Fetch data from API; if error, use fallback data.
  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/toi_visualization_data')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const cleanData = preprocessFullData(data);
        setTransitData(cleanData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading API data; using fallback data', err);
        const cleanData = preprocessFullData(fallbackData);
        setTransitData(cleanData);
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <div className="text-center text-lg mt-10">
        Loading transit data...
      </div>
    );
  if (error)
    return (
      <div className="text-center text-lg text-red-500 mt-10">
        Error loading data: {error.message}
      </div>
    );

  // Verify that key data for visualization exists.
  if (!transitData || !transitData.pl_tranmid || transitData.pl_tranmid.length === 0) {
    return (
      <div className="text-center text-red-500 mt-10">
        No valid data available.
      </div>
    );
  }

  // Compute additional ephemeris info.
  const currentJD = getCurrentJulianDate();
  const ephemeris = transitData.pl_tranmid.map((midTransit, i) => {
    if (
      !transitData.toi || transitData.toi[i] === undefined ||
      !transitData.pl_orbper || transitData.pl_orbper[i] === undefined ||
      !transitData.pl_trandur || transitData.pl_trandur[i] === undefined ||
      !transitData.pl_trandep || transitData.pl_trandep[i] === undefined ||
      !transitData.pl_temp || transitData.pl_temp[i] === undefined
    ) {
      return null;
    }
    const period = transitData.pl_orbper[i];
    const nextTransitJD = getNextTransit(midTransit, period);
    return {
      planet: transitData.toi[i],
      pl_orbper: period,
      pl_trandur: transitData.pl_trandur[i],
      pl_trandep: transitData.pl_trandep[i],
      pl_temp: transitData.pl_temp[i],
      nextTransitJD,
      nextTransitLocal: jdToLocalDate(nextTransitJD),
    };
  }).filter(row => row !== null);

  // Series data for the bubble chart.
  const seriesData = ephemeris.map((p) => ({
    x: p[xFeature],
    y: p[yFeature],
    z: p[sizeFeature],
    meta: {
      label: p.planet,
      nextTransit: p.nextTransitLocal,
      featureColorValue: p[colorFeature],
    },
  }));

  const markerColors = ephemeris.map((p) =>
    mapTempToColor(p[colorFeature])
  );

  const series = [{ name: 'Exoplanets', data: seriesData }];

  const optionsChart = {
    chart: {
      type: 'bubble',
      height: 400,
      background: '#ffffff',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 1500,
        animateGradually: { enabled: true, delay: 250 },
        dynamicAnimation: { enabled: true, speed: 350 },
      },
      zoom: { enabled: true, type: 'xy' },
      toolbar: { show: true },
    },
    dataLabels: { enabled: false },
    title: {
      text: 'Interactive 3D Bubble Chart of Exoplanet Transits',
      align: 'center',
      style: { fontSize: '20px', fontWeight: 'bold', color: '#333' },
    },
    tooltip: {
      enabled: true,
      custom: function({ series, seriesIndex, dataPointIndex, w }) {
        const sData = w.config.series &&
          w.config.series[seriesIndex] &&
          w.config.series[seriesIndex].data;
        if (!sData || sData.length <= dataPointIndex) return '';
        const point = sData[dataPointIndex];
        const meta = point.meta || {};
        return `<div class="p-2 text-sm text-gray-800 bg-gray-100 rounded">
                  <strong>${meta.label || 'N/A'}</strong><br/>
                  ${prettifyKey(xFeature)}: ${point.x}<br/>
                  ${prettifyKey(yFeature)}: ${point.y}<br/>
                  ${prettifyKey(sizeFeature)}: ${point.z}<br/>
                  Next Transit: ${meta.nextTransit || 'N/A'}<br/>
                  ${prettifyKey(colorFeature)}: ${meta.featureColorValue || 'N/A'}
                </div>`;
      },
    },
    xaxis: {
      title: { text: availableFeatures[xFeature] || prettifyKey(xFeature), style: { fontSize: '14px', color: '#333' } },
      tickAmount: 10,
      labels: { style: { fontSize: '12px', color: '#333' } },
    },
    yaxis: {
      title: { text: availableFeatures[yFeature] || prettifyKey(yFeature), style: { fontSize: '14px', color: '#333' } },
      labels: { style: { fontSize: '12px', color: '#333' } },
    },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 0.8, opacityFrom: 0.8, opacityTo: 0.2, stops: [0, 100] },
    },
    markers: { colors: markerColors },
    theme: { palette: 'palette2' },
  };

  return (
    <div className="container mx-auto p-4" style={{ backgroundColor: '#f7f7f7', color: '#333' }}>
      <h1 className="text-3xl font-bold text-center mb-6">TOI Transit and Orbital Visualizations</h1>
      {/* Chart Feature Selections */}
      <div className="flex flex-wrap justify-center gap-4 mb-6">
        {['xFeature', 'yFeature', 'sizeFeature', 'colorFeature'].map((field) => {
          const setter =
            field === 'xFeature'
              ? setXFeature
              : field === 'yFeature'
              ? setYFeature
              : field === 'sizeFeature'
              ? setSizeFeature
              : setColorFeature;
          const value =
            field === 'xFeature'
              ? xFeature
              : field === 'yFeature'
              ? yFeature
              : field === 'sizeFeature'
              ? sizeFeature
              : colorFeature;
          const label =
            field === 'xFeature'
              ? 'X-axis'
              : field === 'yFeature'
              ? 'Y-axis'
              : field === 'sizeFeature'
              ? 'Bubble Size'
              : 'Bubble Color';
          return (
            <div key={field} className="flex flex-col">
              <label className="font-semibold text-gray-800">{label}:</label>
              <select
                className="border rounded p-2 bg-white text-gray-800"
                value={value}
                onChange={(e) => setter(e.target.value)}
              >
                {Object.keys(availableFeatures).map((key) => (
                  <option key={key} value={key}>
                    {prettifyKey(key)}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
      <div className="shadow-lg rounded-lg p-4 bg-white">
        <ReactApexChart options={optionsChart} series={series} type="bubble" height={400} />
      </div>

      {/* Toggle and Search for All Features */}
      <div className="mt-6">
        <button
          onClick={() => setShowFeatures(!showFeatures)}
          className="px-4 py-2 border rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
        >
          {showFeatures ? 'Hide' : 'Show'} All Features
        </button>
        {showFeatures && (
          <div className="mt-4">
            <input
              type="text"
              placeholder="Search features..."
              value={featureSearch}
              onChange={(e) => setFeatureSearch(e.target.value)}
              className="border rounded px-2 py-1 mb-2 text-gray-800"
            />
            <DataTable data={transitData} featureList={ALL_FEATURES_LIST} searchTerm={featureSearch} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
