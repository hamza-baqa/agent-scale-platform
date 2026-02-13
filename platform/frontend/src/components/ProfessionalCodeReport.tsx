'use client';

import { useEffect, useState } from 'react';
import mermaid from 'mermaid';

interface ProfessionalCodeReportProps {
  markdown: string;
  migrationId?: string;
}

export default function ProfessionalCodeReport({ markdown, migrationId }: ProfessionalCodeReportProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Inject custom scrollbar styles
  useEffect(() => {
    const styleId = 'professional-report-scrollbar-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Helper to render text with bold formatting
  const renderTextWithBold = (text: string) => {
    if (!text.includes('**')) return text;

    return text.split('**').map((part, i) =>
      i % 2 === 1 ? (
        <strong key={i} className="font-semibold text-blue-600">
          {part}
        </strong>
      ) : (
        part
      )
    );
  };

  useEffect(() => {
    // Initialize Mermaid
    mermaid.initialize({
      startOnLoad: true,
      theme: 'base',
      themeVariables: {
        primaryColor: '#f8fafc',
        primaryTextColor: '#1e293b',
        primaryBorderColor: '#cbd5e1',
        lineColor: '#64748b',
        secondaryColor: '#f1f5f9',
        tertiaryColor: '#e2e8f0',
        fontSize: '14px',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif'
      }
    });

    // Render all mermaid diagrams
    const renderDiagrams = async () => {
      const diagrams = document.querySelectorAll('.mermaid-diagram');

      // Use Promise.all with Array.from to properly handle async rendering
      await Promise.all(
        Array.from(diagrams).map(async (element, index) => {
          const code = element.textContent || '';
          if (!code.trim()) return;

          try {
            const { svg } = await mermaid.render(`mermaid-${index}-${Date.now()}`, code);
            element.innerHTML = svg;
          } catch (error) {
            console.error('Failed to render mermaid diagram:', error, 'Code:', code);
            element.innerHTML = `<div class="text-red-600 text-sm p-4 bg-red-50 border border-red-200 rounded">
              <strong>Failed to render diagram</strong><br/>
              <span class="text-xs">${error instanceof Error ? error.message : 'Unknown error'}</span>
            </div>`;
          }
        })
      );
    };

    renderDiagrams();
  }, [markdown]);

  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let currentCodeBlock = '';
    let inCodeBlock = false;
    let codeLanguage = '';
    let inTable = false;
    let tableHeaders: string[] = [];
    let tableRows: string[][] = [];

    lines.forEach((line, idx) => {
      // Code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // End code block
          if (codeLanguage === 'mermaid') {
            // Render mermaid diagram
            elements.push(
              <div key={idx} className="my-6 p-6 bg-slate-50 border border-slate-200 rounded-lg overflow-x-auto">
                <div className="mermaid-diagram" style={{ minHeight: '200px' }}>
                  {currentCodeBlock}
                </div>
              </div>
            );
          } else {
            // Regular code block
            elements.push(
              <div key={idx} className="my-4">
                <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto border border-slate-700">
                  <code className="text-sm font-mono">{currentCodeBlock}</code>
                </pre>
              </div>
            );
          }
          currentCodeBlock = '';
          codeLanguage = '';
        } else {
          // Start code block
          codeLanguage = line.substring(3).trim();
        }
        inCodeBlock = !inCodeBlock;
      } else if (inCodeBlock) {
        currentCodeBlock += line + '\n';
      }
      // Tables
      else if (line.startsWith('|') && line.endsWith('|')) {
        const cells = line.split('|').filter(cell => cell.trim()).map(cell => cell.trim());

        if (line.includes('---')) {
          // Skip separator line
          return;
        } else if (!inTable) {
          // Start table with headers
          inTable = true;
          tableHeaders = cells;
          tableRows = [];
        } else {
          // Add row
          tableRows.push(cells);
        }
      } else if (inTable && !line.startsWith('|')) {
        // End table
        elements.push(
          <div key={idx} className="my-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-lg">
              <thead className="bg-slate-50">
                <tr>
                  {tableHeaders.map((header, i) => (
                    <th
                      key={i}
                      className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {tableRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-slate-50">
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="px-6 py-4 text-sm text-slate-700">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        inTable = false;
        tableHeaders = [];
        tableRows = [];

        // Process current line after table
        if (line.trim()) {
          processLine(line, idx, elements);
        }
      }
      // Headers
      else if (line.startsWith('# ')) {
        elements.push(
          <h1 key={idx} className="text-3xl font-bold text-slate-900 mt-8 mb-4 pb-3 border-b-2 border-slate-200">
            {line.substring(2)}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={idx} className="text-2xl font-semibold text-slate-800 mt-6 mb-3">
            {line.substring(3)}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={idx} className="text-xl font-semibold text-slate-700 mt-5 mb-2">
            {line.substring(4)}
          </h3>
        );
      } else if (line.startsWith('#### ')) {
        elements.push(
          <h4 key={idx} className="text-lg font-semibold text-slate-700 mt-4 mb-2">
            {line.substring(5)}
          </h4>
        );
      }
      // Lists
      else if (line.match(/^[\*\-]\s/)) {
        elements.push(
          <li key={idx} className="ml-6 my-1 text-slate-700 list-disc">
            {renderTextWithBold(line.substring(2))}
          </li>
        );
      } else if (line.match(/^\d+\.\s/)) {
        const match = line.match(/^(\d+)\.\s(.*)$/);
        if (match) {
          elements.push(
            <li key={idx} className="ml-6 my-1 text-slate-700 list-decimal">
              {renderTextWithBold(match[2])}
            </li>
          );
        }
      }
      // Paragraph (may contain bold)
      else if (line.trim()) {
        elements.push(
          <p key={idx} className="my-2 text-slate-700 leading-relaxed">
            {renderTextWithBold(line)}
          </p>
        );
      }
      // Empty line (spacing)
      else {
        elements.push(<div key={idx} className="h-2" />);
      }
    });

    return elements;
  };

  const processLine = (line: string, idx: number, elements: JSX.Element[]) => {
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={idx} className="text-3xl font-bold text-slate-900 mt-8 mb-4 pb-3 border-b-2 border-slate-200">
          {line.substring(2)}
        </h1>
      );
    } else if (line.trim()) {
      elements.push(
        <p key={idx} className="my-2 text-slate-700 leading-relaxed">
          {line}
        </p>
      );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Code Analysis Report
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Comprehensive codebase analysis and recommendations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const element = document.createElement('a');
                const file = new Blob([markdown], { type: 'text/markdown' });
                element.href = URL.createObjectURL(file);
                element.download = 'code-analysis-report.md';
                element.click();
              }}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              Export Report
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-8">
          <div className="prose prose-slate max-w-none">
            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
              {renderMarkdown(markdown)}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      {isExpanded && (
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Generated by ARK Code Analyzer</span>
            <span>{new Date().toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
