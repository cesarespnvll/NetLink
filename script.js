function capitalizeWords(str) {
  return str.replace(/\w\S*/g, function(txt){
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

// Robust CSV parser for two-column CSVs
function parseCSV(text) {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows = lines.slice(1);

  return rows.map(row => {
    // Handle quoted fields and commas inside quotes
    const values = [];
    let inQuotes = false, value = '';
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(value);
        value = '';
      } else {
        value += char;
      }
    }
    values.push(value);
    return headers.reduce((obj, header, i) => {
      obj[header] = (values[i] || '').replace(/^"|"$/g, '').trim();
      return obj;
    }, {});
  });
}

function buildTreemapData(data) {
  // Find columns, ignoring case and spaces
  const companyCol = Object.keys(data[0]).find(
    k => k.replace(/\s+/g, '').toLowerCase() === 'company'
  );
  const positionCol = Object.keys(data[0]).find(
    k => k.replace(/\s+/g, '').toLowerCase() === 'position'
  );

  if (!companyCol || !positionCol) {
    alert("CSV must have 'Company' and 'Position' columns.");
    return { labels: [], parents: [], values: [] };
  }

  const labels = ['My Network'];
  const parents = [''];
  const values = [0];
  const companyMap = {};
  const positionMap = {};

  data.forEach(row => {
    let company = row[companyCol] ? row[companyCol].trim() : '';
    let position = row[positionCol] ? row[positionCol].trim() : '';
    company = company ? capitalizeWords(company) : 'Unknown Company';
    position = position ? capitalizeWords(position) : 'Unknown Position';

    // Company node
    if (!companyMap[company]) {
      labels.push(company);
      parents.push('My Network');
      values.push(0);
      companyMap[company] = labels.length - 1;
    }

    // Position node (unique per company+position)
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

document.getElementById('csvFile').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    const text = evt.target.result;
    const data = parseCSV(text);
    if (!data.length) {
      alert("CSV file is empty or not formatted correctly.");
      return;
    }
    const treemap = buildTreemapData(data);
    if (treemap.labels.length < 2) {
      alert("No valid data found in CSV.");
      return;
    }
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
  };
  reader.readAsText(file);
});
