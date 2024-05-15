/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [channelData, setChannelData] = useState([]);
  const [numResults, setNumResults] = useState(10);

  useEffect(() => {
    fetchData(); // Fetch data when component mounts
    const interval = setInterval(fetchData, 2000); // Reload data every two seconds

    return () => clearInterval(interval); // Cleanup function
  }, []); 

  const fetchData = () => {
    const channelID = '2491004';
    const apiKey = 'EFM0ABGBQIJB7K5G';
    const url = `https://api.thingspeak.com/channels/${channelID}/feeds.json?api_key=${apiKey}&results=${numResults}`;

    axios.get(url)
      .then(response => {
        setChannelData(response.data.feeds);
        handleThresholdCheck(response.data.feeds);
        console.log(response.data.feeds)
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  };

  const handleThresholdCheck = (data) => {
    data.forEach(entry => {
      const parsedData = parseField1(entry.field1);
      const thresholds = {
        'Gas value': 300,
        'Voltage value': 40,
        'Vibration value': 500,
        'IR value': 0,
        'Temperature': 40,
        'Humidity': 70,
      };
  
      Object.entries(parsedData).forEach(([param, value]) => {
        if ( value > thresholds[param]) {
          console.log("Threshold exceeded for parameter:", param);
          callSTMPIfThresholdExceeded(param, value);
        }
      });
    });
  };
  

  const callSTMPIfThresholdExceeded = (param, value) => {
    console.log("Email triggered for parameter:", param, "with value:", value);
    const stmApiUrl = 'http://localhost:8080/mail/send';
  
    axios.post(stmApiUrl, null, {
      params: {
        param: param,
        value: value
      }
    })
    .then(response => {
      console.log('API call to STM successful:', response.data);
    })
    .catch(error => {
      console.error('Error calling STM API:', error);
    });
  };
  



  const renderRows = () => {
    return channelData.map(entry => (
      <tr key={entry.entry_id}>
        <td>{entry.entry_id}</td>
        <td>{entry.field1 && parseField1(entry.field1)['Gas value']}</td>
        <td>{entry.field1 && parseField1(entry.field1)['Voltage value']}</td>
        <td>{entry.field1 && parseField1(entry.field1)['Vibration value']}</td>
        <td>{entry.field1 && parseField1(entry.field1)['IR value']}</td>
        <td>{entry.field1 && parseField1(entry.field1)['Temperature']}</td>
        <td>{entry.field1 && parseField1(entry.field1)['Humidity']}</td>
        <td>{entry.field7}</td> {/* Displaying time string */}
      </tr>
    ));
  };

  const parseField1 = (field1) => {
    if (!field1) {
      return {};
    }

    const data = field1.split('\n').map(item => {
      const keyValue = item.split('=');
      if (keyValue.length === 2) {
        const [param, value] = keyValue;
        return { [param.trim()]: value.trim() };
      }
      return null;
    }).filter(Boolean);

    const parsedData = data.reduce((acc, curr) => {
      return { ...acc, ...curr };
    }, {});

    return parsedData;
  };

  const handleInputChange = (event) => {
    setNumResults(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    fetchData();
  };

  return (
    <div>
      <h1>ThingSpeak Channel Data</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Number of Data:
          <input type="number" value={numResults} onChange={handleInputChange} />
        </label>
        <button type="submit">Reload</button>
      </form>
      <table>
        <thead>
          <tr>
            <th>Entry ID</th>
            <th>Gas Value</th>
            <th>Voltage Value</th>
            <th>Vibration Value</th>
            <th>IR Value</th>
            <th>Temperature</th>
            <th>Humidity</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {renderRows()}
        </tbody>
      </table>
    </div>
  );
}

export default App;
