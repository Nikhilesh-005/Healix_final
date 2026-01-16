
import fs from 'fs';
const content = fs.readFileSync('model_results.txt', 'utf8');
const lines = content.split('\n');
const successes = lines.filter(l => l.startsWith('SUCCESS'));
console.log("Successes found:");
successes.forEach(s => console.log(s));
if (successes.length === 0) console.log("No successes found. First failure: ", lines.find(l => l.startsWith('FAILED')));
