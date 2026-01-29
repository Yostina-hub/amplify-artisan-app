import { useState, useEffect, useCallback } from "react";

export interface GeneratedReport {
  id: string;
  name: string;
  templateId: string;
  type: string;
  format: "pdf" | "csv" | "xlsx" | "json";
  status: "completed" | "failed" | "processing";
  generatedAt: Date;
  size: string;
  dateRange?: string;
}

const STORAGE_KEY = "generated_reports";

export function useReports() {
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load reports from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const reportsWithDates = parsed.map((r: any) => ({
          ...r,
          generatedAt: new Date(r.generatedAt),
        }));
        setReports(reportsWithDates);
      }
    } catch (e) {
      console.error("Failed to load reports from storage:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save reports to localStorage
  const saveReports = useCallback((newReports: GeneratedReport[]) => {
    setReports(newReports);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newReports));
    } catch (e) {
      console.error("Failed to save reports to storage:", e);
    }
  }, []);

  // Generate a new report
  const generateReport = useCallback(
    async (
      templateId: string,
      name: string,
      type: string,
      format: "pdf" | "csv" | "xlsx" | "json" = "pdf",
      dateRange?: string
    ): Promise<GeneratedReport> => {
      const newReport: GeneratedReport = {
        id: crypto.randomUUID(),
        name,
        templateId,
        type,
        format,
        status: "processing",
        generatedAt: new Date(),
        size: "—",
        dateRange,
      };

      // Add to list immediately with processing status
      const updatedReports = [newReport, ...reports];
      saveReports(updatedReports);

      // Simulate report generation
      return new Promise((resolve) => {
        setTimeout(() => {
          const success = Math.random() > 0.1; // 90% success rate
          const completedReport: GeneratedReport = {
            ...newReport,
            status: success ? "completed" : "failed",
            size: success ? `${(Math.random() * 5 + 0.5).toFixed(1)} MB` : "—",
          };

          const finalReports = [
            completedReport,
            ...reports.filter((r) => r.id !== newReport.id),
          ];
          saveReports(finalReports);
          resolve(completedReport);
        }, 1500 + Math.random() * 1500);
      });
    },
    [reports, saveReports]
  );

  // Retry a failed report
  const retryReport = useCallback(
    async (reportId: string): Promise<GeneratedReport | null> => {
      const report = reports.find((r) => r.id === reportId);
      if (!report) return null;

      // Update status to processing
      const updatedReports = reports.map((r) =>
        r.id === reportId ? { ...r, status: "processing" as const } : r
      );
      saveReports(updatedReports);

      // Simulate retry
      return new Promise((resolve) => {
        setTimeout(() => {
          const success = Math.random() > 0.2; // 80% success rate on retry
          const completedReport: GeneratedReport = {
            ...report,
            status: success ? "completed" : "failed",
            size: success ? `${(Math.random() * 5 + 0.5).toFixed(1)} MB` : "—",
            generatedAt: new Date(),
          };

          const finalReports = reports.map((r) =>
            r.id === reportId ? completedReport : r
          );
          saveReports(finalReports);
          resolve(completedReport);
        }, 1500 + Math.random() * 1000);
      });
    },
    [reports, saveReports]
  );

  // Delete a report
  const deleteReport = useCallback(
    (reportId: string) => {
      const updatedReports = reports.filter((r) => r.id !== reportId);
      saveReports(updatedReports);
    },
    [reports, saveReports]
  );

  // Clear all reports
  const clearAllReports = useCallback(() => {
    saveReports([]);
  }, [saveReports]);

  return {
    reports,
    isLoading,
    generateReport,
    retryReport,
    deleteReport,
    clearAllReports,
  };
}
