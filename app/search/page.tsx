"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, CalendarIcon, Star, ChevronLeft, ChevronRight, X, SlidersHorizontal } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { format } from "date-fns"

interface Document {
  id: string
  title: string
  summary: string
  tags: string[]
  owner_name: string
  created_at: string
  average_rating: number
  rating_count: number
  visibility: string
}

interface SearchFilters {
  query: string
  tags: string
  dateFrom: Date | undefined
  dateTo: Date | undefined
  group: string
  visibility: string
  owner: string
  sortBy: string
  sortOrder: string
}

export default function SearchPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get("q") || "",
    tags: "",
    dateFrom: undefined,
    dateTo: undefined,
    group: "",
    visibility: "",
    owner: "",
    sortBy: "created_at",
    sortOrder: "desc",
  })

  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [totalResults, setTotalResults] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [availableTags, setAvailableTags] = useState<{ tag: string; count: number }[]>([])

  const resultsPerPage = 10

  useEffect(() => {
    if (user) {
      fetchAvailableTags()
      if (filters.query || hasActiveFilters()) {
        performSearch()
      }
    }
  }, [user])

  useEffect(() => {
    if (user && (filters.query || hasActiveFilters())) {
      performSearch()
    }
  }, [currentPage, filters])

  const fetchAvailableTags = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:8000/documents/tags", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setAvailableTags(data.tags)
      }
    } catch (error) {
      console.error("Failed to fetch tags:", error)
    }
  }

  const hasActiveFilters = () => {
    return filters.tags || filters.dateFrom || filters.dateTo || filters.group || filters.visibility || filters.owner
  }

  const performSearch = async () => {
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      const params = new URLSearchParams()

      if (filters.query) params.append("query", filters.query)
      if (filters.tags) params.append("tags", filters.tags)
      if (filters.dateFrom) params.append("date_from", filters.dateFrom.toISOString())
      if (filters.dateTo) params.append("date_to", filters.dateTo.toISOString())
      if (filters.group) params.append("group", filters.group)
      if (filters.visibility) params.append("visibility", filters.visibility)
      if (filters.owner) params.append("owner", filters.owner)
      params.append("sort_by", filters.sortBy)
      params.append("sort_order", filters.sortOrder)
      params.append("page", currentPage.toString())
      params.append("limit", resultsPerPage.toString())

      const [searchResponse, countResponse] = await Promise.all([
        fetch(`http://localhost:8000/documents/search?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`http://localhost:8000/documents/search/count?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (searchResponse.ok && countResponse.ok) {
        const searchData = await searchResponse.json()
        const countData = await countResponse.json()
        setDocuments(searchData)
        setTotalResults(countData.total)
      } else {
        setError("Search failed. Please try again.")
      }
    } catch (err) {
      setError("Search failed. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    performSearch()
  }

  const clearFilters = () => {
    setFilters({
      query: "",
      tags: "",
      dateFrom: undefined,
      dateTo: undefined,
      group: "",
      visibility: "",
      owner: "",
      sortBy: "created_at",
      sortOrder: "desc",
    })
    setCurrentPage(1)
    setDocuments([])
    setTotalResults(0)
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

  const totalPages = Math.ceil(totalResults / resultsPerPage)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/")} className="hover:bg-accent/10">
              ← Back to Home
            </Button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Search Documents
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="space-y-8">
          {/* Search Form */}
          <Card className="border-2 shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Search className="h-6 w-6 text-accent" />
                </div>
                Search Knowledge Base
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-6">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      placeholder="Search documents by title or content..."
                      value={filters.query}
                      onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
                      className="h-12 text-base border-2 focus:border-accent"
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="bg-accent hover:bg-accent/90 h-12 px-8">
                    {loading ? "Searching..." : "Search"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="border-2 h-12"
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </div>

                {showFilters && (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 p-6 border-2 rounded-xl bg-muted/30">
                    {/* Tags Filter */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Tags</Label>
                      <Input
                        placeholder="e.g., react, tutorial"
                        value={filters.tags}
                        onChange={(e) => setFilters((prev) => ({ ...prev, tags: e.target.value }))}
                        className="border-2 focus:border-accent"
                      />
                      <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                        {availableTags.slice(0, 10).map(({ tag, count }) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="cursor-pointer hover:bg-accent hover:text-accent-foreground border-2 hover:border-accent"
                            onClick={() => {
                              const currentTags = filters.tags
                                .split(",")
                                .map((t) => t.trim())
                                .filter(Boolean)
                              if (!currentTags.includes(tag)) {
                                setFilters((prev) => ({
                                  ...prev,
                                  tags: currentTags.length ? `${filters.tags}, ${tag}` : tag,
                                }))
                              }
                            }}
                          >
                            {tag} ({count})
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Date Range */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Date Range</Label>
                      <div className="flex gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="border-2 hover:border-accent bg-transparent">
                              <CalendarIcon className="h-4 w-4 mr-2" />
                              {filters.dateFrom ? format(filters.dateFrom, "MMM dd") : "From"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={filters.dateFrom}
                              onSelect={(date) => setFilters((prev) => ({ ...prev, dateFrom: date }))}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="border-2 hover:border-accent bg-transparent">
                              <CalendarIcon className="h-4 w-4 mr-2" />
                              {filters.dateTo ? format(filters.dateTo, "MMM dd") : "To"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={filters.dateTo}
                              onSelect={(date) => setFilters((prev) => ({ ...prev, dateTo: date }))}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    {/* Visibility Filter */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Visibility</Label>
                      <Select
                        value={filters.visibility}
                        onValueChange={(value) => setFilters((prev) => ({ ...prev, visibility: value }))}
                      >
                        <SelectTrigger className="border-2 focus:border-accent">
                          <SelectValue placeholder="All documents" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All documents</SelectItem>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="group">Group</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Owner Filter */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Author</Label>
                      <Input
                        placeholder="Search by author name"
                        value={filters.owner}
                        onChange={(e) => setFilters((prev) => ({ ...prev, owner: e.target.value }))}
                        className="border-2 focus:border-accent"
                      />
                    </div>

                    {/* Sort Options */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Sort By</Label>
                      <div className="flex gap-2">
                        <Select
                          value={filters.sortBy}
                          onValueChange={(value) => setFilters((prev) => ({ ...prev, sortBy: value }))}
                        >
                          <SelectTrigger className="border-2 focus:border-accent">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="created_at">Date Created</SelectItem>
                            <SelectItem value="updated_at">Date Updated</SelectItem>
                            <SelectItem value="title">Title</SelectItem>
                            <SelectItem value="average_rating">Rating</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={filters.sortOrder}
                          onValueChange={(value) => setFilters((prev) => ({ ...prev, sortOrder: value }))}
                        >
                          <SelectTrigger className="border-2 focus:border-accent">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="desc">Descending</SelectItem>
                            <SelectItem value="asc">Ascending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Clear Filters */}
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={clearFilters}
                        className="border-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive bg-transparent"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear All
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Search Results */}
          <div>
            {error && (
              <Alert variant="destructive" className="mb-6 border-2">
                <AlertDescription className="text-base">{error}</AlertDescription>
              </Alert>
            )}

            {totalResults > 0 && (
              <div className="flex justify-between items-center mb-6 p-4 bg-card/50 rounded-lg border">
                <p className="text-base text-muted-foreground">
                  Found <span className="font-medium text-foreground">{totalResults}</span> document
                  {totalResults !== 1 ? "s" : ""}
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="border-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-base font-medium">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="border-2"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent"></div>
                </div>
              ) : documents.length > 0 ? (
                documents.map((doc) => (
                  <Card
                    key={doc.id}
                    className="card-hover cursor-pointer border-2 hover:border-accent/20 bg-card/80"
                    onClick={() => router.push(`/document/${doc.id}`)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <CardTitle className="text-xl text-balance">{doc.title}</CardTitle>
                          <CardDescription className="text-base">
                            by <span className="font-medium">{doc.owner_name}</span> • {formatDate(doc.created_at)} •{" "}
                            <span className="capitalize">{doc.visibility}</span>
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{doc.average_rating.toFixed(1)}</span>
                          {doc.rating_count > 0 && (
                            <span className="text-xs text-muted-foreground">({doc.rating_count})</span>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground leading-relaxed">{doc.summary || "No summary available"}</p>
                      <div className="flex gap-2 flex-wrap">
                        {doc.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="bg-accent/10 text-accent hover:bg-accent/20">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : !loading && (filters.query || hasActiveFilters()) ? (
                <div className="text-center py-20 bg-card/50 rounded-xl border-2 border-dashed border-border">
                  <div className="space-y-4">
                    <p className="text-muted-foreground text-lg">No documents found matching your search criteria</p>
                    <Button variant="outline" onClick={clearFilters} className="border-2 bg-transparent">
                      Clear filters and try again
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 bg-card/50 rounded-xl border-2 border-dashed border-border">
                  <p className="text-muted-foreground text-lg">
                    Enter a search term or apply filters to find documents
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
