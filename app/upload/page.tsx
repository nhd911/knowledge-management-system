"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, X, Sparkles, Wand2, Brain, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

const VISIBILITY_OPTIONS = [
  { value: "private", label: "Private - Only me" },
  { value: "group", label: "Group - My team only" },
  { value: "public", label: "Public - Everyone in company" },
]

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/gif",
]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

interface AIAnalysis {
  summary: string
  tags: string[]
  extracted_text_preview: string
  has_content: boolean
}

export default function UploadPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    tags: "",
    visibility: "private",
  })
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [showAiSuggestions, setShowAiSuggestions] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file type
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError("File type not supported. Please upload PDF, DOC, DOCX, or image files.")
      return
    }

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("File size exceeds 10MB limit.")
      return
    }

    setFile(selectedFile)
    setError("")
    setAiAnalysis(null)
    setShowAiSuggestions(false)
  }

  const analyzeWithAI = async () => {
    if (!file) return

    setAiLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      const formData = new FormData()
      formData.append("file", file)
      formData.append("title", formData.title || file.name)

      const response = await fetch("http://localhost:8000/ai/analyze-file", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (response.ok) {
        const analysis = await response.json()
        setAiAnalysis(analysis)
        setShowAiSuggestions(true)
      } else {
        const errorData = await response.json()
        setError(errorData.detail || "AI analysis failed")
      }
    } catch (err: any) {
      setError("AI analysis failed. Please try again.")
    } finally {
      setAiLoading(false)
    }
  }

  const applySuggestions = () => {
    if (!aiAnalysis) return

    setFormData((prev) => ({
      ...prev,
      summary: aiAnalysis.summary || prev.summary,
      tags: aiAnalysis.tags.join(", ") || prev.tags,
    }))
    setShowAiSuggestions(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError("Please select a file to upload.")
      return
    }

    setLoading(true)
    setUploadProgress(0)

    try {
      const token = localStorage.getItem("token")
      const formDataToSend = new FormData()

      formDataToSend.append("title", formData.title)
      formDataToSend.append("summary", formData.summary)
      formDataToSend.append("tags", formData.tags)
      formDataToSend.append("visibility", formData.visibility)
      formDataToSend.append("file", file)

      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100
          setUploadProgress(progress)
        }
      })

      const response = await new Promise<Response>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(new Response(xhr.responseText, { status: xhr.status }))
          } else {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`))
          }
        }
        xhr.onerror = () => reject(new Error("Network error"))

        xhr.open("POST", "http://localhost:8000/documents/upload")
        xhr.setRequestHeader("Authorization", `Bearer ${token}`)
        xhr.send(formDataToSend)
      })

      if (response.ok) {
        router.push("/")
      } else {
        const errorData = await response.json()
        setError(errorData.detail || "Upload failed")
      }
    } catch (err: any) {
      setError(err.message || "Upload failed")
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  const removeFile = () => {
    setFile(null)
    setError("")
    setAiAnalysis(null)
    setShowAiSuggestions(false)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/")}>
              ← Back to Home
            </Button>
            <h1 className="text-2xl font-bold">Upload Document</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Share Your Knowledge
            </CardTitle>
            <CardDescription>Upload a document to share with your team or organization</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="file">Document File *</Label>
                {!file ? (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Drag and drop your file here, or click to browse</p>
                      <p className="text-xs text-muted-foreground">Supports PDF, DOC, DOCX, PNG, JPG, GIF (max 10MB)</p>
                      <Input
                        id="file"
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif"
                        className="hidden"
                      />
                      <Button type="button" variant="outline" onClick={() => document.getElementById("file")?.click()}>
                        Choose File
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={analyzeWithAI} disabled={aiLoading}>
                          {aiLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4 mr-2" />
                          )}
                          {aiLoading ? "Analyzing..." : "AI Analyze"}
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={removeFile}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* AI Suggestions */}
              {showAiSuggestions && aiAnalysis && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Brain className="h-5 w-5 text-primary" />
                      AI Suggestions
                    </CardTitle>
                    <CardDescription>AI has analyzed your document and generated suggestions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {aiAnalysis.summary && (
                      <div>
                        <Label className="text-sm font-medium">Suggested Summary:</Label>
                        <p className="text-sm text-muted-foreground mt-1 p-3 bg-background rounded border">
                          {aiAnalysis.summary}
                        </p>
                      </div>
                    )}

                    {aiAnalysis.tags.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Suggested Tags:</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {aiAnalysis.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {aiAnalysis.extracted_text_preview && (
                      <div>
                        <Label className="text-sm font-medium">Extracted Content Preview:</Label>
                        <p className="text-xs text-muted-foreground mt-1 p-3 bg-background rounded border max-h-20 overflow-y-auto">
                          {aiAnalysis.extracted_text_preview}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button type="button" onClick={applySuggestions} size="sm">
                        <Wand2 className="h-4 w-4 mr-2" />
                        Apply Suggestions
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowAiSuggestions(false)} size="sm">
                        Dismiss
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter document title"
                  required
                />
              </div>

              {/* Summary */}
              <div className="space-y-2">
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  value={formData.summary}
                  onChange={(e) => setFormData((prev) => ({ ...prev, summary: e.target.value }))}
                  placeholder="Brief description of the document content (optional)"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">{formData.summary.length}/500 characters</p>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                  placeholder="Enter tags separated by commas (e.g., react, tutorial, frontend)"
                />
                <p className="text-xs text-muted-foreground">Use tags to help others find your document</p>
              </div>

              {/* Visibility */}
              <div className="space-y-2">
                <Label htmlFor="visibility">Visibility *</Label>
                <Select
                  value={formData.visibility}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, visibility: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VISIBILITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Upload Progress */}
              {loading && uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => router.push("/")} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !file}>
                  {loading ? "Uploading..." : "Upload Document"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
