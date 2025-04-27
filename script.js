document.getElementById('csvFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(evt) {
        // Parse CSV using PapaParse to handle quoted fields
        Papa.parse(evt.target.result, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                const data = results.data;
                
                // Create hierarchical structure
                const hierarchy = {
                    name: "My Network",
                    children: []
                };

                // Group by Company then Position (exact match)
                const companyMap = new Map();
                
                data.forEach(row => {
                    const company = row.Company?.trim() || 'Unknown Company';
                    const position = row.Position?.trim() || 'Unknown Position';

                    // Company grouping
                    if (!companyMap.has(company)) {
                        companyMap.set(company, {
                            name: company,
                            children: new Map()
                        });
                    }
                    
                    // Position grouping within company
                    const companyGroup = companyMap.get(company);
                    if (!companyGroup.children.has(position)) {
                        companyGroup.children.set(position, 1);
                    } else {
                        companyGroup.children.set(position, companyGroup.children.get(position) + 1);
                    }
                });

                // Convert maps to Plotly format
                companyMap.forEach(company => {
                    const positions = [];
                    company.children.forEach((count, position) => {
                        positions.push({
                            name: position,
                            value: count
                        });
                    });
                    
                    hierarchy.children.push({
                        name: company.name,
                        children: positions
                    });
                });

                // Create treemap
                Plotly.newPlot('chart', [{
                    type: "treemap",
                    labels: [hierarchy.name, ...hierarchy.children.flatMap(c => [c.name, ...c.children.map(p => p.name)])],
                    parents: [null, ...hierarchy.children.flatMap(c => [hierarchy.name, ...Array(c.children.length).fill(c.name)])],
                    values: [0, ...hierarchy.children.flatMap(c => [0, ...c.children.map(p => p.value)])],
                    branchvalues: 'total',
                    textinfo: "label+value+percent parent",
                    hoverinfo: "label+value+percent parent",
                    marker: { colors: ['#4e79a7','#f28e2b','#e15759','#76b7b2'] }
                }], {
                    margin: { t: 30 }
                });
            }
        });
    };
    reader.readAsText(file);
});
