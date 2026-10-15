import path from 'node:path';
import { buildPages } from './publication.mjs';

buildPages(process.cwd(), path.resolve('_site'));
