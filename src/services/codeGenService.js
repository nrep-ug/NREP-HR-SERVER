// src/services/codeGenerator.js
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to your JSON store
const dataDir  = path.resolve(__dirname, '../data');
const storePath = path.join(dataDir, 'unique_codes.json');

/**
 * Generate either:
 *  - a random numeric string of exactly `length` digits (if prefix is empty),
 *  - or a sequential code of form `${prefix}${zeroPaddedNumber}`,
 *    with the counter stored and incremented in unique_codes.json.
 *
 * @param {string} prefix  Optional string prefix. If empty, returns pure random digits.
 * @param {number} length  Total digits for the numeric part (required).
 * @returns {Promise<string>}  The generated code.
 */
export async function generateUniqueCode(prefix, length) {
  if (!Number.isInteger(length) || length < 1) {
    throw new Error('`length` must be a positive integer');
  }

  // If no prefix, just emit random digits
  if (!prefix) {
    let code = '';
    for (let i = 0; i < length; i++) {
      // a random digit 0–9
      code += Math.floor(Math.random() * 10);
    }
    return code;
  }

  // Ensure data directory exists
  await fs.mkdir(dataDir, { recursive: true });

  // Load or init the store
  let store = {};
  try {
    const raw = await fs.readFile(storePath, 'utf-8');
    store = JSON.parse(raw);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err; // real error
  }

  // Initialize entry if needed, or update length if it’s changed
  if (!store[prefix]) {
    store[prefix] = { length, last: 0 };
  } else if (store[prefix].length !== length) {
    store[prefix].length = length;
  }

  // Increment counter and zero-pad
  const next = store[prefix].last + 1;
  const numberPart = String(next).padStart(length, '0');
  const fullCode = `${prefix}${numberPart}`;

  // Persist the updated counter
  store[prefix].last = next;
  await fs.writeFile(storePath, JSON.stringify(store, null, 2));

  return fullCode;
}
