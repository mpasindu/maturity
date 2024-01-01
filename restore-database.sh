#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Starting Database Restore...${NC}"

# Check if docker-compose is running
if ! docker ps | grep -q maturity-postgres; then
    echo -e "${YELLOW}📦 Starting Docker Compose...${NC}"
    docker-compose up -d
    sleep 10
fi

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
until docker exec maturity-postgres pg_isready -U postgres > /dev/null 2>&1; do
    sleep 2
done

echo -e "${GREEN}✓ PostgreSQL is ready${NC}"

# Check if dump file exists
if [ ! -f "./maturity_db_backup.dump" ]; then
    echo -e "${RED}✗ Database dump file not found: maturity_db_backup.dump${NC}"
    exit 1
fi

echo -e "${YELLOW}📥 Restoring database from dump...${NC}"

# Restore the database
docker exec -i maturity-postgres pg_restore \
  --username postgres \
  --dbname maturity_assessment \
  --verbose \
  --no-owner \
  --no-privileges < ./maturity_db_backup.dump

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database restored successfully${NC}"
    
    # Verify
    echo -e "${YELLOW}🔍 Verifying database...${NC}"
    docker exec maturity-postgres psql -U postgres -d maturity_assessment -c "SELECT count(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';"
else
    echo -e "${RED}✗ Database restore failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Database restore complete!${NC}"
