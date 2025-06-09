const fs = require('fs');
const csv = require('csv-parser');

let productMemory = [];

function loadCSVToMemory() {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream('products.csv')
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        productMemory = results;
        console.log("CSV Loaded into memory:", productMemory);
        resolve();
      })
      .on('error', reject);
  });
}

function findProductByName(name) {
  return productMemory.find(p => p.item_name.toLowerCase().includes(name.toLowerCase()));
}

module.exports = {
  loadCSVToMemory,
  findProductByName,
};
