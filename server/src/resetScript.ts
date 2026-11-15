// FinRescue X — Reset Database with Full Seed Data
import { resetDB } from './database';
import { createSeedData } from './seed';

const fresh = createSeedData();
resetDB(fresh);
console.log('Database successfully re-seeded with Merchant & Normal User demo datasets!');
