// Store history, previous readings, and last inputs for each apartment
let apartmentData = {
    1: { history: [], previousReadings: [], lastInputs: {} },
    2: { history: [], previousReadings: [], lastInputs: {} },
    3: { history: [], previousReadings: [], lastInputs: {} },
    4: { history: [], previousReadings: [], lastInputs: {} },
    5: { history: [], previousReadings: [], lastInputs: {} },
    6: { history: [], previousReadings: [], lastInputs: {} },
    7: { history: [], previousReadings: [], lastInputs: {} },
};

// Load data from localStorage on page load
window.onload = function() {
    loadApartmentData();
    const apartment = document.getElementById('apartmentSelect').value;
    loadInputs(apartment);
    updateAllHistories();
};

function loadApartmentData() {
    for (let i = 1; i <= 7; i++) {
        const storedData = localStorage.getItem(`apartment${i}Data`);
        if (storedData) {
            apartmentData[i] = JSON.parse(storedData);
        }
    }
}

function saveApartmentData() {
    for (let i = 1; i <= 7; i++) {
        localStorage.setItem(`apartment${i}Data`, JSON.stringify(apartmentData[i]));
    }
}

function loadInputs(apartment) {
    // Load last inputs for the selected apartment
    const inputs = apartmentData[apartment].lastInputs;
    if (inputs) {
        document.getElementById('currentReading').value = inputs.currentReading || '';
        document.getElementById('previousReading').value = inputs.previousReading || '';
        document.getElementById('costPerKwh').value = inputs.costPerKwh || '';
    }
}

function saveInputs(apartment) {
    // Save current inputs for the selected apartment
    apartmentData[apartment].lastInputs = {
        currentReading: document.getElementById('currentReading').value,
        previousReading: document.getElementById('previousReading').value,
        costPerKwh: document.getElementById('costPerKwh').value
    };
}

function calculateEnergy() {
    const apartment = document.getElementById('apartmentSelect').value;
    const currentReading = parseFloat(document.getElementById('currentReading').value);
    const previousReading = parseFloat(document.getElementById('previousReading').value);
    const costPerKwh = parseFloat(document.getElementById('costPerKwh').value);
    
    if (isNaN(currentReading) || isNaN(previousReading) || isNaN(costPerKwh)) {
        document.getElementById('result').innerText = 'Please enter valid numbers for all fields.';
        return;
    }
    if (currentReading <= previousReading) {
        document.getElementById('result').innerText = 'Current reading must be greater than previous reading.';
        return;
    }
    if (costPerKwh < 0) {
        document.getElementById('result').innerText = 'Cost per kWh must be non-negative.';
        return;
    }
    
    if (apartmentData[apartment].previousReadings.includes(currentReading)) {
        document.getElementById('result').innerText = 'This current reading has already been used for this apartment. Please enter a different value.';
        return;
    }

    apartmentData[apartment].previousReadings.push(currentReading);

    const totalReading = currentReading - previousReading;
    const totalCost = totalReading * costPerKwh;
    
    const resultText = 
        `Apartment ${apartment} - Total Energy Consumption: ${totalReading.toFixed(2)} kWh\n` +
        `Total Cost: $${totalCost.toFixed(2)}`;
    document.getElementById('result').innerText = resultText;
    
    apartmentData[apartment].history.push(resultText);
    saveInputs(apartment); // Save the current inputs for the selected apartment
    updateHistory(apartment);
    saveApartmentData(); // Save all data to localStorage
}

function updateHistory(apartment) {
    const historyElement = document.getElementById(`history${apartment}`);
    historyElement.innerHTML = ''; 

    apartmentData[apartment].history.forEach((result, index) => {
        const li = document.createElement('li');
        li.innerText = `Computation ${index + 1}: ${result}`;
        historyElement.appendChild(li);
    });
}

function updateAllHistories() {
    for (let i = 1; i <= 7; i++) {
        updateHistory(i);
    }
}

function clearHistory() {
    const apartment = document.getElementById('apartmentSelect').value;
    apartmentData[apartment].history = [];
    apartmentData[apartment].previousReadings = []; 
    document.getElementById(`history${apartment}`).innerHTML = '';
    saveApartmentData(); 
}

function generateExcel() {
    const apartment = document.getElementById('apartmentSelect').value;
    const data = apartmentData[apartment];
    
    // Prepare data for Excel
    const workbook = XLSX.utils.book_new();
    
    // Create a worksheet for history
    const historySheet = XLSX.utils.json_to_sheet(data.history.map((result, index) => ({
        Computation: `Computation ${index + 1}`,
        Result: result
    })));
    XLSX.utils.book_append_sheet(workbook, historySheet, `Apartment ${apartment} History`);
    
    // Create a worksheet for previous readings
    const readingsSheet = XLSX.utils.json_to_sheet(data.previousReadings.map((reading, index) => ({
        ReadingIndex: index + 1,
        PreviousReading: reading
    })));
    XLSX.utils.book_append_sheet(workbook, readingsSheet, `Apartment ${apartment} Readings`);

    // Add last inputs to the workbook
    const inputsSheet = XLSX.utils.json_to_sheet([{
        CurrentReading: data.lastInputs.currentReading || '',
        PreviousReading: data.lastInputs.previousReading || '',
        CostPerKwh: data.lastInputs.costPerKwh || ''
    }]);
    XLSX.utils.book_append_sheet(workbook, inputsSheet, `Apartment ${apartment} Last Inputs`);

    // Write the workbook and initiate download
    XLSX.writeFile(workbook, `Apartment_${apartment}_Data.xlsx`);
}

// Add event listener for the download button
document.getElementById('generateExcel').addEventListener('click', generateExcel);

// Handle apartment change and update inputs
document.getElementById('apartmentSelect').addEventListener('change', function() {
    const apartment = this.value;
    loadInputs(apartment);
});
