
export default async function globalSetup() {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test-secret";
}
