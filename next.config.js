/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix workspace root warning
  outputFileTracingRoot: '/Users/pgunarathn/Documents/maturity',
  env: {
    JWT_SECRET: process.env.JWT_SECRET,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,
  },
  // Removed rewrites to use local API routes instead of proxying
};

module.exports = nextConfig;