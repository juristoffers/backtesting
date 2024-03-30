//initialization
//Importing js libaries 
const express = require('express');
const app = express();
const port = 3000;
const yahooFinance = require('yahoo-finance2').default;



let globalTradeData = [];  // To store the trade data

function calculateSMA(data, length) {
    let sma = [];
    for (let i = length - 1; i < data.length; i++) {
        let sum = 0;
        for (let j = 0; j < length; j++) {
            sum += data[i - j];
        }
        sma.push(sum / length);
    }
    return sma;
}

async function backtestLongStrategy() {
    const queryOptions = {
        period1: '2020-01-01',
        period2: '2024-03-29',
        interval: '1d',
    };
    const historicalData = await yahooFinance.historical('BTC-USD', queryOptions);

    const closePrices = historicalData.map(day => day.close);
    const sma200 = calculateSMA(closePrices, 200); // Adjust SMA length to 200

    globalTradeData = [];  // Reset trade data before each backtest
    let position = null;  // To track whether we have an open position

    for (let i = 200; i < historicalData.length; i++) { // Start from 200 due to SMA200
        const currentDay = historicalData[i];
        const currentClose = currentDay.close;
        const currentOpen = currentDay.open;
        const currentLow = currentDay.low;
    
        const currentSMA = sma200[i - 200];

        if(currentOpen > currentSMA){
            // Check if we should open a position
        if (!position && currentLow <= currentSMA && currentClose > currentSMA) {
            position = { date: currentDay.date, price: currentClose }; // Open a new position
            globalTradeData.push({ date: currentDay.date, price: currentClose, action: 'Buy' });
        }
        // Check if we should close the position
        else if (position && currentClose < currentSMA) {
            globalTradeData.push({ date: currentDay.date, price: currentClose, action: 'Sell' });
            position = null;  // Close the position
        }
        }
    }

    return globalTradeData; // Return the trade data for further usage
}

backtestLongStrategy();  // Remember to call this somewhere appropriate

app.get('/trade-data', (req, res) => {
    // Assuming backtestLongStrategy has been called and globalTradeData populated
    res.json(globalTradeData);  // Send the trade data as JSON response
});


//Runnin servers on localhost
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});