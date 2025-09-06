"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Star,
  Download,
  Edit,
  Trash2,
  Calendar,
  User,
  Tag,
  Globe,
  Users,
  Lock,
  FileText,
  ImageIcon,
  File,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

// 👉 Markdown render
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Document {
  id: string
  title: string
  summary: string
  tags: string[]
  visibility: string
  owner_id: string
  owner_name: string
  file_path: string
  file_type: string
  file_size: number
  created_at: string
  updated_at: string
  average_rating: number
  rating_count: number
}

export default function DocumentViewPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const documentId = params.id as string

  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [userRating, setUserRating] = useState<number | null>(null)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: "",
    summary: "",
    tags: "",
    visibility: "",
  })

  useEffect(() => {
    if (user && documentId) {
      fetchDocument()
      fetchUserRating()
    }
  }, [user, documentId])

  const fetchDocument = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:8000/documents/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setDocument(data)
        setEditForm({
          title: data.title,
          summary: data.summary || "",
          tags: data.tags.join(", "),
          visibility: data.visibility,
        })
      } else if (response.status === 404) {
        setError("Document not found")
      } else if (response.status === 403) {
        setError("You do not have permission to view this document")
      } else {
        setError("Failed to load document")
      }
    } catch (err) {
      setError("Failed to load document")
    } finally {
      setLoading(false)
    }
  }

  const fetchUserRating = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:8000/ratings/documents/${documentId}/my-rating`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setUserRating(data.rating)
      }
    } catch (err) {
      console.error("Failed to fetch user rating:", err)
    }
  }

  const handleRating = async (rating: number) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:8000/ratings/documents/${documentId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating }),
      })

      if (response.ok) {
        setUserRating(rating)
        // Refresh document to get updated rating
        fetchDocument()
      }
    } catch (err) {
      console.error("Failed to rate document:", err)
    }
  }

  const handleEdit = async () => {
    try {
      const token = localStorage.getItem("token")
      const formData = new FormData()
      formData.append("title", editForm.title)
      formData.append("summary", editForm.summary)
      formData.append("tags", editForm.tags)
      formData.append("visibility", editForm.visibility)

      const response = await fetch(`http://localhost:8000/documents/${documentId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (response.ok) {
        setIsEditing(false)
        fetchDocument()
      } else {
        setError("Failed to update document")
      }
    } catch (err) {
      setError("Failed to update document")
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
      return
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:8000/documents/${documentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        router.push("/")
      } else {
        setError("Failed to delete document")
      }
    } catch (err) {
      setError("Failed to delete document")
    }
  }

  const handleDownload = () => {
    const token = localStorage.getItem("token")
    const downloadUrl = `http://localhost:8000/documents/${documentId}/download`

    // Create a temporary link to trigger download
    const link = document.createElement("a")
    link.href = downloadUrl
    link.setAttribute("Authorization", `Bearer ${token}`)
    link.download = document?.title || "document"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "public":
        return <Globe className="h-4 w-4" />
      case "group":
        return <Users className="h-4 w-4" />
      case "private":
        return <Lock className="h-4 w-4" />
      default:
        return <Globe className="h-4 w-4" />
    }
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "pdf":
        return <FileText className="h-8 w-8 text-red-500" />
      case "image":
        return <ImageIcon className="h-8 w-8 text-blue-500" />
      default:
        return <File className="h-8 w-8 text-gray-500" />
    }
  }

  const renderStars = (rating: number, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= (interactive ? hoverRating || userRating || 0 : rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            } ${interactive ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
            onClick={interactive ? () => handleRating(star) : undefined}
            onMouseEnter={interactive ? () => setHoverRating(star) : undefined}
            onMouseLeave={interactive ? () => setHoverRating(null) : undefined}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" onClick={() => router.push("/")}>
              ← Back to Home
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </main>
      </div>
    )
  }

  if (!document) return null

  const isOwner = user?.id === document.owner_id

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.push("/")}>
              ← Back to Home
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              {isOwner && (
                <>
                  <Dialog open={isEditing} onOpenChange={setIsEditing}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Edit Document</DialogTitle>
                        <DialogDescription>Update your document information</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-title">Title</Label>
                          <Input
                            id="edit-title"
                            value={editForm.title}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-summary">Summary</Label>
                          <Textarea
                            id="edit-summary"
                            value={editForm.summary}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, summary: e.target.value }))}
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-tags">Tags</Label>
                          <Input
                            id="edit-tags"
                            value={editForm.tags}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, tags: e.target.value }))}
                            placeholder="Separate tags with commas"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-visibility">Visibility</Label>
                          <Select
                            value={editForm.visibility}
                            onValueChange={(value) => setEditForm((prev) => ({ ...prev, visibility: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="private">Private - Only me</SelectItem>
                              <SelectItem value="group">Group - My team only</SelectItem>
                              <SelectItem value="public">Public - Everyone in company</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setIsEditing(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleEdit}>Save Changes</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="destructive" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6">
          {/* Document Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-2xl">{document.title}</CardTitle>
                  <CardDescription className="flex items-center gap-4 text-base">
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {document.owner_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(document.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      {getVisibilityIcon(document.visibility)}
                      {document.visibility.charAt(0).toUpperCase() + document.visibility.slice(1)}
                    </span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {renderStars(document.average_rating)}
                  <span className="text-sm text-muted-foreground">
                    ({document.rating_count} rating{document.rating_count !== 1 ? "s" : ""})
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* ✅ Render Markdown Summary */}
              {document.summary && (
                <div className="prose prose-sm max-w-none mb-4 text-muted-foreground">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {document.summary}
                  </ReactMarkdown>
                </div>
              )}              
              <div className="flex flex-wrap gap-2">
                {document.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* File Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getFileIcon(document.file_type)}
                File Preview
              </CardTitle>
              <CardDescription>
                {document.file_type.toUpperCase()} • {formatFileSize(document.file_size)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-8 bg-muted/50 text-center">
                {document.file_type === "image" ? (
                  <img
                    src={`http://localhost:8000/${document.file_path}`}
                    alt={document.title}
                    className="max-w-full max-h-96 mx-auto rounded-lg"
                  />
                ) : document.file_type === "pdf" ? (
                  <div className="space-y-4">
                    <FileText className="h-16 w-16 mx-auto text-red-500" />
                    <p className="text-muted-foreground">PDF preview not available. Click download to view the file.</p>
                    <Button onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <File className="h-16 w-16 mx-auto text-gray-500" />
                    <p className="text-muted-foreground">
                      File preview not available. Click download to view the file.
                    </p>
                    <Button onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rating Section */}
          <Card>
            <CardHeader>
              <CardTitle>Rate this Document</CardTitle>
              <CardDescription>Help others by rating the quality and usefulness of this document</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Your rating:</span>
                  {renderStars(userRating || 0, true)}
                </div>
                {userRating && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Remove rating logic would go here
                      setUserRating(null)
                    }}
                  >
                    Remove Rating
                  </Button>
                )}
              </div>
              <Separator className="my-4" />
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Average rating:</span>
                  {renderStars(document.average_rating)}
                  <span className="text-sm text-muted-foreground">{document.average_rating.toFixed(1)} out of 5</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  Based on {document.rating_count} rating{document.rating_count !== 1 ? "s" : ""}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Document Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Document Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm text-muted-foreground">{formatDate(document.created_at)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Updated</Label>
                  <p className="text-sm text-muted-foreground">{formatDate(document.updated_at)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">File Type</Label>
                  <p className="text-sm text-muted-foreground">{document.file_type.toUpperCase()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">File Size</Label>
                  <p className="text-sm text-muted-foreground">{formatFileSize(document.file_size)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
