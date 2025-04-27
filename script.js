// Helper: Parse CSV to Array of Objects
function parseCSV(text) {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows = lines.slice(1);

  return rows.map(row => {
    const values = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
    return headers.reduce((obj, header, i) => {
      obj[header] = (values[i] || '').replace(/^"|"$/g, '');
      return obj;
    }, {});
  });
}

// Build Treemap Data
function buildTreemapData(data) {
  // Detect columns
  const companyCol = Object.keys(data[0]).find(k => /company/i.test(k));
  const positionCol = Object.keys(data[0]).find(k => /position/i.test(k));

  const labels = ['My Network'];
  const parents = [''];
  const values = [0]; // Root node

  const companyMap = {};
  const positionMap = {};

  data.forEach(row => {
    const company = row[companyCol] || 'Unknown Company';
    const position = row[positionCol] || 'Unknown Position';

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

// Handle CSV Upload
document.getElementById('csvFile').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    const data = parseCSV(evt.target.result);
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
  };
  reader.readAsText(file);
});
