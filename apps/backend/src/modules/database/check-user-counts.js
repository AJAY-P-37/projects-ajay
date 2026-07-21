#!/usr/bin/env node

const mongoose = require('mongoose');

const uri = process.env.MONGODB_CONNECTION_URI || 'mongodb+srv://Ajay:IOlcSFqOpfbkEk97@personalblogcluster.qffdy8d.mongodb.net/PersonalBlog?appName=PersonalBlogCluster';
const userId = process.env.USER_ID || 'CqhsM3xLbsNXCvJUv6Z7qzB3slj1';
const sourceDbName = process.env.SOURCE_DB_NAME || 'transaction_db_DEV';
const targetDbName = process.env.TARGET_DB_NAME || 'transaction_db_PROD';

async function main() {
  const connection = mongoose.createConnection(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  await connection.asPromise();

  const sourceDb = connection.useDb(sourceDbName);
  const targetDb = connection.useDb(targetDbName);

  const sourceCount = await sourceDb.collection('expenses_new').countDocuments({ userId });
  const targetCount = await targetDb.collection('expenses_new').countDocuments({ userId });

  console.log(`source (${sourceDbName}) count:`, sourceCount);
  console.log(`target (${targetDbName}) count:`, targetCount);

  const sourceDocs = await sourceDb.collection('expenses_new').find({ userId }).toArray();
  const targetDocs = await targetDb.collection('expenses_new').find({ userId }).toArray();

  const sourceSignatures = new Map(sourceDocs.map((doc) => [JSON.stringify(normalizeDoc(doc)), doc]));
  const targetSignatures = new Map(targetDocs.map((doc) => [JSON.stringify(normalizeDoc(doc)), doc]));

  const missingInTarget = sourceDocs.filter((doc) => !targetSignatures.has(JSON.stringify(normalizeDoc(doc))));
  const extraInTarget = targetDocs.filter((doc) => !sourceSignatures.has(JSON.stringify(normalizeDoc(doc))));

  console.log('\nMissing in target (present in source, absent in target):');
  console.log(JSON.stringify(missingInTarget.slice(0, 20), null, 2));

  console.log('\nExtra in target (present in target, absent in source):');
  console.log(JSON.stringify(extraInTarget.slice(0, 20), null, 2));

  function normalizeDoc(doc) {
    const normalized = { ...doc };
    delete normalized._id;
    delete normalized.createdAt;
    delete normalized.updatedAt;
    delete normalized.__v;
    return normalized;
  }

  await connection.close();
}

main().catch((error) => {
  console.error('❌ Check failed:', error);
  process.exit(1);
});
