const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

let products = [];

function loadCSVData() {
  fs.createReadStream('products.csv')
    .pipe(csv())
    .on('data', (row) => {
      products.push({
        code: row.item_code,
        name: row.item_name.toLowerCase(),
        price: row.item_price,
      });
    })
    .on('end', () => {
      console.log('CSV file successfully loaded.');
    });
}

loadCSVData();

app.get('/search', (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Query is required' });

  const queries = query
    .toLowerCase()
    .replace(/ and /g, ',')
    .split(',')
    .map(q => q.trim())
    .filter(q => q.length > 0);

  const foundItems = queries
    .map(q => products.find(p => p.name.includes(q)))
    .filter(Boolean);

  if (foundItems.length > 0) {
    return res.json({ items: foundItems });
  } else {
    return res.status(404).json({ error: 'No matching products found' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
