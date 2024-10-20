import React, { useEffect, useState } from 'react';
import axios from 'axios';
import "../../src/index.css"

function Binancep2p() {
  const [buyPrices, setBuyPrices] = useState([]); // State for BUY orders
  const [sellPrices, setSellPrices] = useState([]); // State for SELL orders
  const [transAmount, setTransAmount] = useState(1000); // State for transaction amount
  const [publisherType, setPublisherType] = useState(null); // State for publisher type (null/merchant)
  const [payTypes, setPayTypes] = useState(["BANK", "MpesaKenya", "MpesaPaybill"]); // State for payment types
  const [recordedPrices, setRecordedPrices] = useState([]); // State for recorded prices
  const [isRecording, setIsRecording] = useState(false); // State to track if recording is active
  const [intervalId, setIntervalId] = useState(null); // State to store the interval ID

  const fetchRecordedPrices = async () => {
    try {
      const response = await axios.get('http://localhost:5000/backend/models/data');
      const prices = response.data;

      setRecordedPrices(prices);
      localStorage.setItem("recordedPrices", JSON.stringify(prices));
    } catch (error) {
      console.error('Error fetching recorded prices:', error);
    }
  };

  useEffect(() => {
    async function fetchP2PPrices(tradeType) {
      try {
        const payload = {
          fiat: "KES",
          page: 1,
          rows: 10,
          tradeType: tradeType,
          asset: "USDT",
          countries: ["KE"],
          additionalKycVerifyFilter: 0,
          classifies: ["mass", "profession", "fiat_trade"],
          filterType: "all",
          payTypes: payTypes,
          periods: [],
          proMerchantAds: false,
          publisherType: publisherType,
          shieldMerchantAds: false,
          transAmount: transAmount,
        };

        const response = await axios.post(
          "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search",
          payload
        );

        const orders = response.data.data;

        if (tradeType === "BUY") {
          setBuyPrices(orders);
        } else if (tradeType === "SELL") {
          setSellPrices(orders);
        }
      } catch (error) {
        console.error(`Error fetching P2P ${tradeType} prices:`, error);
      }
    }

    // Function to fetch all data
    const fetchAllPrices = () => {
      fetchP2PPrices("BUY");
      fetchP2PPrices("SELL");
      fetchRecordedPrices();
    };

    // Initial fetch
    fetchAllPrices();

    // Set up interval to refresh every 20 seconds
    const intervalId = setInterval(fetchAllPrices, 20000); // 20000 milliseconds = 20 seconds

    // Cleanup function to clear the interval on component unmount or when dependencies change
    return () => clearInterval(intervalId);
  }, [transAmount, publisherType, payTypes]);

  const recordPrices = async () => {
    if (buyPrices.length > 0 && sellPrices.length > 0) {
      const buyPrice = buyPrices[0].adv.price;
      const sellPrice = sellPrices[0].adv.price;
      const currentTime = new Date().toLocaleTimeString();

      try {
        await axios.post('http://localhost:5000/backend/models/data', {
          time: currentTime,
          buy: buyPrice,
          sell: sellPrice,
          advertiser: buyPrices[0].advertiser.nickName,
        });

        fetchRecordedPrices();
      } catch (error) {
        console.error('Error recording prices:', error);
      }
    }
  };

  const deleteRecordedPrices = async () => {
    try {
      const response = await axios.delete('http://localhost:5000/backend/models/data');
      console.log(response.data.message);
      setRecordedPrices([]);
      localStorage.removeItem("recordedPrices");
    } catch (error) {
      console.error('Error deleting recorded prices:', error);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    recordPrices();

    const id = setInterval(() => {
      recordPrices();
    }, 30 * 60 * 1000);

    setIntervalId(id);
  };

  const resetRecording = () => {
    setRecordedPrices([]);
    localStorage.removeItem("recordedPrices");
    clearInterval(intervalId);
    setIsRecording(false);
  };

  useEffect(() => {
    return () => clearInterval(intervalId);
  }, [intervalId]);

  const handlePayTypeChange = (payType) => {
    setPayTypes((prevPayTypes) =>
      prevPayTypes.includes(payType)
        ? prevPayTypes.filter((type) => type !== payType)
        : [...prevPayTypes, payType]
    );
  };

  return (
    <div style={{
      marginTop: '0',
      marginBottom: '0',
      padding: '16px',
      textAlign: 'center',
      width: '100%',
      minHeight: '100vh', // Ensure full viewport height
      boxSizing: 'border-box' // Include padding in the total height and width
    }}>
      <h2>Binance P2P Prices</h2>

      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="transAmount">Transaction Amount (KES): </label>
        <input
          id="transAmount"
          type="number"
          value={transAmount}
          onChange={(e) => setTransAmount(e.target.value)}
          style={{
            border: '1px solid gray',
            borderRadius: '4px',
            padding: '4px',
            marginLeft: '8px',
            backgroundColor: 'transparent' // Remove background
          }}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="publisherType">Publisher Type: </label>
        <select
          id="publisherType"
          value={publisherType}
          onChange={(e) => setPublisherType(e.target.value)}
          style={{
            border: '1px solid gray',
            borderRadius: '4px',
            padding: '4px',
            marginLeft: '8px',
            backgroundColor: 'transparent' // Remove background
          }}
        >
          <option value={null}>None</option>
          <option value="merchant">Merchant</option>
        </select>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label>Payment Methods:</label>
        <div>
          <label style={{ marginRight: '16px' }}>
            <input
              type="checkbox"
              checked={payTypes.includes("BANK")}
              onChange={() => handlePayTypeChange("BANK")}
            />
            BANK
          </label>
          <label style={{ marginRight: '16px' }}>
            <input
              type="checkbox"
              checked={payTypes.includes("MpesaKenya")}
              onChange={() => handlePayTypeChange("MpesaKenya")}
            />
            MpesaKenya
          </label>
          <label style={{ marginRight: '16px' }}>
            <input
              type="checkbox"
              checked={payTypes.includes("MpesaPaybill")}
              onChange={() => handlePayTypeChange("MpesaPaybill")}
            />
            MpesaPaybill
          </label>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        {!isRecording && (
          <button
            style={{
              marginRight: '8px',
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: '#fff',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
            onClick={startRecording}
          >
            Start Recording
          </button>
        )}
        <button
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: '#fff',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
          onClick={resetRecording}
        >
          Reset
        </button>
        <button
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: '#fff',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
          onClick={deleteRecordedPrices}
        >
          Delete from database
        </button>
      </div>

      {/* Display BUY and SELL Prices side by side */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '24px' }}>
        <div style={{ width: '48%' }}>
          <h3 style={{ marginTop: '16px', fontSize: '18px', fontWeight: '600' }}>Buy Orders</h3>
          <table style={{ width: '100%', border: '1px solid gray', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ border: '1px solid gray' }}>Price (KES)</th>
                <th style={{ border: '1px solid gray' }}>Asset</th>
                <th style={{ border: '1px solid gray' }}>Advertiser</th>
              </tr>
            </thead>
            <tbody>
              {buyPrices.map((order, index) => (
                <tr key={index} style={{ cursor: 'pointer' }}>
                  <td style={{ border: '1px solid gray' }}>{order.adv.price}</td>
                  <td style={{ border: '1px solid gray' }}>{order.adv.asset}</td>
                  <td style={{ border: '1px solid gray' }}>{order.advertiser.nickName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ width: '48%' }}>
          <h3 style={{ marginTop: '16px', fontSize: '18px', fontWeight: '600' }}>Sell Orders</h3>
          <table style={{ width: '100%', border: '1px solid gray', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ border: '1px solid gray' }}>Price (KES)</th>
                <th style={{ border: '1px solid gray' }}>Asset</th>
                <th style={{ border: '1px solid gray' }}>Advertiser</th>
              </tr>
            </thead>
            <tbody>
              {sellPrices.map((order, index) => (
                <tr key={index} style={{ cursor: 'pointer' }}>
                  <td style={{ border: '1px solid gray' }}>{order.adv.price}</td>
                  <td style={{ border: '1px solid gray' }}>{order.adv.asset}</td>
                  <td style={{ border: '1px solid gray' }}>{order.advertiser.nickName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table for Recorded Prices */}
      <h3 style={{ marginTop: '16px', fontSize: '18px', fontWeight: '600' }}>Recorded Prices Every 30 Minutes</h3>
      <table style={{ width: '100%', border: '1px solid gray', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa' }}>
            <th style={{ border: '1px solid gray' }}>Time</th>
            <th style={{ border: '1px solid gray' }}>Buy Price (KES)</th>
            <th style={{ border: '1px solid gray' }}>Sell Price (KES)</th>
          </tr>
        </thead>
        <tbody>
          {recordedPrices.map((record, index) => (
            <tr key={index} style={{ cursor: 'pointer' }}>
              <td style={{ border: '1px solid gray' }}>{record.time}</td>
              <td style={{ border: '1px solid gray' }}>{record.buy}</td>
              <td style={{ border: '1px solid gray' }}>{record.sell}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Binancep2p; 