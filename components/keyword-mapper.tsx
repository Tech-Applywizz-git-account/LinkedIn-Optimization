"use client"

import { useState } from "react"
import { Search, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  getKeywordsByDomain,
  getAllDomains,
  searchKeywordMappings,
  type KeywordMapping,
  keywordMappings,
} from "@/lib/keyword-mapping"

export function KeywordMapper() {
  const [targetRole, setTargetRole] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDomain, setSelectedDomain] = useState("")
  const [keywords, setKeywords] = useState<string[]>([])
  const [searchResults, setSearchResults] = useState<KeywordMapping[]>([])
  const [targetRoleResults, setTargetRoleResults] = useState<KeywordMapping[]>([])
  const [copiedKeywords, setCopiedKeywords] = useState(false)

  const domains = getAllDomains()

  const handleTargetRoleSearch = (role: string) => {
    setTargetRole(role)
    if (role.trim()) {
      const term = role.toLowerCase()

      // First, find exact job title matches
      const exactMatches = keywordMappings.filter((mapping) => mapping.jobTitle.toLowerCase() === term)

      // Then, find partial job title matches
      const partialMatches = keywordMappings.filter(
        (mapping) =>
          mapping.jobTitle.toLowerCase().includes(term) &&
          !exactMatches.some((exact) => exact.jobTitle === mapping.jobTitle),
      )

      // Finally, find keyword matches
      const keywordMatches = keywordMappings.filter(
        (mapping) =>
          mapping.keywords.some((keyword) => keyword.toLowerCase().includes(term)) &&
          !exactMatches.some((exact) => exact.jobTitle === mapping.jobTitle) &&
          !partialMatches.some((partial) => partial.jobTitle === mapping.jobTitle),
      )

      const allMatches = [...exactMatches, ...partialMatches, ...keywordMatches]
      setTargetRoleResults(allMatches)

      // If we have matches, automatically select keywords from the best match
      if (allMatches.length > 0) {
        const bestMatch = allMatches[0]
        setKeywords(bestMatch.keywords)
        setSelectedDomain(bestMatch.bucket)
      } else {
        setKeywords([])
        setSelectedDomain("")
      }

      // Clear other search states
      setSearchResults([])
      setSearchTerm("")
    } else {
      setTargetRoleResults([])
      setKeywords([])
      setSelectedDomain("")
    }
  }

  const handleDomainSearch = (domain: string) => {
    setSelectedDomain(domain)
    const domainKeywords = getKeywordsByDomain(domain)
    setKeywords(domainKeywords)
    setSearchResults([])
    setTargetRoleResults([])
  }

  const handleGeneralSearch = (term: string) => {
    setSearchTerm(term)
    if (term.trim()) {
      const results = searchKeywordMappings(term)
      setSearchResults(results)
      setKeywords([])
      setSelectedDomain("")
      setTargetRoleResults([])
    } else {
      setSearchResults([])
    }
  }

  const selectTargetRoleKeywords = (mapping: KeywordMapping) => {
    setKeywords(mapping.keywords)
    setSelectedDomain(mapping.bucket)
  }

  const copyKeywords = async () => {
    if (keywords.length > 0) {
      await navigator.clipboard.writeText(keywords.join(", "))
      setCopiedKeywords(true)
      setTimeout(() => setCopiedKeywords(false), 2000)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-900">LinkedIn Keyword Finder</CardTitle>
          <CardDescription>
            Enter your target role to get the most relevant keywords for LinkedIn optimization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Target Role</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Enter your target job title (e.g., Data Analyst, Java Developer, Project Manager)..."
                value={targetRole}
                onChange={(e) => handleTargetRoleSearch(e.target.value)}
                className="pl-10 text-base py-3"
              />
            </div>
          </div>

          {targetRoleResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Matching Roles for "{targetRole}" ({targetRoleResults.length} matches)
              </h3>
              <div className="grid gap-3">
                {targetRoleResults.slice(0, 5).map((result, index) => (
                  <Card
                    key={index}
                    className={`border-l-4 cursor-pointer transition-all hover:shadow-md ${
                      index === 0 ? "border-l-green-500 bg-green-50" : "border-l-blue-500"
                    }`}
                    onClick={() => selectTargetRoleKeywords(result)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                            {result.jobTitle}
                            {index === 0 && (
                              <Badge variant="default" className="text-xs bg-green-600">
                                Best Match
                              </Badge>
                            )}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {result.bucket} • {result.location} • {result.experienceLevel}
                            {result.remote && " • Remote Available"}
                          </p>
                        </div>
                        <Button size="sm" variant="outline">
                          Select Keywords
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {result.keywords.slice(0, 6).map((keyword, keyIndex) => (
                          <Badge key={keyIndex} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                        {result.keywords.length > 6 && (
                          <Badge variant="secondary" className="text-xs">
                            +{result.keywords.length - 6} more
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {targetRoleResults.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    Showing top 5 matches. {targetRoleResults.length - 5} more available.
                  </p>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* General Search Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">General Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search domains, job titles, or keywords..."
                value={searchTerm}
                onChange={(e) => handleGeneralSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Domain Quick Select */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Select Domains:</h3>
            <div className="flex flex-wrap gap-2">
              {domains.map((domain) => (
                <Button
                  key={domain}
                  variant={selectedDomain === domain ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDomainSearch(domain)}
                  className="text-xs"
                >
                  {domain}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Keywords Display */}
          {keywords.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {targetRole ? `Keywords for "${targetRole}"` : `Keywords for "${selectedDomain}"`} ({keywords.length}{" "}
                  keywords)
                </h3>
                <Button
                  onClick={copyKeywords}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2 bg-transparent"
                >
                  {copiedKeywords ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy All
                    </>
                  )}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Search Results ({searchResults.length} matches)</h3>
              <div className="grid gap-4">
                {searchResults.map((result, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{result.jobTitle}</h4>
                          <p className="text-sm text-gray-600">
                            {result.bucket} • {result.location} • {result.experienceLevel}
                            {result.remote && " • Remote Available"}
                          </p>
                        </div>
                        <Button size="sm" onClick={() => handleDomainSearch(result.bucket)} variant="outline">
                          View All Keywords
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {result.keywords.slice(0, 8).map((keyword, keyIndex) => (
                          <Badge key={keyIndex} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                        {result.keywords.length > 8 && (
                          <Badge variant="secondary" className="text-xs">
                            +{result.keywords.length - 8} more
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {targetRole && targetRoleResults.length === 0 && keywords.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No matching roles found for "{targetRole}"</p>
              <p className="text-sm">
                Try searching for roles like "Data Analyst", "Java Developer", or "Project Manager"
              </p>
            </div>
          )}

          {/* Empty State */}
          {searchTerm && searchResults.length === 0 && keywords.length === 0 && !targetRole && (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No results found for "{searchTerm}"</p>
              <p className="text-sm">Try searching for domains like "Data", "AML", or "Computer Science"</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
