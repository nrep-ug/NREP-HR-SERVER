import { promises as fs } from 'fs';
import path from 'path';

const counterFilePath = path.resolve('./src/data/procurementCounter.json'); // Path to the counter file
const counterDir = path.dirname(counterFilePath); // Directory path
console.log(counterDir);

/**
 * Generates a unique ID in the format NREP-{TYPE}-YYYY-NNNN
 * @param {string} type - The type of ID to generate ('PR' for procurement requests, 'PS' for procurement posts, 'SR' for supplier registration)
 * @returns {Promise<string>} The unique ID
 */
export async function generateUniqueId(type) {
    try {
        // Ensure the directory exists
        await fs.mkdir(counterDir, { recursive: true });

        let data;

        // Check if the file exists and read its content, or initialize the counter
        try {
            data = await fs.readFile(counterFilePath, 'utf-8');
        } catch (error) {
            if (error.code === 'ENOENT') { // If the file does not exist
                data = JSON.stringify({
                    procurementRequestCounter: 0,
                    procurementPostCounter: 0,
                    supplierRegistrationCounter: 0
                });
                await fs.writeFile(counterFilePath, data);
            } else {
                throw error; // Rethrow if another error occurred
            }
        }

        const counterData = JSON.parse(data);

        // Determine the key based on the type
        let counterKey;
        let idPrefix;

        switch (type) {
            case 'PR':
                counterKey = 'procurementRequestCounter';
                idPrefix = 'PR';
                break;
            case 'PS':
                counterKey = 'procurementPostCounter';
                idPrefix = 'PS';
                break;
            case 'SR':
                counterKey = 'supplierRegistrationCounter';
                idPrefix = 'SR';
                break;
            default:
                throw new Error('Invalid type provided for ID generation');
        }

        // Initialize the counter if the key doesn't exist
        if (!counterData.hasOwnProperty(counterKey)) {
            counterData[counterKey] = 0;
        }

        // Increment the relevant counter
        counterData[counterKey] += 1;

        // Save the updated counter back to the file
        await fs.writeFile(counterFilePath, JSON.stringify(counterData, null, 2));

        const currentYear = new Date().getFullYear();
        const formattedCounter = String(counterData[counterKey]).padStart(4, '0');

        // Generate the unique ID in the format NREP-{TYPE}-YYYY-NNNN
        const uniqueId = `NREP-${idPrefix}-${currentYear}-${formattedCounter}`;

        return uniqueId;

    } catch (error) {
        console.error('Error generating unique ID:', error);
        throw new Error('Could not generate unique ID');
    }
}