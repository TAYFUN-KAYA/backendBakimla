const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Migration Script: Remove old phoneNumber_1 unique index
 * 
 * This script removes the old unique index on phoneNumber field
 * and ensures the new compound unique index (phoneNumber + userType) is in place.
 * 
 * Run: node scripts/migratePhoneNumberIndex.js
 */
async function migratePhoneNumberIndex() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI environment variable is not set');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // Get all indexes
    const indexes = await collection.indexes();
    console.log('\n📋 Current indexes:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Check if old phoneNumber_1 index exists
    const phoneNumberIndex = indexes.find(
      index => index.name === 'phoneNumber_1' && Object.keys(index.key).length === 1
    );

    if (phoneNumberIndex) {
      console.log('\n🗑️  Found old phoneNumber_1 unique index. Removing...');
      await collection.dropIndex('phoneNumber_1');
      console.log('✅ Successfully removed phoneNumber_1 index');
    } else {
      console.log('\nℹ️  Old phoneNumber_1 index not found (may have been already removed)');
    }

    // Check if compound index exists
    const compoundIndex = indexes.find(
      index => 
        index.name === 'phoneNumber_1_userType_1' || 
        (index.key.phoneNumber === 1 && index.key.userType === 1)
    );

    if (!compoundIndex) {
      console.log('\n📝 Creating compound unique index (phoneNumber + userType)...');
      await collection.createIndex(
        { phoneNumber: 1, userType: 1 },
        { unique: true, name: 'phoneNumber_1_userType_1' }
      );
      console.log('✅ Successfully created compound unique index');
    } else {
      console.log('\n✅ Compound unique index already exists');
    }

    // Show final indexes
    const finalIndexes = await collection.indexes();
    console.log('\n📋 Final indexes:');
    finalIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n✅ Migration completed successfully!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run migration
migratePhoneNumberIndex();

