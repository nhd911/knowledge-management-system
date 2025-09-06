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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Knowledge Hub
              </h1>
              <p className="text-muted-foreground text-lg">Welcome back, {user.full_name}</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => router.push("/upload")} className="bg-accent hover:bg-accent/90">
                Upload Document
              </Button>
              <Button variant="outline" onClick={() => router.push("/search")} className="border-2">
                Search
              </Button>
              <Button variant="ghost" onClick={handleLogout} className="hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        {loadingDocs ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Latest Documents */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Clock className="h-6 w-6 text-accent" />
                </div>
                <h2 className="text-2xl font-bold">Latest Documents</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {documents.latest.length > 0 ? (
                  documents.latest.map((doc) => (
                    <Card
                      key={doc.id}
                      className="card-hover cursor-pointer border-2 hover:border-accent/20 bg-card/80"
                      onClick={() => router.push(`/document/${doc.id}`)}
                    >
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xl text-balance">{doc.title}</CardTitle>
                        <CardDescription className="text-base">
                          by <span className="font-medium">{doc.owner_name}</span> • {formatDate(doc.created_at)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-muted-foreground leading-relaxed">{doc.summary || "No summary available"}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2 flex-wrap">
                            {doc.tags.slice(0, 2).map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="bg-accent/10 text-accent hover:bg-accent/20"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {doc.tags.length > 2 && (
                              <Badge variant="outline" className="border-accent/30">
                                +{doc.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{doc.average_rating.toFixed(1)}</span>
                            {doc.rating_count > 0 && (
                              <span className="text-xs text-muted-foreground">({doc.rating_count})</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-16 bg-card/50 rounded-xl border-2 border-dashed border-border">
                    <p className="text-muted-foreground text-lg">No documents available</p>
                  </div>
                )}
              </div>
            </section>

            {/* Popular Documents */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
                <h2 className="text-2xl font-bold">Most Popular</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {documents.popular.length > 0 ? (
                  documents.popular.map((doc) => (
                    <Card
                      key={doc.id}
                      className="card-hover cursor-pointer border-2 hover:border-accent/20 bg-card/80"
                      onClick={() => router.push(`/document/${doc.id}`)}
                    >
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xl text-balance">{doc.title}</CardTitle>
                        <CardDescription className="text-base">
                          by <span className="font-medium">{doc.owner_name}</span> • {formatDate(doc.created_at)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-muted-foreground leading-relaxed">{doc.summary || "No summary available"}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2 flex-wrap">
                            {doc.tags.slice(0, 2).map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="bg-accent/10 text-accent hover:bg-accent/20"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {doc.tags.length > 2 && (
                              <Badge variant="outline" className="border-accent/30">
                                +{doc.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{doc.average_rating.toFixed(1)}</span>
                            <span className="text-xs text-muted-foreground">({doc.rating_count})</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-16 bg-card/50 rounded-xl border-2 border-dashed border-border">
                    <p className="text-muted-foreground text-lg">No popular documents yet</p>
                  </div>
                )}
              </div>
            </section>

            {/* My Documents */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <FileText className="h-6 w-6 text-accent" />
                </div>
                <h2 className="text-2xl font-bold">My Recent Documents</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {documents.myDocuments.length > 0 ? (
                  documents.myDocuments.map((doc) => (
                    <Card
                      key={doc.id}
                      className="card-hover cursor-pointer border-2 hover:border-accent/20 bg-card/80"
                      onClick={() => router.push(`/document/${doc.id}`)}
                    >
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xl text-balance">{doc.title}</CardTitle>
                        <CardDescription className="text-base">by You • {formatDate(doc.created_at)}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-muted-foreground leading-relaxed">{doc.summary || "No summary available"}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2 flex-wrap">
                            {doc.tags.slice(0, 2).map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="bg-accent/10 text-accent hover:bg-accent/20"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {doc.tags.length > 2 && (
                              <Badge variant="outline" className="border-accent/30">
                                +{doc.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{doc.average_rating.toFixed(1)}</span>
                            {doc.rating_count > 0 && (
                              <span className="text-xs text-muted-foreground">({doc.rating_count})</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-16 bg-card/50 rounded-xl border-2 border-dashed border-border">
                    <div className="space-y-4">
                      <p className="text-muted-foreground text-lg">You haven't uploaded any documents yet</p>
                      <Button onClick={() => router.push("/upload")} className="bg-accent hover:bg-accent/90">
                        Upload Your First Document
                      </Button>
                    </div>
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
