
# Project Deployment Guide

## Prerequisites
- Node.js (v22 or higher)
- PM2 (installed globally)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```
   Or unzip the files

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install PM2 globally if not already installed:
   ```bash
   npm install -g pm2
   ```

## Configuration

1. Create a `.env` file based on the provided example:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file to configure your environment variables

## Database Migration

1. Run the database migration:
   ```bash
   npm run db:migrate
   ```
2. Push the migration to the database:
   ```bash
   npm run db:push
   ```

## Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the application with PM2:
   ```bash
   pm2 start dist/index.js --name "qemo-backend" --node-args="--env-file=.env"
   ```

3. Monitor the application:
   ```bash
   pm2 logs qemo-backend
   ```

4. To ensure the application starts on system reboot:
   ```bash
   pm2 save
   pm2 startup
   ```

## Troubleshooting

- If you encounter worker thread errors, ensure the paths to worker scripts are correct
- Check PM2 logs for any error messages: `pm2 logs qemo-backend`

