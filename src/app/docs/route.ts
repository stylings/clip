import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { marked } from "marked";

export const revalidate = false;

const docs = readFileSync(join(process.cwd(), "src/app/docs/docs.md"), "utf-8");

const htmlTemplate = (content: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>clip api docs</title>
  <style>
    * {
      box-sizing: border-box;
    }

    body {
      background-color: #111111;
      color: #ffffff;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      line-height: 1.6;
      padding: 2rem;
      max-width: 48rem;
    }

    /* Headings */
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      font-weight: 600;
      line-height: 1.25;
    }

    h1 { font-size: 2em; padding-bottom: 0.3em; border-bottom: 1px solid #333; }
    h2 { font-size: 1.5em; padding-bottom: 0.3em; border-bottom: 1px solid #333; }
    h3 { font-size: 1.25em; }
    h4 { font-size: 1em; }
    h5 { font-size: 0.875em; }
    h6 { font-size: 0.85em; opacity: 0.7; }

    /* Paragraphs */
    p {
      margin-top: 0;
      margin-bottom: 1em;
    }

    /* Links */
    a {
      color: #58a6ff;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    /* Lists */
    ul, ol {
      padding-left: 2em;
      margin-top: 0;
      margin-bottom: 1em;
    }

    li + li {
      margin-top: 0.25em;
    }

    /* Inline code */
    code {
      font-family: inherit;
      font-size: 85%;
      background-color: rgba(255, 255, 255, 0.1);
      padding: 0.2em 0.4em;
      border-radius: 4px;
    }

    /* Code blocks */
    pre {
      background-color: rgba(255, 255, 255, 0.05);
      border: 1px solid #333;
      border-radius: 6px;
      padding: 1em;
      overflow-x: auto;
      margin-top: 0;
      margin-bottom: 1em;
    }

    pre code {
      background-color: transparent;
      padding: 0;
      font-size: 95%;
      line-height: 1.45;
      white-space: pre;
    }

    /* Blockquotes */
    blockquote {
      margin: 0 0 1em 0;
      padding: 0 1em;
      opacity: 0.8;
      border-left: 0.25em solid #444;
    }

    blockquote > :first-child { margin-top: 0; }
    blockquote > :last-child { margin-bottom: 0; }

    /* Horizontal rule */
    hr {
      height: 1px;
      padding: 0;
      margin: 1.5em 0;
      background-color: #333;
      border: 0;
    }

    /* Tables */
    table {
      border-spacing: 0;
      border-collapse: collapse;
      margin-top: 0;
      margin-bottom: 1em;
      width: max-content;
      max-width: 100%;
      overflow: auto;
    }

    th, td {
      padding: 6px 13px;
      border: 1px solid #333;
    }

    th {
      font-weight: 600;
      background-color: rgba(255, 255, 255, 0.05);
    }

    tr:nth-child(2n) {
      background-color: rgba(255, 255, 255, 0.03);
    }

    /* Images */
    img {
      max-width: 100%;
      height: auto;
    }

    /* Task lists */
    input[type="checkbox"] {
      margin-right: 0.5em;
    }

    h1:first-child {
      margin-top: 0;
    }
  </style>
</head>
<body>
${content}
</body>
</html>`;

const html = htmlTemplate(marked.parse(docs) as string);

function isCliRequest(request: NextRequest): boolean {
  const userAgent = request.headers.get("user-agent") || "";
  const cliAgents = [
    "curl",
    "wget",
    "httpie",
    "http",
    "python-requests",
    "go-http-client",
  ];
  return cliAgents.some((agent) => userAgent.toLowerCase().includes(agent));
}

export async function GET(request: NextRequest) {
  const accept = request.headers.get("accept") || "";

  if (accept.includes("text/plain") || isCliRequest(request)) {
    return new NextResponse(docs, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
