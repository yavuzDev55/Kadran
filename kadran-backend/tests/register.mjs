// Test bootstrap: `node --import ./tests/register.mjs --test tests/`
// Swaps src/config/database.js for an in-memory fake, so the real services and db modules can
// be exercised without PostgreSQL or the Prisma query engine.
import { register } from 'node:module';

register('./helpers/fakeDbHooks.mjs', import.meta.url);
