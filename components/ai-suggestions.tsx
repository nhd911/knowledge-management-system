"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Brain, Wand2, Loader2 } from "lucide-react"

interface AISuggestionsProps {
  summary?: string
  tags?: string[]
  onApply?: (data: { summary: string; tags: string }) => void
  onDismiss?: () => void
}

export function AISuggestions({ summary, tags = [], onApply, onDismiss }: AISuggestionsProps) {
  const [applying, setApplying] = useState(false)

  const handleApply = async () => {
    if (!onApply) return

    setApplying(true)
    try {
      onApply({
        summary: summary || "",
        tags: tags.join(", "),
      })
    } finally {
      setApplying(false)
    }
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-primary" />
          AI Suggestions
        </CardTitle>
        <CardDescription>AI has analyzed your content and generated suggestions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary && (
          <div>
            <Label className="text-sm font-medium">Suggested Summary:</Label>
            <p className="text-sm text-muted-foreground mt-1 p-3 bg-background rounded border">{summary}</p>
          </div>
        )}

        {tags.length > 0 && (
          <div>
            <Label className="text-sm font-medium">Suggested Tags:</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleApply} size="sm" disabled={applying}>
            {applying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
            {applying ? "Applying..." : "Apply Suggestions"}
          </Button>
          <Button variant="outline" onClick={onDismiss} size="sm" disabled={applying}>
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
