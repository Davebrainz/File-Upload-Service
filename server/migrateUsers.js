import fs from 'fs/promises';
import { setUsers } from './postgresStore.js';

const usersFile = new URL('./users.json', import.meta.url);
const { users } = JSON.parse(await fs.readFile(usersFile, 'utf8'));

if (!Array.isArray(users)) {
  throw new Error('server/users.json does not contain a users array.');
}

await setUsers(users);
console.log(`Migrated ${users.length} user(s) to PostgreSQL.`);
