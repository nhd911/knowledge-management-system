# Knowledge Management System

A comprehensive knowledge sharing platform that helps organizations centralize, manage, and discover documents across departments. Built with FastAPI, MongoDB, React, and TailwindCSS.

## 🚀 Features

### Core Features
- **User Authentication**: Secure JWT-based login/logout system
- **Document Management**: Upload, view, edit, and delete documents (PDF, DOC, images up to 10MB)
- **Advanced Search**: Full-text search with filtering by tags, date, group, and visibility
- **Document Viewer**: Interactive document preview with rating system
- **Permission Control**: Public/private document visibility with group-based access

### AI-Powered Features
- **Auto-Summarization**: AI-generated document summaries (up to 500 words)
- **Smart Tagging**: Automatic tag generation based on document content
- **Content Analysis**: Intelligent text extraction from various file formats

### User Experience
- **Responsive Design**: Mobile-first design with TailwindCSS
- **Real-time Updates**: Live search results and document interactions
- **Drag & Drop Upload**: Intuitive file upload with progress tracking
- **Star Ratings**: Community-driven document quality assessment

## 🛠 Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **MongoDB**: NoSQL database with Motor async driver
- **JWT Authentication**: Secure token-based authentication
- **OpenAI API**: AI-powered document analysis
- **Python Libraries**: PyPDF2, python-docx, Pillow for file processing

### Frontend
- **React 18**: Modern React with hooks and context
- **Next.js**: Full-stack React framework
- **TailwindCSS**: Utility-first CSS framework
- **TypeScript**: Type-safe JavaScript development

### Infrastructure
- **Docker**: Containerized deployment
- **Docker Compose**: Multi-service orchestration

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+
- **MongoDB** 4.4+
- **Docker** and Docker Compose (optional)

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

1. **Clone the repository**
\`\`\`bash
git clone <repository-url>
cd knowledge-management-system
\`\`\`

2. **Set up environment variables**
\`\`\`bash
# Copy backend environment template
cp backend/.env.example backend/.env

# Edit backend/.env with your configuration:
# MONGODB_URL=mongodb://mongodb:27017/knowledge_db
# JWT_SECRET_KEY=your-super-secret-jwt-key
# OPENAI_API_KEY=your-openai-api-key
\`\`\`

3. **Start all services**
\`\`\`bash
docker-compose up -d
\`\`\`

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Option 2: Manual Setup

#### Backend Setup

1. **Navigate to backend directory**
\`\`\`bash
cd backend
\`\`\`

2. **Create virtual environment**
\`\`\`bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
\`\`\`

3. **Install dependencies**
\`\`\`bash
pip install -r requirements.txt
\`\`\`

4. **Set up environment variables**
\`\`\`bash
cp .env.example .env
# Edit .env with your MongoDB URL, JWT secret, and OpenAI API key
\`\`\`

5. **Start MongoDB** (if not using Docker)
\`\`\`bash
mongod --dbpath /path/to/your/db
\`\`\`

6. **Run the backend**
\`\`\`bash
python startup.py
\`\`\`

#### Frontend Setup

1. **Navigate to project root**
\`\`\`bash
cd ..
\`\`\`

2. **Install dependencies**
\`\`\`bash
npm install
\`\`\`

3. **Start development server**
\`\`\`bash
npm run dev
\`\`\`

## 📁 Project Structure

\`\`\`
knowledge-management-system/
├── backend/                    # FastAPI backend
│   ├── routes/                # API route handlers
│   │   ├── auth.py           # Authentication endpoints
│   │   ├── documents.py      # Document CRUD operations
│   │   ├── ratings.py        # Rating system
│   │   └── ai.py             # AI integration endpoints
│   ├── services/             # Business logic services
│   │   └── ai_service.py     # AI processing service
│   ├── models.py             # Pydantic data models
│   ├── database.py           # MongoDB connection
│   ├── auth.py               # JWT authentication utilities
│   ├── main.py               # FastAPI application
│   └── requirements.txt      # Python dependencies
├── app/                      # Next.js frontend
│   ├── login/               # Authentication pages
│   ├── register/
│   ├── upload/              # Document upload
│   ├── search/              # Search interface
│   └── document/[id]/       # Document viewer
├── components/              # Reusable React components
│   ├── star-rating.tsx     # Rating component
│   └── ai-suggestions.tsx  # AI features component
├── contexts/               # React context providers
│   └── auth-context.tsx   # Authentication state
└── docker-compose.yml     # Multi-service deployment
\`\`\`

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
\`\`\`env
MONGODB_URL=mongodb://localhost:27017/knowledge_db
JWT_SECRET_KEY=your-super-secret-jwt-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
OPENAI_API_KEY=your-openai-api-key-here
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760  # 10MB in bytes
\`\`\`

#### Frontend
The frontend automatically connects to the backend at `http://localhost:8000`. For production, update the API base URL in the frontend code.

## 📖 API Documentation

### Authentication Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user info

### Document Endpoints
- `GET /documents/` - List documents with filtering
- `POST /documents/` - Upload new document
- `GET /documents/{id}` - Get document details
- `PUT /documents/{id}` - Update document
- `DELETE /documents/{id}` - Delete document
- `GET /documents/search` - Advanced search

### Rating Endpoints
- `POST /ratings/` - Rate a document
- `GET /ratings/document/{document_id}` - Get document ratings

### AI Endpoints
- `POST /ai/summarize` - Generate document summary
- `POST /ai/generate-tags` - Generate document tags

Visit `http://localhost:8000/docs` for interactive API documentation.

## 🎯 Usage Guide

### Getting Started
1. **Register**: Create a new account at `/register`
2. **Login**: Sign in to access the platform
3. **Upload Documents**: Use the upload page to add documents with AI-powered suggestions
4. **Search & Discover**: Find documents using the advanced search with filters
5. **Rate & Review**: Help the community by rating document quality

### Document Management
- **Upload**: Drag & drop files or click to browse (PDF, DOC, images up to 10MB)
- **AI Features**: Enable auto-summarization and tag generation during upload
- **Visibility**: Set documents as public, private, or group-specific
- **Organization**: Use tags and groups for better categorization

### Search Features
- **Text Search**: Search in titles, summaries, and content
- **Filters**: Filter by tags, date range, group, and visibility
- **Sorting**: Sort by relevance, date, or rating
- **Pagination**: Navigate through large result sets

## 🚀 Deployment

### Production Deployment

1. **Update environment variables** for production
2. **Build frontend**
\`\`\`bash
npm run build
\`\`\`

3. **Deploy with Docker Compose**
\`\`\`bash
docker-compose -f docker-compose.prod.yml up -d
\`\`\`

### Scaling Considerations
- Use MongoDB Atlas for managed database
- Implement Redis for caching
- Use CDN for file storage
- Set up load balancing for multiple backend instances

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `/docs`
- Review the project structure and configuration

## 🔮 Future Enhancements

- **Advanced Security**: Role-based access control (RBAC)
- **Real-time Collaboration**: Document commenting and collaboration
- **Analytics Dashboard**: Usage statistics and insights
- **Mobile App**: Native mobile applications
- **Integration APIs**: Third-party service integrations
- **Advanced AI**: Document similarity and recommendation engine
