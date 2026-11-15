// FinRescue X — In-memory JSON database with file persistence
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

export interface DB {
  users: any[];
  merchants: any[];
  applications: any[];
  applicationEvents: any[];
  documents: any[];
  documentVerifications: any[];
  documentExtractions: any[];
  crossDocumentVerifications: any[];
  preflightReports: any[];
  validationReports: any[];
  loanOffers: any[];
  kycSessions: any[];
  bankVerifications: any[];
  consents: any[];
  activeLoans: any[];
  repaymentTransactions: any[];
  recoveryActions: any[];
  rootCauseReports: any[];
  supportTickets: any[];
  callbackRequests: any[];
  chatMessages: any[];
  partners: any[];
  partnerTelemetry: any[];
  experimentAssignments: any[];
  recoveryExperiments: any[];
  auditLogs: any[];
}

const emptyDB: DB = {
  users: [],
  merchants: [],
  applications: [],
  applicationEvents: [],
  documents: [],
  documentVerifications: [],
  documentExtractions: [],
  crossDocumentVerifications: [],
  preflightReports: [],
  validationReports: [],
  loanOffers: [],
  kycSessions: [],
  bankVerifications: [],
  consents: [],
  activeLoans: [],
  repaymentTransactions: [],
  recoveryActions: [],
  rootCauseReports: [],
  supportTickets: [],
  callbackRequests: [],
  chatMessages: [],
  partners: [],
  partnerTelemetry: [],
  experimentAssignments: [],
  recoveryExperiments: [],
  auditLogs: [],
};

let db: DB = { ...emptyDB };

export function getDB(): DB {
  return db;
}

export function loadDB(): void {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      db = { ...emptyDB, ...JSON.parse(raw) };
      console.log('[DB] Loaded from', DB_PATH);
    } else {
      console.log('[DB] No existing database found, will seed.');
    }
  } catch (e) {
    console.error('[DB] Failed to load database, starting fresh:', e);
    db = { ...emptyDB };
  }
}

export function saveDB(): void {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error('[DB] Failed to save:', e);
  }
}

export function resetDB(seedData: DB): void {
  db = seedData;
  saveDB();
}

export function addRecord(collection: keyof DB, record: any): void {
  (db[collection] as any[]).push(record);
  saveDB();
}

export function updateRecord(collection: keyof DB, id: string, updates: any): any {
  const arr = db[collection] as any[];
  const idx = arr.findIndex((r: any) => r.id === id);
  if (idx === -1) return null;
  arr[idx] = { ...arr[idx], ...updates, updatedAt: new Date().toISOString() };
  saveDB();
  return arr[idx];
}

export function findById(collection: keyof DB, id: string): any {
  let found = (db[collection] as any[]).find((r: any) => r.id === id) || null;
  if (!found && collection === 'documents' && db.applications) {
    for (const app of db.applications) {
      if (app.documents && Array.isArray(app.documents)) {
        const docInApp = app.documents.find((d: any) => d.id === id);
        if (docInApp) {
          (db.documents as any[]).push(docInApp);
          saveDB();
          return docInApp;
        }
      }
    }
  }
  return found;
}

export function findMany(collection: keyof DB, filter?: (r: any) => boolean): any[] {
  if (collection === 'documents' && db.applications) {
    for (const app of db.applications) {
      if (app.documents && Array.isArray(app.documents)) {
        for (const d of app.documents) {
          if (!(db.documents as any[]).some((existing: any) => existing.id === d.id)) {
            (db.documents as any[]).push(d);
          }
        }
      }
    }
  }
  const arr = db[collection] as any[];
  return filter ? arr.filter(filter) : arr;
}

export function deleteRecord(collection: keyof DB, id: string): boolean {
  const arr = db[collection] as any[];
  const idx = arr.findIndex((r: any) => r.id === id);
  if (idx === -1) return false;
  arr.splice(idx, 1);
  saveDB();
  return true;
}
