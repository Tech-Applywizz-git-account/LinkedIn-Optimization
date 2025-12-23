// src/app/components/ResumeProcessor.tsx
"use client";

import { useState, useEffect } from 'react';
import ResumeUpload from './resume-upload';
import StepwiseExperience from './StepwiseExperience';
import { buildExperienceInputs } from "@/lib/experienceUtils";
import type { ParsedResume } from "@/lib/resumeParser";

export default function ResumeProcessor() {
  const [parsedData, setParsedData] = useState<{
    text: string;
    parsed: ParsedResume;
  } | null>(null);
  
  const [targetRole, setTargetRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [expInputs, setExpInputs] = useState<any[]>([]);
  const [intInputs, setIntInputs] = useState<any[]>([]);

  const handleParsed = (data: { text: string; parsed: ParsedResume }) => {
    setParsedData(data);
  };

  // Build experience inputs whenever parsedData, targetRole, or jobDescription changes
  useEffect(() => {
    if (parsedData && targetRole) {
      const { expInputs: experienceInputs, intInputs: internshipInputs } = buildExperienceInputs(
        parsedData.parsed, 
        parsedData.text, 
        targetRole, 
        jobDescription
      );
      
      setExpInputs(experienceInputs);
      setIntInputs(internshipInputs);
    }
  }, [parsedData, targetRole, jobDescription]);

  return (
    <div className="space-y-6">
      {/* Target Role and Job Description Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Target Role</label>
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="e.g., Software Engineer"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Job Description</label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="w-full border rounded p-2 h-20"
            placeholder="Paste job description here..."
          />
        </div>
      </div>

      {/* Resume Upload */}
      <ResumeUpload onParsed={handleParsed} />

      {/* Show message if resume is uploaded but target role is missing */}
      {parsedData && !targetRole && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800 text-sm">
            Please enter a target role to generate experience sections.
          </p>
        </div>
      )}

      {/* Experience Generation */}
      {expInputs.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Professional Experience</h3>
          <StepwiseExperience 
            experiences={expInputs}
            genEndpoint="/api/generate-section"
            section="experience"
          />
        </div>
      )}

      {/* Internship Generation */}
      {intInputs.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Internships</h3>
          <StepwiseExperience 
            experiences={intInputs}
            genEndpoint="/api/generate-section" 
            section="internship"
          />
        </div>
      )}

      {/* Debug info (optional) */}
      {process.env.NODE_ENV === 'development' && parsedData && (
        <div className="mt-6 p-4 bg-gray-100 rounded-md">
          <h4 className="font-semibold mb-2">Debug Info:</h4>
          <p>Experience Items: {expInputs.length}</p>
          <p>Internship Items: {intInputs.length}</p>
          <pre className="text-xs mt-2 overflow-auto">
            {JSON.stringify(expInputs.map(item => ({
              company: item.company,
              title: item.title,
              start: item.start,
              end: item.end
            })), null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}