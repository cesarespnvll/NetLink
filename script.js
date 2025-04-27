// Helper: Parse CSV to Array of Objects - Improved version
function parseCSV(text) {
  // Detect delimiter (comma or semicolon)
  const delimiter = text.includes(';') && !text.includes(',') ? ';' : ',';
  const lines = text.split('\n').filter(line => line.trim() !== '');
  const headers = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, ''));
  
  console.log("CSV Headers:", headers);
  const rows = lines.slice(1);

  return rows.map(row => {
    // Handle quoted fields properly
    const values = [];
    let inQuotes = false;
    let currentValue = '';
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        values.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue);
    
    return headers.reduce((obj, header, i) => {
      obj[header] = (values[i] || '').replace(/^"|"$/g, '').trim();
      return obj;
    }, {});
  });
}

// Helper function to capitalize words nicely
function capitalizeWords(str) {
  return str.replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

// Build Treemap Data - Based on Tavish's original algorithm
function buildTreemapData(data) {
  // In the original Python code, he uses these columns
  // and also drops rows where these are NA
  const companyColOptions = ['Company', 'company', ' Company ', 'COMPANY'];
  const positionColOptions = ['Position', 'position', ' Position ', 'POSITION', 'Title', 'Job Title'];
  
  // Find the actual column names in the CSV
  const companyCol = Object.keys(data[0]).find(k => 
    companyColOptions.includes(k) || k.toLowerCase().includes('company')
  );
  
  const positionCol = Object.keys(data[0]).find(k => 
    positionColOptions.includes(k) || k.toLowerCase().includes('position')
  );
  
  console.log("Using columns:", { companyCol, positionCol });

  // Create treemap structure - matching exactly what plotly.express does
  const labels = ['My Network'];
  const parents = [''];
  const values = [0]; // Root node value
  
  const companyMap = {};
  const positionMap = {};

  // Filter out rows with missing company/position (matching the Python dropna)
  const filteredData = data.filter(row => 
    row[companyCol] && row[companyCol].trim() !== '' && 
    row[positionCol] && row[positionCol].trim() !== ''
  );
  
  filteredData.forEach(row => {
    const company = capitalizeWords(row[companyCol].trim());
    const position = capitalizeWords(row[positionCol].trim());

    // Add company node if it doesn't exist
    if (!companyMap[company]) {
      labels.push(company);
      parents.push('My Network');
      values.push(0); // Will be updated as we add positions
      companyMap[company] = labels.length - 1;
    }

    // Add position node or update count if it exists
    const posKey = company + '|' + position;
    if (!positionMap[posKey]) {
      labels.push(position);
      parents.push(company);
      values.push(1);
      positionMap[posKey] = labels.length - 1;
    } else {
      values[positionMap[posKey]] += 1;
    }
  });

  return { labels, parents, values };
}

// Handle CSV Upload
document.getElementById('csvFile').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const data = parseCSV(evt.target.result);
      console.log("Sample data:", data[0]);
      
      const treemap = buildTreemapData(data);
      
      Plotly.newPlot('chart', [{
        type: "treemap",
        labels: treemap.labels,
        parents: treemap.parents,
        values: treemap.values,
        textinfo: "label+value+percent parent+percent entry",
        hoverinfo: "label+value+percent parent+percent entry",
        marker: { colors: ['#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f','#edc949','#af7aa1','#ff9da7','#9c755f','#bab0ab'] }
      }], {
        margin: { t: 50, l: 10, r: 10, b: 10 }
      });
    } catch (error) {
      console.error("Error processing CSV:", error);
      alert("Error processing CSV. Check console for details.");
    }
  };
  reader.readAsText(file);
});