"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, FileText, Clock, TrendingUp, LogOut } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface Document {
  id: string
  title: string
  summary: string
  tags: string[]
  owner_name: string
  created_at: string
  average_rating: number
  rating_count: number
}

export default function HomePage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [documents, setDocuments] = useState({
    latest: [] as Document[],
    popular: [] as Document[],
    myDocuments: [] as Document[],
  })
  const [loadingDocs, setLoadingDocs] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchDocuments()
    }
  }, [user])

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem("token")
      const headers = {
        Authorization: `Bearer ${token}`,
      }

      const [latestRes, popularRes, myDocsRes] = await Promise.all([
        fetch("http://localhost:8000/documents/latest", { headers }),
        fetch("http://localhost:8000/documents/popular", { headers }),
        fetch("http://localhost:8000/documents/my", { headers }),
      ])

      const [latest, popular, myDocuments] = await Promise.all([latestRes.json(), popularRes.json(), myDocsRes.json()])

      setDocuments({ latest, popular, myDocuments })
    } catch (error) {
      console.error("Failed to fetch documents:", error)
    } finally {
      setLoadingDocs(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours} hours ago`
    if (diffInHours < 48) return "Yesterday"
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Knowledge Hub</h1>
            <p className="text-muted-foreground">Welcome back, {user.full_name}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push("/upload")}>Upload Document</Button>
            <Button variant="outline" onClick={() => router.push("/search")}>
              Search
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loadingDocs ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid gap-8">
            {/* Latest Documents */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Latest Documents</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {documents.latest.length > 0 ? (
                  documents.latest.map((doc) => (
                    <Card
                      key={doc.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/document/${doc.id}`)}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg">{doc.title}</CardTitle>
                        <CardDescription>
                          by {doc.owner_name} • {formatDate(doc.created_at)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">{doc.summary || "No summary available"}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1 flex-wrap">
                            {doc.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                            {doc.tags.length > 2 && <Badge variant="outline">+{doc.tags.length - 2}</Badge>}
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{doc.average_rating.toFixed(1)}</span>
                            {doc.rating_count > 0 && (
                              <span className="text-xs text-muted-foreground">({doc.rating_count})</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-muted-foreground col-span-full text-center py-8">No documents available</p>
                )}
              </div>
            </section>

            {/* Popular Documents */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Most Popular</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {documents.popular.length > 0 ? (
                  documents.popular.map((doc) => (
                    <Card
                      key={doc.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/document/${doc.id}`)}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg">{doc.title}</CardTitle>
                        <CardDescription>
                          by {doc.owner_name} • {formatDate(doc.created_at)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">{doc.summary || "No summary available"}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1 flex-wrap">
                            {doc.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                            {doc.tags.length > 2 && <Badge variant="outline">+{doc.tags.length - 2}</Badge>}
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{doc.average_rating.toFixed(1)}</span>
                            <span className="text-xs text-muted-foreground">({doc.rating_count})</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-muted-foreground col-span-full text-center py-8">No popular documents yet</p>
                )}
              </div>
            </section>

            {/* My Documents */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">My Recent Documents</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {documents.myDocuments.length > 0 ? (
                  documents.myDocuments.map((doc) => (
                    <Card
                      key={doc.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/document/${doc.id}`)}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg">{doc.title}</CardTitle>
                        <CardDescription>by You • {formatDate(doc.created_at)}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">{doc.summary || "No summary available"}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1 flex-wrap">
                            {doc.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                            {doc.tags.length > 2 && <Badge variant="outline">+{doc.tags.length - 2}</Badge>}
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{doc.average_rating.toFixed(1)}</span>
                            {doc.rating_count > 0 && (
                              <span className="text-xs text-muted-foreground">({doc.rating_count})</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-muted-foreground mb-4">You haven't uploaded any documents yet</p>
                    <Button onClick={() => router.push("/upload")}>Upload Your First Document</Button>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
