import fs from 'node:fs';
import { changePublication } from './publication.mjs';

const indexPath = 'assets/latest-index.json';
const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
const updated = changePublication(index, process.env.PUBLICATION_ACTION, JSON.parse(process.env.PUBLICATION_IDS));
fs.writeFileSync(indexPath, `${JSON.stringify(updated, null, 2)}\n`);
