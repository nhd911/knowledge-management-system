from fastapi import FastAPI
from database import connect_to_mongo, close_mongo_connection, create_indexes
from routes import auth

def create_application() -> FastAPI:
    application = FastAPI(title="Knowledge Management System", version="1.0.0")
    
    # Add startup and shutdown events
    @application.on_event("startup")
    async def startup_event():
        await connect_to_mongo()
        await create_indexes()
    
    @application.on_event("shutdown")
    async def shutdown_event():
        await close_mongo_connection()
    
    # Include routers
    application.include_router(auth.router)
    
    return application

app = create_application()
