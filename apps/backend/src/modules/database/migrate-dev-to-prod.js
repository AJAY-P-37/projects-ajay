#!/usr/bin/env node

const mongoose = require('mongoose');

const sourceUri = process.env.SOURCE_MONGO_URI || process.env.MONGODB_CONNECTION_URI || 'mongodb+srv://Ajay:IOlcSFqOpfbkEk97@personalblogcluster.qffdy8d.mongodb.net/PersonalBlog?appName=PersonalBlogCluster';
const targetUri = process.env.TARGET_MONGO_URI || process.env.MONGODB_CONNECTION_URI || 'mongodb+srv://Ajay:IOlcSFqOpfbkEk97@personalblogcluster.qffdy8d.mongodb.net/PersonalBlog?appName=PersonalBlogCluster';
const sourceDbName = process.env.SOURCE_DB_NAME || 'transaction_db_DEV';
const targetDbName = process.env.TARGET_DB_NAME || 'transaction_db_PROD';
const collectionsArg = process.env.COLLECTIONS || 'categories_new,expenses_new,expensesHistory_new';
const userIdsEnv = process.env.USER_IDS || process.env.USER_ID || '';
const dryRun = process.env.DRY_RUN === 'true';

const collections = collectionsArg
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean);

async function connectToDb(uri, dbName) {
  if (!uri) {
    throw new Error('Mongo URI is required. Set SOURCE_MONGO_URI/TARGET_MONGO_URI or MONGODB_CONNECTION_URI.');
  }

  const connection = mongoose.createConnection(uri, {
    dbName,
    serverSelectionTimeoutMS: 10000,
  });

  await connection.asPromise();
  console.log(`✅ Connected to ${dbName}`);
  return connection;
}

function parseUserIds() {
  if (!userIdsEnv) {
    return [];
  }

  return userIdsEnv
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

async function replaceCollectionData(sourceConnection, targetConnection, collectionName, userIds) {
  const sourceCollection = sourceConnection.db.collection(collectionName);
  const targetCollection = targetConnection.db.collection(collectionName);

  const results = [];

  for (const userId of userIds) {
    const filter = { userId };
    const docs = await sourceCollection.find(filter).toArray();

    console.log(`📦 ${collectionName}: ${docs.length} documents found from ${sourceDbName} for user ${userId}`);

    if (docs.length === 0) {
      results.push({ userId, deleted: 0, inserted: 0 });
      continue;
    }

    if (dryRun) {
      console.log(`[DRY RUN] Would delete ${collectionName} matching ${JSON.stringify(filter)} and insert ${docs.length} documents.`);
      results.push({ userId, deleted: 0, inserted: 0 });
      continue;
    }

    const deleteResult = await targetCollection.deleteMany(filter);
    const insertResult = await targetCollection.insertMany(docs);

    results.push({
      userId,
      deleted: deleteResult.deletedCount || 0,
      inserted: insertResult.insertedCount || docs.length,
    });
  }

  return results;
}

async function main() {
  const userIds = parseUserIds();

  console.log(`Starting full replacement migration from ${sourceDbName} -> ${targetDbName}`);
  console.log(`Collections: ${collections.join(', ')}`);
  if (userIds.length > 0) {
    console.log(`User filter(s): ${userIds.join(', ')}`);
  }

  const sourceConnection = await connectToDb(sourceUri, sourceDbName);
  const targetConnection = await connectToDb(targetUri, targetDbName);

  try {
    for (const collectionName of collections) {
      const results = await replaceCollectionData(sourceConnection, targetConnection, collectionName, userIds);
      for (const result of results) {
        console.log(`✅ ${collectionName} [${result.userId}]: deleted=${result.deleted}, inserted=${result.inserted}`);
      }
    }
  } finally {
    await sourceConnection.close();
    await targetConnection.close();
  }

  console.log('🎉 Replacement migration completed');
}

main().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
