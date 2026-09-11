import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// mongodb-memory-server's own postinstall (which downloads a pinned MongoDB
// build) is blocked by this repo's npm install-scripts allowlist, so point it
// at the mongod already installed on the machine instead of fetching one.
const SYSTEM_MONGOD = process.env.MONGOD_PATH || "/usr/local/bin/mongod";

let mongod;

export async function connectTestDb() {
  mongod = await MongoMemoryServer.create({
    binary: { systemBinary: SYSTEM_MONGOD },
  });
  await mongoose.connect(mongod.getUri());
}

export async function disconnectTestDb() {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

export async function clearTestDb() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

/** Bare-bones req/res doubles for calling controller handlers directly. */
export function mockRes() {
  const res = {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

export function mockReq({ user, params, body, query, file } = {}) {
  return { user, params: params || {}, body: body || {}, query: query || {}, file };
}
