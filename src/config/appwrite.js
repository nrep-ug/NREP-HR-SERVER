import { Client, Databases, ID, Query } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client();

client
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

// HR-DATABASE
const hrDatabaseId = process.env.HR_DB_ID;
const staffTableId = process.env.STAFF_TABLE_ID;

// PROJECT DATABASE

export {
    client,
    databases,
    hrDatabaseId,
    staffTableId,
    ID,
    Query
};

