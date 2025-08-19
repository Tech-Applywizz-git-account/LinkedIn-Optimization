"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Copy, FileText, Globe, CheckCircle, Linkedin, FileDown } from "lucide-react"
import { LinkedInExporter, type ExportData } from "@/lib/export-utils"
import { useToast } from "@/hooks/use-toast"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exportData: ExportData
}

export function ExportDialog({ open, onOpenChange, exportData }: ExportDialogProps) {
  const [activeTab, setActiveTab] = useState("formats")
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  const handleCopy = async (content: string, type: string) => {
    const success = await LinkedInExporter.copyToClipboard(content)
    if (success) {
      setCopiedStates((prev) => ({ ...prev, [type]: true }))
      toast({
        title: "Copied to clipboard",
        description: `${type} content has been copied to your clipboard.`,
      })
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [type]: false }))
      }, 2000)
    } else {
      toast({
        title: "Copy failed",
        description: "Please try again or use the download option.",
        variant: "destructive",
      })
    }
  }

  const handleDownload = (format: "txt" | "html" | "linkedin") => {
    const timestamp = new Date().toISOString().split("T")[0]
    const baseFilename = `linkedin-profile-${exportData.targetRole.toLowerCase().replace(/\s+/g, "-")}-${timestamp}`

    switch (format) {
      case "txt":
        const txtContent = LinkedInExporter.generatePlainText(exportData)
        LinkedInExporter.downloadFile(txtContent, `${baseFilename}.txt`, "text/plain")
        break
      case "html":
        const htmlContent = LinkedInExporter.generateHTML(exportData)
        LinkedInExporter.downloadFile(htmlContent, `${baseFilename}.html`, "text/html")
        break
      case "linkedin":
        const linkedinContent = LinkedInExporter.generateLinkedInReady(exportData)
        LinkedInExporter.downloadFile(linkedinContent, `${baseFilename}-linkedin-ready.txt`, "text/plain")
        break
    }

    toast({
      title: "Download started",
      description: `Your ${format.toUpperCase()} file is being downloaded.`,
    })
  }

  const exportFormats = [
    {
      id: "txt",
      name: "Plain Text",
      description: "Complete profile in text format",
      icon: <FileText className="h-5 w-5" />,
      color: "bg-gray-100 text-gray-700",
    },
    {
      id: "html",
      name: "HTML Report",
      description: "Formatted report with styling",
      icon: <Globe className="h-5 w-5" />,
      color: "bg-blue-100 text-blue-700",
    },
    {
      id: "linkedin",
      name: "LinkedIn Ready",
      description: "Copy-paste format for LinkedIn",
      icon: <Linkedin className="h-5 w-5" />,
      color: "bg-blue-600 text-white",
    },
  ]

  const individualSections = [
    { id: "headline", name: "Headline", icon: "📋" },
    { id: "about", name: "About Section", icon: "📝" },
    { id: "experience", name: "Experience", icon: "💼" },
    { id: "projects", name: "Projects", icon: "🚀" },
    { id: "education", name: "Education", icon: "🎓" },
    { id: "skills", name: "Skills", icon: "🎯" },
    { id: "certifications", name: "Certifications", icon: "🏆" },
    { id: "banner", name: "Banner Concepts", icon: "🎨" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export LinkedIn Profile
          </DialogTitle>
          <DialogDescription>
            Download your optimized LinkedIn profile in various formats or copy individual sections.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="formats">Export Formats</TabsTrigger>
            <TabsTrigger value="sections">Individual Sections</TabsTrigger>
            <TabsTrigger value="preview">Quick Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="formats" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {exportFormats.map((format) => (
                <Card key={format.id} className="relative">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className={`p-2 rounded-lg ${format.color}`}>{format.icon}</div>
                      {format.name}
                    </CardTitle>
                    <CardDescription>{format.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => handleDownload(format.id as "txt" | "html" | "linkedin")}
                        className="w-full"
                        variant={format.id === "linkedin" ? "default" : "outline"}
                      >
                        <FileDown className="h-4 w-4 mr-2" />
                        Download {format.name}
                      </Button>

                      {format.id === "linkedin" && (
                        <Button
                          onClick={() =>
                            handleCopy(LinkedInExporter.generateLinkedInReady(exportData), "LinkedIn Ready")
                          }
                          variant="outline"
                          className="w-full"
                        >
                          {copiedStates["LinkedIn Ready"] ? (
                            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4 mr-2" />
                          )}
                          Copy to Clipboard
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-blue-900 dark:text-blue-100">Export Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{exportData.completedSections}</div>
                    <div className="text-sm text-blue-800 dark:text-blue-200">Sections</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{exportData.totalKeywords}</div>
                    <div className="text-sm text-blue-800 dark:text-blue-200">Keywords</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round((exportData.completedSections / 8) * 100)}%
                    </div>
                    <div className="text-sm text-blue-800 dark:text-blue-200">Complete</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{exportData.targetRole.split(" ").length}</div>
                    <div className="text-sm text-blue-800 dark:text-blue-200">Role Words</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sections" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {individualSections.map((section) => {
                const result = exportData.optimizationResults[section.id]
                const hasContent = result?.content

                return (
                  <Card key={section.id} className={!hasContent ? "opacity-50" : ""}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span>{section.icon}</span>
                          {section.name}
                        </span>
                        {hasContent && (
                          <Badge variant="secondary" className="text-xs">
                            {result.keywords.length} keywords
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {hasContent ? (
                        <div className="space-y-2">
                          <Button
                            onClick={() =>
                              handleCopy(
                                LinkedInExporter.generateSectionExport(section.id, result, exportData.targetRole),
                                section.name,
                              )
                            }
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            {copiedStates[section.name] ? (
                              <CheckCircle className="h-3 w-3 mr-2 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3 mr-2" />
                            )}
                            Copy {section.name}
                          </Button>
                          <div className="text-xs text-gray-500 truncate">{result.content.substring(0, 60)}...</div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-400">
                          <p className="text-xs">Not optimized yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>LinkedIn Ready Preview</CardTitle>
                <CardDescription>This is how your optimized content will look when copied to LinkedIn</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {LinkedInExporter.generateLinkedInReady(exportData)}
                  </pre>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => handleCopy(LinkedInExporter.generateLinkedInReady(exportData), "Preview")}
                    className="flex-1"
                  >
                    {copiedStates["Preview"] ? (
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    Copy All Content
                  </Button>
                  <Button onClick={() => handleDownload("linkedin")} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
