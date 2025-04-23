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
  'sectors', 'toi_created', 'rowupdate', 'release_date',

  
  'pl_bmassj'
];

// A fallback dataset for demonstration
const fallbackData = {
  // TOI or Planet Names
  toi: ['TOI-123', 'TOI-456', 'TOI-789', 'TOI-101', 'TOI-102', 'TOI-103', 'TOI-104', 'TOI-105', 'TOI-106', 'TOI-107'],
  // Orbital Period (days)
  pl_orbper: [1.5, 2.3, 3.1, 4.8, 6.0, 7.2, 8.0, 9.5, 10.1, 11.0],
  // Mid-transit times (JD)
  pl_tranmid: [
    2457001.5, 2457003.7, 2457005.9, 2457008.1, 2457010.3,
    2457012.5, 2457014.7, 2457016.9, 2457019.1, 2457021.3,
  ],
  // Transit Duration (hours)
  pl_trandur: [2.3, 2.8, 3.0, 1.9, 2.5, 3.2, 2.0, 2.7, 2.4, 3.1],
  // Planet Radius (Earth or Jupiter radii for example)
  pl_rade: [1.1, 1.8, 2.5, 11.2, 5.1, 9.3, 2.7, 10.0, 3.2, 15.0],
  // Planet Mass (Jupiter masses)
  pl_bmassj: [0.01, 0.05, 0.1, 1.0, 0.8, 2.5, 0.5, 5.0, 1.5, 10.0],
  // Equilibrium Temperature (K)
  pl_eqt: [500, 600, 550, 700, 650, 800, 750, 850, 900, 950],
};

// Preprocess data: keep only keys that are arrays and remove rows with invalid values.
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

      // Check for null or undefined.
      if (val === null || val === undefined) {
        valid = false;
        break;
      }

      // Check for numeric values: remove if 0 or NaN.
      if (typeof val === 'number') {
        if (isNaN(val) || val === 0) {
          valid = false;
          break;
        }
      }

      // Check for string values: remove if empty or equal to "0" (after trimming).
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed === '' || trimmed === '0') {
          valid = false;
          break;
        }
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

// Map a temperature in Kelvin to a color (roughly from deep blue at 300K to red at 2000K).
function mapTempToColor(temp, minTemp, maxTemp) {
  let ratio = (temp - minTemp) / (maxTemp - minTemp);
  ratio = Math.min(Math.max(ratio, 0), 1);
  const red = Math.round(ratio * 255);
  const blue = Math.round((1 - ratio) * 255);
  return `rgb(${red}, 0, ${blue})`;
}


// Simple helper to prettify feature keys for table display.
function prettifyKey(key) {
  return key
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// A small subset of features to show in dropdowns for plotting.
const availableFeatures = {
  toidisplay: 'TOI Display Name',
  pl_tranmid: 'Mid-Transit Time (JD)',
  pl_trandurh: 'Transit Duration (hours)',
  pl_rade: 'Planet Radius (Earth radii)',
  st_dist: 'Distance to Star (parsecs)',
  pl_eqt: 'Equilibrium temperature (K)',
  toi_created: 'TOI Creation Date'
};


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
  const [xFeature, setXFeature] = useState('pl_eqt');
  const [yFeature, setYFeature] = useState('st_dist');
  const [sizeFeature, setSizeFeature] = useState('pl_rade');
  const [colorFeature, setColorFeature] = useState('pl_eqt');  // Color by temperature
  const numericAvailableFeatures = {
    pl_tranmid: 'Mid-Transit Time (JD)',
    pl_trandurh: 'Transit Duration (hours)',
    pl_rade: 'Planet Radius (Earth radii)',
    st_dist: 'Distance to Star (parsecs)',
    pl_eqt: 'Equilibrium temperature(K)'
  };

  let minTemp = 0;
  let maxTemp = 0;
  console.log("Temperature Range → minTemp:", minTemp, "maxTemp:", maxTemp);

  if (
    transitData &&
    colorFeature &&
    Array.isArray(transitData[colorFeature]) &&
    transitData[colorFeature].length > 0
  ) {
    const temperatureValues = transitData[colorFeature].filter(
      (v) => typeof v === 'number' && !isNaN(v)
    );
    minTemp = Math.min(...temperatureValues);
    maxTemp = Math.max(...temperatureValues);
  }




  // Log/Linear controls
  const [xScale, setXScale] = useState('linear');
  const [yScale, setYScale] = useState('linear');
  const [showColorWarning, setShowColorWarning] = useState(false);


  const featureUnits = {
    pl_rade: 'Earth radii',
    pl_bmassj: 'Jupiter mass',
    pl_eqt: 'K',
    st_teff: 'K',
    st_dist: 'parsecs',
    pl_trandurh: 'hours',
    pl_tranmid: 'JD',
    // fallback for unknown or unit-less
    default: ''
  };

  function getUnit(feature) {
    return featureUnits[feature] || featureUnits.default;
  }

  function isNumericArray(arr) {
    return (
      Array.isArray(arr) &&
      arr.length > 0 &&
      arr.every((val) => typeof val === 'number' && !isNaN(val))
    );
  }
  

  // Fetch data from API; if error, use fallback data.
  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/toi_visualization_data')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const cleanData = preprocessFullData(data);
        console.log("cleanData:", cleanData);
        setTransitData(cleanData);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Error loading API data; using fallback data:', err);
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

  console.log('Transit Data:', transitData);
  const featuresReady =
    transitData &&
    transitData[xFeature] &&
    transitData[yFeature] &&
    transitData[sizeFeature] &&
    transitData[colorFeature];

  const series = featuresReady
    ? [
      {
        name: 'TOI Planets',
        data: transitData[xFeature].map((_, i) => {
          const temp = transitData[colorFeature][i];
          return {
            x: transitData[xFeature][i],
            y: transitData[yFeature][i],
            z: transitData[sizeFeature][i],
            planet: transitData.toidisplay?.[i] || `Planet ${i + 1}`,
            eqTemperature: temp,
            fillColor: mapTempToColor(temp, minTemp, maxTemp)
          };
        })
      }
    ]
    : [];


  // Axis labels from your "availableFeatures" map if available:
  const xAxisLabel = availableFeatures[xFeature] || xFeature;
  const yAxisLabel = availableFeatures[yFeature] || yFeature;

  // Define chart options
  const optionsChart = {
    chart: {
      type: 'bubble',
      toolbar: {
        show: true,
      },
      zoom: {
        enabled: true,
        type: 'xy',
      },
    },
    plotOptions: {
      bubble: {
        // Control bubble sizes
        minBubbleRadius: 3,
        maxBubbleRadius: 30,
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      // Switch between 'numeric' and 'logarithmic' to emulate linear/log scales
      type: xScale === 'log' ? 'logarithmic' : 'numeric',
      name: xAxisLabel,
      title: {
        text: xAxisLabel,
        style: {
          fontSize: '14px',
          fontWeight: 'bold',
        },
      },
    },
    yaxis: {
      type: yScale === 'log' ? 'logarithmic' : 'numeric',
      name: yAxisLabel,
      title: {
        text: yAxisLabel,
        style: {
          fontSize: '14px',
          fontWeight: 'bold',
        },
      },
    },
    tooltip: {
      custom: function ({ series, seriesIndex, dataPointIndex, w }) {
        const data = w.globals.initialSeries[seriesIndex].data[dataPointIndex];

        const formatNumber = (val) =>
          typeof val === 'number' && !isNaN(val) ? val.toFixed(3) : 'N/A';

        return `
          <div style="padding:8px;">
            <strong>${data.planet}</strong><br/>
            <em>${xAxisLabel}:</em> ${formatNumber(data.x)}<br/>
            <em>${yAxisLabel}:</em> ${formatNumber(data.y)}<br/>
            <em>${availableFeatures[sizeFeature]}:</em> ${formatNumber(data.z)}<br/>
            <em>${availableFeatures[colorFeature]}:</em> ${formatNumber(data.eqTemperature)}
          </div>
        `;
      },
    },

    legend: {
      show: false,
    },
  };

  return (
    <div className="container mx-auto p-4" style={{ backgroundColor: '#f7f7f7', color: '#333' }}>
      <h1 className="text-3xl font-bold text-center mb-6">
        TOI Transit and Orbital Visualizations
      </h1>

      {/* Chart Feature Selections */}
      <div className="flex flex-wrap justify-center gap-4 mb-6">
        {/* X-axis feature */}
        <div className="flex flex-col">
          <label className="font-semibold text-gray-800">X-axis:</label>
          <select
            className="border rounded p-2 bg-white text-gray-800"
            value={xFeature}
            onChange={(e) => setXFeature(e.target.value)}
          >
            {Object.keys(availableFeatures).map((key) => (
              <option key={key} value={key}>
                {availableFeatures[key]}
              </option>
            ))}
          </select>
          
          <div className="mt-2">
            <label className="mr-2">Scale:</label>
            <select
              className="border rounded p-1"
              value={xScale}
              onChange={(e) => setXScale(e.target.value)}
            >
              <option value="linear">Linear</option>
              <option value="log">Log</option>
            </select>
          </div>
        </div>

        
        <div className="flex flex-col">
          <label className="font-semibold text-gray-800">Y-axis:</label>
          <select
            className="border rounded p-2 bg-white text-gray-800"
            value={yFeature}
            onChange={(e) => setYFeature(e.target.value)}
          >
            {Object.keys(availableFeatures).map((key) => (
              <option key={key} value={key}>
                {availableFeatures[key]}
              </option>
            ))}
          </select>
          {/* Log/Linear toggle for Y */}
          <div className="mt-2">
            <label className="mr-2">Scale:</label>
            <select
              className="border rounded p-1"
              value={yScale}
              onChange={(e) => setYScale(e.target.value)}
            >
              <option value="linear">Linear</option>
              <option value="log">Log</option>
            </select>
          </div>
        </div>

        
        <div className="flex flex-col">
          <label className="font-semibold text-gray-800">Bubble Size:</label>
          <select
            className="border rounded p-2 bg-white text-gray-800"
            value={sizeFeature}
            onChange={(e) => setSizeFeature(e.target.value)}
          >
            {Object.keys(availableFeatures).map((key) => (
              <option key={key} value={key}>
                {availableFeatures[key]}
              </option>
            ))}
          </select>
        </div>
            
        <div className="flex flex-col">
          <label className="font-semibold text-gray-800">Bubble Color:</label>
          <select
            className="border rounded p-2 bg-white text-gray-800"
            value={colorFeature}
            onChange={(e) => setColorFeature(e.target.value)}
          >
            {Object.keys(availableFeatures).map((key) => (
              <option key={key} value={key}>
                {availableFeatures[key]}
              </option>
            ))}
          </select>
        </div>
      </div>


      <div className="shadow-lg rounded-lg p-4 bg-white">
        <ReactApexChart
          options={optionsChart}
          series={series}
          type="bubble"
          height={500}
        />
      </div>


      <div className="mt-4 flex flex-col items-center">
        <div
          style={{
            width: '300px',
            height: '20px',
            background: 'linear-gradient(to right, rgb(0,0,255), rgb(255,0,0))',
            marginBottom: '5px',
          }}
        />
        <div className="flex justify-between w-full max-w-sm text-xs text-gray-600">
          <span>{minTemp === maxTemp ? 'N/A' : `${Math.round(minTemp)} ${getUnit(colorFeature)}`}</span>
          <span> - </span>
          <span>{minTemp === maxTemp ? 'No valid data' : `${Math.round(maxTemp)} ${getUnit(colorFeature)}`}</span>
        </div>


      </div>
    </div>
  );
}

export default App;
