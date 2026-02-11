import {
  Account,
  Client,
  Databases,
  ExecutionMethod,
  Functions,
  ID,
  Permission,
  Query,
  Role,
  Storage,
} from "appwrite";
import env, { getMissingCriticalEnv } from "../env";

const client = new Client();

if (env.appwrite.endpoint) {
  client.setEndpoint(env.appwrite.endpoint);
}

if (env.appwrite.projectId) {
  client.setProject(env.appwrite.projectId);
}

export const ensureAppwriteConfigured = () => {
  const missing = getMissingCriticalEnv();
  if (missing.length > 0) {
    throw new Error(
      `Configura variables Appwrite faltantes: ${missing.join(", ")}`
    );
  }
};

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

export { client, ID, Query, Permission, Role, ExecutionMethod };
