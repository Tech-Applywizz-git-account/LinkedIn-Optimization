"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, MapPin, Building, GraduationCap, Award, Code, Download, Share, Eye } from "lucide-react"
import type { OptimizationResult } from "@/lib/optimization-engine"
import { ExportDialog } from "@/components/export-dialog"
import type { ExportData } from "@/lib/export-utils"

interface ProfilePreviewProps {
  targetRole: string
  optimizationResults: Record<string, OptimizationResult>
  onBack: () => void
  onEditSection: (sectionId: string) => void
  onExport: () => void
}

export function ProfilePreview({
  targetRole,
  optimizationResults,
  onBack,
  onEditSection,
  onExport,
}: ProfilePreviewProps) {
  const [showExportDialog, setShowExportDialog] = useState(false)

  const formatContent = (content: string) => {
    // Convert markdown-style bold to HTML
    return content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
  }

  const completedSections = Object.keys(optimizationResults).filter((key) => optimizationResults[key]?.content).length

  const totalSections = 8
  const totalKeywords = Object.values(optimizationResults)
    .flatMap((result) => result?.keywords || [])
    .filter((keyword, index, arr) => arr.indexOf(keyword) === index).length

  const exportData: ExportData = {
    targetRole,
    optimizationResults,
    exportDate: new Date().toLocaleDateString(),
    completedSections,
    totalKeywords,
  }

  const handleExportClick = () => {
    setShowExportDialog(true)
  }

  const handleSharePreview = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `LinkedIn Profile Optimization - ${targetRole}`,
          text: `Check out my optimized LinkedIn profile for ${targetRole}`,
          url: window.location.href,
        })
      } catch (error) {
        console.log("Share cancelled or failed")
      }
    } else {
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        // You could show a toast here
      } catch (error) {
        console.log("Failed to copy URL")
      }
    }
  }

  const renderSection = (
    sectionId: string,
    title: string,
    icon: React.ReactNode,
    content?: string,
    isRequired = true,
  ) => {
    const result = optimizationResults[sectionId]
    const hasContent = result && result.content

    return (
      <Card className={`${!hasContent && isRequired ? "border-orange-200 bg-orange-50 dark:bg-orange-950" : ""}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              {icon}
              {title}
            </CardTitle>
            <div className="flex items-center gap-2">
              {hasContent && (
                <Badge variant="secondary" className="text-xs">
                  {result.keywords.length} keywords
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={() => onEditSection(sectionId)} className="text-xs">
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {hasContent ? (
            <div className="space-y-3">
              <div
                className="text-sm leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: formatContent(result.content) }}
              />
              {result.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2 border-t">
                  {result.keywords.slice(0, 8).map((keyword, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="text-sm">This section hasn't been optimized yet.</p>
              <Button
                variant="link"
                onClick={() => onEditSection(sectionId)}
                className="text-blue-600 hover:text-blue-700 p-0 h-auto"
              >
                Click to optimize →
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack} className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">LinkedIn Profile Preview</h1>
              <p className="text-gray-600 dark:text-gray-300">
                {completedSections} of {totalSections} sections optimized
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleSharePreview} className="flex items-center gap-2 bg-transparent">
              <Share className="h-4 w-4" />
              Share Preview
            </Button>
            <Button
              onClick={handleExportClick}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              disabled={completedSections === 0}
            >
              <Download className="h-4 w-4" />
              Export Profile
            </Button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Header Card */}
          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div>
                  <h2 className="text-2xl font-bold">Your Name</h2>
                  <div className="text-blue-100">
                    {optimizationResults.headline?.content || `${targetRole} | Optimizing...`}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-blue-100">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>Your Location</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    <span>500+ connections</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm">
                    Open to work
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-white border-white hover:bg-white hover:text-blue-600 bg-transparent"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View as recruiter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* About Section */}
          {renderSection("about", "About", <Award className="h-5 w-5 text-blue-600" />)}

          {/* Experience Section */}
          {renderSection("experience", "Experience", <Building className="h-5 w-5 text-green-600" />)}

          {/* Projects Section */}
          {renderSection("projects", "Projects", <Code className="h-5 w-5 text-purple-600" />)}

          {/* Education Section */}
          {renderSection("education", "Education", <GraduationCap className="h-5 w-5 text-orange-600" />)}

          {/* Skills Section */}
          {renderSection("skills", "Skills & Endorsements", <Award className="h-5 w-5 text-red-600" />)}

          {/* Certifications Section */}
          {renderSection(
            "certifications",
            "Licenses & Certifications",
            <Award className="h-5 w-5 text-indigo-600" />,
            undefined,
            false,
          )}

          {/* Banner Design Concepts */}
          {renderSection(
            "banner",
            "LinkedIn Banner Concepts",
            <Award className="h-5 w-5 text-pink-600" />,
            undefined,
            false,
          )}

          {/* Optimization Summary */}
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100">Optimization Summary</CardTitle>
              <CardDescription className="text-blue-700 dark:text-blue-300">
                Your LinkedIn profile optimization progress and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{completedSections}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Sections Optimized</div>
                </div>

                <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{totalKeywords}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Keywords Added</div>
                </div>

                <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round((completedSections / totalSections) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Profile Complete</div>
                </div>
              </div>

              {completedSections < totalSections && (
                <div className="mt-6 p-4 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                    Recommendations to Complete Your Profile:
                  </h4>
                  <ul className="text-sm text-orange-800 dark:text-orange-200 space-y-1">
                    {!optimizationResults.headline?.content && (
                      <li>• Complete your headline optimization for better recruiter visibility</li>
                    )}
                    {!optimizationResults.about?.content && (
                      <li>• Add an optimized About section to showcase your value proposition</li>
                    )}
                    {!optimizationResults.experience?.content && (
                      <li>• Optimize your experience descriptions with impact metrics</li>
                    )}
                    {!optimizationResults.skills?.content && (
                      <li>• Add strategic skills for maximum search visibility</li>
                    )}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ExportDialog open={showExportDialog} onOpenChange={setShowExportDialog} exportData={exportData} />
    </div>
  )
}
