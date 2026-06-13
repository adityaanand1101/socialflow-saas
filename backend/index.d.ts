import { StrictAuthProp } from '@clerk/clerk-sdk-node';
declare global {
    namespace Express {
        interface Request extends StrictAuthProp {
        }
    }
}
//# sourceMappingURL=index.d.ts.map