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
      const formDataToSend = new FormData()
      formDataToSend.append("file", file)
      formDataToSend.append("title", formData.title || file.name)

      const response = await fetch("http://localhost:8000/ai/analyze-file", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formDataToSend,
      })

      console.log(response);

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/")} className="hover:bg-accent/10">
              ← Back to Home
            </Button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Upload Document
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <Card className="border-2 shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-4 pb-8">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Upload className="h-6 w-6 text-accent" />
              </div>
              Share Your Knowledge
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              Upload a document to share with your team or organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <Alert variant="destructive" className="border-2">
                  <AlertDescription className="text-base">{error}</AlertDescription>
                </Alert>
              )}

              {/* File Upload */}
              <div className="space-y-3">
                <Label htmlFor="file" className="text-base font-medium">
                  Document File *
                </Label>
                {!file ? (
                  <div className="border-2 border-dashed border-accent/30 rounded-xl p-12 text-center bg-accent/5 hover:bg-accent/10 transition-colors">
                    <Upload className="h-16 w-16 mx-auto text-accent mb-6" />
                    <div className="space-y-4">
                      <p className="text-lg text-muted-foreground">Drag and drop your file here, or click to browse</p>
                      <p className="text-sm text-muted-foreground">Supports PDF, DOC, DOCX, PNG, JPG, GIF (max 10MB)</p>
                      <Input
                        id="file"
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif"
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={() => document.getElementById("file")?.click()}
                        className="border-2"
                      >
                        Choose File
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 rounded-xl p-6 bg-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-accent/10 rounded-lg">
                          <FileText className="h-8 w-8 text-accent" />
                        </div>
                        <div>
                          <p className="font-medium text-lg">{file.name}</p>
                          <p className="text-muted-foreground">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={analyzeWithAI}
                          disabled={aiLoading}
                          className="border-2 bg-transparent"
                        >
                          {aiLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4 mr-2" />
                          )}
                          {aiLoading ? "Analyzing..." : "AI Analyze"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={removeFile}
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* AI Suggestions */}
              {showAiSuggestions && aiAnalysis && (
                <Card className="border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-accent/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-accent/20 rounded-lg">
                        <Brain className="h-6 w-6 text-accent" />
                      </div>
                      AI Suggestions
                    </CardTitle>
                    <CardDescription className="text-base">
                      AI has analyzed your document and generated suggestions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {aiAnalysis.summary && (
                      <div className="space-y-2">
                        <Label className="text-base font-medium">Suggested Summary:</Label>
                        <p className="text-muted-foreground p-4 bg-background rounded-lg border-2 leading-relaxed">
                          {aiAnalysis.summary}
                        </p>
                      </div>
                    )}

                    {aiAnalysis.tags.length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-base font-medium">Suggested Tags:</Label>
                        <div className="flex flex-wrap gap-2">
                          {aiAnalysis.tags.map((tag, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="bg-accent/20 text-accent hover:bg-accent/30 text-sm px-3 py-1"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {aiAnalysis.extracted_text_preview && (
                      <div className="space-y-2">
                        <Label className="text-base font-medium">Extracted Content Preview:</Label>
                        <p className="text-sm text-muted-foreground p-4 bg-background rounded-lg border-2 max-h-32 overflow-y-auto leading-relaxed">
                          {aiAnalysis.extracted_text_preview}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Button type="button" onClick={applySuggestions} className="bg-accent hover:bg-accent/90">
                        <Wand2 className="h-4 w-4 mr-2" />
                        Apply Suggestions
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAiSuggestions(false)}
                        className="border-2"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Form Fields */}
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-3">
                  <Label htmlFor="title" className="text-base font-medium">
                    Title *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter document title"
                    className="h-12 text-base border-2 focus:border-accent"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="visibility" className="text-base font-medium">
                    Visibility *
                  </Label>
                  <Select
                    value={formData.visibility}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, visibility: value }))}
                  >
                    <SelectTrigger className="h-12 text-base border-2 focus:border-accent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VISIBILITY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-base">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="summary" className="text-base font-medium">
                  Summary
                </Label>
                <Textarea
                  id="summary"
                  value={formData.summary}
                  onChange={(e) => setFormData((prev) => ({ ...prev, summary: e.target.value }))}
                  placeholder="Brief description of the document content (optional)"
                  rows={4}
                  maxLength={500}
                  className="text-base border-2 focus:border-accent resize-none"
                />
                <p className="text-sm text-muted-foreground">{formData.summary.length}/500 characters</p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="tags" className="text-base font-medium">
                  Tags
                </Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                  placeholder="Enter tags separated by commas (e.g., react, tutorial, frontend)"
                  className="h-12 text-base border-2 focus:border-accent"
                />
                <p className="text-sm text-muted-foreground">Use tags to help others find your document</p>
              </div>

              {/* Upload Progress */}
              {loading && uploadProgress > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between text-base">
                    <span className="font-medium">Uploading...</span>
                    <span className="font-medium">{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-3" />
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/")}
                  disabled={loading}
                  className="border-2 h-12 text-base"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !file}
                  className="bg-accent hover:bg-accent/90 h-12 text-base font-medium"
                >
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
