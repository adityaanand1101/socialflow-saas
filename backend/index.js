"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const svix_1 = require("svix");
const client_1 = require("@prisma/client");
const clerk_sdk_node_1 = require("@clerk/clerk-sdk-node");
dotenv_1.default.config();
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT || 3001;
// Middlewares
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
// Webhook endpoint needs raw body for svix signature verification
app.post('/api/webhooks/clerk', express_1.default.raw({ type: 'application/json' }), async (req, res) => {
    const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    if (!SIGNING_SECRET) {
        throw new Error('Error: Please add CLERK_WEBHOOK_SECRET to .env');
    }
    const payload = req.body.toString();
    const headers = req.headers;
    const svix_id = headers['svix-id'];
    const svix_timestamp = headers['svix-timestamp'];
    const svix_signature = headers['svix-signature'];
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return res.status(400).json({ error: 'Error occured -- no svix headers' });
    }
    const wh = new svix_1.Webhook(SIGNING_SECRET);
    let evt;
    try {
        evt = wh.verify(payload, {
            'svix-id': svix_id,
            'svix-timestamp': svix_timestamp,
            'svix-signature': svix_signature,
        });
    }
    catch (err) {
        console.error('Error verifying webhook:', err.message);
        return res.status(400).json({ error: err.message });
    }
    const { id } = evt.data;
    const eventType = evt.type;
    if (eventType === 'user.created') {
        const { id: clerkId, email_addresses, first_name, last_name, image_url } = evt.data;
        const email = email_addresses[0]?.email_address;
        const name = `${first_name || ''} ${last_name || ''}`.trim();
        try {
            // Create user
            const user = await prisma.user.create({
                data: {
                    clerkId,
                    email,
                    name,
                    avatarUrl: image_url,
                },
            });
            // Automatically create a default personal Workspace
            const workspace = await prisma.workspace.create({
                data: {
                    name: `${name}'s Workspace`,
                    slug: `workspace-${user.id}`,
                },
            });
            // Add user to workspace as OWNER
            await prisma.workspaceMember.create({
                data: {
                    userId: user.id,
                    workspaceId: workspace.id,
                    role: 'OWNER',
                },
            });
            console.log(`User ${user.id} and default workspace created`);
        }
        catch (error) {
            console.error('Error creating user/workspace:', error);
            return res.status(500).json({ error: 'Failed to create user/workspace' });
        }
    }
    else if (eventType === 'user.updated') {
        const { id: clerkId, email_addresses, first_name, last_name, image_url } = evt.data;
        const email = email_addresses[0]?.email_address;
        const name = `${first_name || ''} ${last_name || ''}`.trim();
        try {
            await prisma.user.update({
                where: { clerkId },
                data: {
                    email,
                    name,
                    avatarUrl: image_url,
                },
            });
            console.log(`User ${clerkId} updated`);
        }
        catch (error) {
            console.error('Error updating user:', error);
            return res.status(500).json({ error: 'Failed to update user' });
        }
    }
    else if (eventType === 'user.deleted') {
        const { id: clerkId } = evt.data;
        try {
            await prisma.user.delete({
                where: { clerkId },
            });
            console.log(`User ${clerkId} deleted`);
        }
        catch (error) {
            console.error('Error deleting user:', error);
            return res.status(500).json({ error: 'Failed to delete user' });
        }
    }
    res.status(200).json({ success: true });
});
// Use JSON body parser for all other routes
app.use(express_1.default.json());
// User Profile Management Routes
app.get('/api/user/me', (0, clerk_sdk_node_1.ClerkExpressRequireAuth)(), async (req, res) => {
    const clerkId = req.auth.userId;
    try {
        const user = await prisma.user.findUnique({
            where: { clerkId },
            include: {
                memberships: {
                    include: {
                        workspace: true
                    }
                }
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.patch('/api/user/me', (0, clerk_sdk_node_1.ClerkExpressRequireAuth)(), async (req, res) => {
    const clerkId = req.auth.userId;
    const { name, avatarUrl } = req.body;
    try {
        const user = await prisma.user.update({
            where: { clerkId },
            data: {
                name,
                avatarUrl,
            },
        });
        // Note: Reflecting back to Clerk via SDK would go here if needed,
        // usually using Clerk's backend SDK: clerkClient.users.updateUser(clerkId, { firstName, ... })
        res.json(user);
    }
    catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map