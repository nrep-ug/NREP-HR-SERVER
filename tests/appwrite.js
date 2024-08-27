import { databases, procureDatabaseId } from '../src/config/appwrite.js';

const categories = [
    { catID: 'CAT001', name: 'Office Supplies' },
    { catID: 'CAT002', name: 'Technology & Electronics' },
    { catID: 'CAT003', name: 'Facility Management' },
    { catID: 'CAT004', name: 'Professional Services' },
    { catID: 'CAT005', name: 'Human Resources' },
    { catID: 'CAT006', name: 'Raw Materials' },
    { catID: 'CAT007', name: 'Production Equipment' },
    { catID: 'CAT008', name: 'Logistics & Transportation' },
    { catID: 'CAT009', name: 'Telecommunications' },
    { catID: 'CAT010', name: 'Travel and Hospitality' },
    { catID: 'CAT011', name: 'Research & Development' },
    { catID: 'CAT012', name: 'Marketing & Sales' },
    { catID: 'CAT013', name: 'Utilities' },
    { catID: 'CAT014', name: 'Insurance' },
    { catID: 'CAT015', name: 'Sustainability & Environment' },
    { catID: 'CAT000', name: 'Other' }
];

async function createCategories() {
    try {
        for (const cat of categories) {
            console.log('Creating: ', cat.catID);

            const response = await databases.createDocument(procureDatabaseId, '66c83917001ae20e92d0', cat.catID, cat);

            console.log('Created: ', cat.catID);
        }
    } catch (e) {
        console.log(e);
    }
}

// Call the function to create categories  
createCategories();