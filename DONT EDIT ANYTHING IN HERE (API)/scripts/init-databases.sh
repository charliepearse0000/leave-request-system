#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🗄️ Initializing databases..."

# Function to create database if it doesn't exist
create_database_if_not_exists() {
    local db_name=$1
    
    # Check if database exists using a more reliable method
    if psql -U "$POSTGRES_USER" -tc "SELECT 1 FROM pg_database WHERE datname = '$db_name'" | grep -q 1; then
        echo "⚠️ Database '$db_name' already exists, skipping creation"
        return 0
    else
        echo "📝 Creating database '$db_name'..."
        # Use psql instead of createdb for better error handling
        psql -U "$POSTGRES_USER" -c "CREATE DATABASE \"$db_name\";" 2>/dev/null
        
        if [ $? -eq 0 ]; then
            echo "✅ Database '$db_name' created successfully"
        else
            # Check again if it exists (might have been created by another process)
            if psql -U "$POSTGRES_USER" -tc "SELECT 1 FROM pg_database WHERE datname = '$db_name'" | grep -q 1; then
                echo "⚠️ Database '$db_name' already exists (created by another process)"
                return 0
            else
                echo "❌ Failed to create database '$db_name'"
                return 1
            fi
        fi
    fi
}

# Create databases
create_database_if_not_exists "leave_management"
if [ $? -ne 0 ]; then
    echo "❌ Failed to create leave_management database"
    exit 1
fi

create_database_if_not_exists "leave_management_test"
if [ $? -ne 0 ]; then
    echo "❌ Failed to create leave_management_test database"
    exit 1
fi

# Grant privileges (optional, since postgres is superuser)
echo "🔐 Setting up database permissions..."
psql -U "$POSTGRES_USER" -c "GRANT ALL PRIVILEGES ON DATABASE leave_management TO $POSTGRES_USER;" 2>/dev/null || true
psql -U "$POSTGRES_USER" -c "GRANT ALL PRIVILEGES ON DATABASE leave_management_test TO $POSTGRES_USER;" 2>/dev/null || true

echo "✅ Database initialization completed!" 