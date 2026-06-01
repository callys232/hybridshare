# Contributing to HybridShare

## How to add a new Connector

1. Create a new file in the appropriate category folder:
   ```
   apps/api/src/connectors/{cloud|database|crm|custom}/myconnector.connector.ts
   ```

2. Extend `BaseConnector` and implement all required methods:
   ```typescript
   export class MyConnector extends BaseConnector {
     readonly id = 'my-connector';
     readonly name = 'My Connector';
     readonly type = ConnectorType.MY_TYPE;  // add to enum in shared/types/connector.ts
     readonly category = ConnectorCategory.CLOUD;

     async connect(credentials) { /* ... */ }
     async disconnect() { /* ... */ }
     async testConnection() { /* ... */ }
     async listAssets(path?, options?) { /* ... */ }
     async getAsset(id) { /* ... */ }
     async searchAssets(query) { /* ... */ }
     async fetchContent(id) { /* ... */ }
     async pushContent(id, content) { /* ... */ }
     async deleteAsset(id) { /* ... */ }
     async getChanges(since) { /* ... */ }
   }
   ```

3. Register it in `connector.registry.ts`:
   ```typescript
   import { MyConnector } from './cloud/myconnector.connector';
   registry.set(ConnectorType.MY_TYPE, () => new MyConnector());
   ```

4. Add metadata to `CONNECTOR_METADATA` in `connector.registry.ts`.

5. Add credential fields to the `credentialFields` map in `ConnectorSetup.tsx`.

---

## How to add a new API route

1. Create the route file in `apps/api/src/routes/`:
   ```typescript
   // apps/api/src/routes/myresource.routes.ts
   import { Router } from 'express';
   const router = Router();
   router.use(authMiddleware);
   router.get('/', async (req, res) => { /* ... */ });
   export { router as myResourceRouter };
   ```

2. Register it in `apps/api/src/app.ts`:
   ```typescript
   app.use('/api/my-resource', async (req, res, next) => {
     const { myResourceRouter } = await import('./routes/myresource.routes');
     myResourceRouter(req, res, next);
   });
   ```

3. If you need a controller/service pattern, add them in the corresponding `controllers/` and `services/` folders.

4. Add validation schemas to `packages/shared/schemas/` if inputs are reused on the frontend.

---

## How to add a new frontend page

1. Create the page file under `apps/web/app/(dashboard)/`:
   ```typescript
   // apps/web/app/(dashboard)/my-page/page.tsx
   'use client';
   export default function MyPage() {
     return <div>My Page</div>;
   }
   ```

2. Add a nav item to `Sidebar.tsx`:
   ```typescript
   { href: '/my-page', label: 'My Page', icon: <MyIcon /> }
   ```

3. If the page needs global state, add a Zustand store in `apps/web/store/`:
   ```typescript
   // apps/web/store/myresource.store.ts
   import { create } from 'zustand';
   export const useMyResourceStore = create((set) => ({ /* ... */ }));
   ```

4. Add mock fallback data in `apps/web/mock/mockfile.ts` for when the API is unavailable.

5. Wrap all API calls with try/catch and fall back to mock data:
   ```typescript
   try {
     const r = await api.get('/my-resource');
     setData(r.data.data);
   } catch {
     setData(MOCK_MY_DATA);
   }
   ```
