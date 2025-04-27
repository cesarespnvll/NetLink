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
          row.Company.trim() !== '--' && 
          row.Position.trim() !== '--'
        )
        .map(row => ({
          Company: capitalizeWords(row.Company.trim()),
          Position: capitalizeWords(row.Position.trim())
        }));

      // Build hierarchy
      const companyMap = new Map();
      
      cleanData.forEach(({ Company, Position }) => {
        if (!companyMap.has(Company)) {
          companyMap.set(Company, new Map());
        }
        const positionCount = companyMap.get(Company).get(Position) || 0;
        companyMap.get(Company).set(Position, positionCount + 1);
      });

      // Prepare Plotly data
      const labels = ['My Network'];
      const parents = [''];
      const values = [cleanData.length]; // Root value = total connections

      companyMap.forEach((positions, company) => {
        const companyTotal = Array.from(positions.values()).reduce((a,b) => a + b, 0);
        
        // Add company node
        labels.push(company);
        parents.push('My Network');
        values.push(companyTotal);

        // Add position nodes
        positions.forEach((count, position) => {
          labels.push(position);
          parents.push(company);
          values.push(count);
        });
      });

      // Create treemap
      Plotly.newPlot('chart', [{
        type: "treemap",
        labels: labels,
        parents: parents,
        values: values,
        branchvalues: "total",
        textinfo: "label+value+percent parent",
        hoverinfo: "label+value+percent parent",
        marker: { colors: ['#4e79a7','#f28e2b','#e15759','#76b7b2'] }
      }], {
        margin: { t: 30 }
      });
    }
  });
});

// Helper function
function capitalizeWords(str) {
  return str.replace(/\w\S*/g, txt => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}
