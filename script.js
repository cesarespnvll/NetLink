document.getElementById('csvFile').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      // Clean and process data
      const cleanData = results.data
        .filter(row =>
          row.Company &&
          row.Position &&
          row.Company.trim() !== '' &&
          row.Position.trim() !== '' &&
          row.Company.trim() !== '--' &&
          row.Position.trim() !== '--'
        )
        .map(row => ({
          Company: capitalizeWords(row.Company.trim()),
          Position: capitalizeWords(row.Position.trim())
        }));

      // Build hierarchy: Company -> Position
      const companyMap = new Map();

      cleanData.forEach(({ Company, Position }) => {
        if (!companyMap.has(Company)) {
          companyMap.set(Company, new Map());
        }
        const positionCount = companyMap.get(Company).get(Position) || 0;
        companyMap.get(Company).set(Position, positionCount + 1);
      });

      // Prepare Plotly data arrays
      const labels = ['My Network'];
      const parents = [''];
      const values = [0]; // We'll set the root value at the end

      let totalConnections = 0;

      companyMap.forEach((positions, company) => {
        const companyTotal = Array.from(positions.values()).reduce((a, b) => a + b, 0);

        // Add company node
        labels.push(company);
        parents.push('My Network');
        values.push(companyTotal);

        totalConnections += companyTotal;

        // Add position nodes
        positions.forEach((count, position) => {
          labels.push(position);
          parents.push(company);
          values.push(count);
        });
      });

      // Set the root value to total connections
      values[0] = totalConnections;

      Plotly.newPlot('chart', [{
        type: "treemap",
        labels: labels,
        parents: parents,
        values: values,
        branchvalues: "total",
        textinfo: "label+value+percent parent",
        hoverinfo: "label+value+percent parent",
        marker: { colors: ['#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f','#edc949','#af7aa1','#ff9da7','#9c755f','#bab0ab'] }
      }], {
        margin: { t: 50, l: 10, r: 10, b: 10 }
      });
    }
  });
});

// Helper function to capitalize each word
function capitalizeWords(str) {
  return str.replace(/\w\S*/g, txt =>
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}
