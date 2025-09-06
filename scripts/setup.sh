#!/bin/bash

# Database setup script for Knowledge Management System
echo "🚀 Setting up Knowledge Management System Database"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed"
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first."
    echo "   Docker: docker-compose up -d mongodb"
    echo "   Local: sudo systemctl start mongod"
    exit 1
fi

echo "✅ MongoDB is running"

# Set environment variables if not set
export MONGODB_URL=${MONGODB_URL:-"mongodb://localhost:27017"}
export DATABASE_NAME=${DATABASE_NAME:-"knowledge_management"}

echo "🔗 Using MongoDB URL: $MONGODB_URL"
echo "📊 Database name: $DATABASE_NAME"

# Initialize database
echo "📁 Initializing database collections and indexes..."
python3 scripts/init_database.py

if [ $? -eq 0 ]; then
    echo "✅ Database initialization completed"
    
    # Ask if user wants to seed test data
    read -p "🌱 Do you want to seed the database with test data? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🌱 Seeding database with test data..."
        python3 scripts/seed_data.py
        
        if [ $? -eq 0 ]; then
            echo "✅ Database seeding completed"
            echo ""
            echo "🎉 Setup completed successfully!"
            echo "📋 You can now start the application:"
            echo "   Backend: cd backend && uvicorn main:app --reload"
            echo "   Frontend: npm run dev"
        else
            echo "❌ Database seeding failed"
            exit 1
        fi
    else
        echo "⏭️  Skipping test data seeding"
        echo "✅ Setup completed!"
    fi
else
    echo "❌ Database initialization failed"
    exit 1
fi
