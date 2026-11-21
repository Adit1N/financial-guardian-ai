/// <reference types="chrome" />

import { useState } from "react";
import "./App.css";

interface ScanResult {
  label: "SAFE" | "SUSPICIOUS" | "SCAM";
  confidence: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  category: string;
  explanation: string[];
  recommendation: string;
}

interface ExtractedContent {
  text: string;
  source: "gmail" | "webpage";
}

function App() {
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState("");
  const [source, setSource] = useState("");

  async function analyzeText(
    text: string,
    scanSource: string
  ) {
    if (!text.trim()) {
      setError("No text available to scan.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/shield/scan",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            text: text,
            source: scanSource
          })
        }
      );

      if (!response.ok) {
        throw new Error(
          "Guardian API request failed."
        );
      }

      const data: ScanResult =
        await response.json();

      setResult(data);

    } catch (error) {
      console.error(error);

      setError(
        "Guardian API is unavailable. Make sure FastAPI is running."
      );

    } finally {
      setLoading(false);
    }
  }


  async function scanMessage() {
    const text = message.trim();

    if (!text) {
      setError(
        "Please paste a message before scanning."
      );
      return;
    }

    setSource("Manual message");

    await analyzeText(
      text,
      "Manual message"
    );
  }


  async function scanCurrentPage() {
    setError("");
    setResult(null);
    setSource("");
    setPageLoading(true);

    try {
      const tabs =
        await chrome.tabs.query({
          active: true,
          currentWindow: true
        });

      const activeTab = tabs[0];

      if (!activeTab?.id) {
        throw new Error(
          "No active browser tab found."
        );
      }

      const url =
        activeTab.url || "";

      if (
        url.startsWith("chrome://") ||
        url.startsWith("edge://") ||
        url.startsWith("chrome-extension://")
      ) {
        throw new Error(
          "Chrome does not allow Guardian to scan this page."
        );
      }


      const results =
        await chrome.scripting.executeScript({
          target: {
            tabId: activeTab.id
          },

          func: (): ExtractedContent => {

            const hostname =
              window.location.hostname;


            // Gmail-specific extraction
            if (
              hostname.includes(
                "mail.google.com"
              )
            ) {

              const subjectElement =
                document.querySelector(
                  "h2.hP"
                );

              const senderElement =
                document.querySelector(
                  ".gD"
                );

              const emailBodies =
                document.querySelectorAll(
                  ".a3s.aiL"
                );


              const subject =
                subjectElement
                  ?.textContent
                  ?.trim() || "";


              const senderName =
                senderElement
                  ?.getAttribute("name") ||
                senderElement
                  ?.textContent
                  ?.trim() ||
                "";


              const senderEmail =
                senderElement
                  ?.getAttribute("email") ||
                "";


              let body = "";


              if (
                emailBodies.length > 0
              ) {

                const latestBody =
                  emailBodies[
                    emailBodies.length - 1
                  ];

                body =
                  latestBody
                    .textContent
                    ?.trim() || "";
              }


              const parts: string[] = [];


              if (
                senderName ||
                senderEmail
              ) {
                parts.push(
                  `Sender: ${senderName} ${senderEmail}`.trim()
                );
              }


              if (subject) {
                parts.push(
                  `Subject: ${subject}`
                );
              }


              if (body) {
                parts.push(
                  `Message:\n${body}`
                );
              }


              const emailText =
                parts.join("\n\n");


              if (
                emailText.trim()
              ) {
                return {
                  text: emailText,
                  source: "gmail"
                };
              }
            }


            // Generic webpage fallback
            return {
              text:
                document.body
                  ?.innerText || "",

              source: "webpage"
            };
          }
        });


      const extracted =
        results[0]
          ?.result as
          | ExtractedContent
          | undefined;


      if (
        !extracted
          ?.text
          ?.trim()
      ) {
        throw new Error(
          "No readable content was found on this page."
        );
      }


      // Prevent extremely large pages
      const limitedText =
        extracted.text.slice(
          0,
          15000
        );


      setMessage(
        limitedText
      );


      let scanSource =
        "Current webpage";


      if (
        extracted.source ===
        "gmail"
      ) {
        scanSource =
          "Gmail email";
      }


      setSource(
        scanSource
      );


      await analyzeText(
        limitedText,
        scanSource
      );

    } catch (error) {
      console.error(error);

      if (
        error instanceof Error
      ) {
        setError(
          error.message
        );
      } else {
        setError(
          "Guardian could not scan the current page."
        );
      }

    } finally {
      setPageLoading(false);
    }
  }


  function getRiskIcon() {
    if (!result) {
      return "";
    }

    if (
      result.label === "SAFE"
    ) {
      return "🟢";
    }

    if (
      result.label ===
      "SUSPICIOUS"
    ) {
      return "🟡";
    }

    return "🔴";
  }


  function getResultClass() {
    if (!result) {
      return "";
    }

    return result.label
      .toLowerCase();
  }


  return (
    <main className="guardian">

      <header className="header">

        <div className="logo">
          🛡️
        </div>

        <div>
          <h1>
            Financial Guardian
          </h1>

          <p>
            AI-powered financial protection
          </p>
        </div>

      </header>


      <section className="shield-badge">
        SHIELD MODE
      </section>


      <section className="scanner">

        <h2>
          Check financial content
        </h2>

        <p className="description">
          Scan an opened Gmail message,
          webpage, or paste suspicious text.
        </p>


        <button
          className="page-button"
          onClick={
            scanCurrentPage
          }
          disabled={
            loading ||
            pageLoading
          }
        >
          {pageLoading
            ? "📄 Reading Content..."
            : "🔍 Scan Current Page / Email"}
        </button>


        <div className="divider">

          <span></span>

          <p>OR</p>

          <span></span>

        </div>


        <textarea
          value={message}
          onChange={
            (event) =>
              setMessage(
                event.target.value
              )
          }
          placeholder="Paste suspicious email, SMS, invoice or payment request..."
        />


        <button
          className="scan-button"
          onClick={
            scanMessage
          }
          disabled={
            loading ||
            pageLoading
          }
        >
          {loading
            ? "Guardian is analyzing..."
            : "🛡️ Scan Message"}
        </button>


        {source && (
          <p className="scan-source">
            Source: {source}
          </p>
        )}


        {error && (
          <div className="error">
            {error}
          </div>
        )}

      </section>


      {loading && (
        <section className="loading-card">

          <div className="spinner">
          </div>

          <strong>
            Guardian is analyzing...
          </strong>

          <span>
            Checking financial scam indicators
          </span>

        </section>
      )}


      {result && (
        <section
          className={
            `result-card ${getResultClass()}`
          }
        >

          <div className="result-heading">

            <span className="risk-icon">
              {getRiskIcon()}
            </span>

            <div>
              <h2>
                {result.label}
              </h2>

              <span>
                {result.risk_level} RISK
              </span>
            </div>


            <div className="score">
              {Math.round(
                result.confidence *
                100
              )}%
            </div>

          </div>


          <div className="category">

            <span>
              Category
            </span>

            <strong>
              {result.category}
            </strong>

          </div>


          <div className="details">

            <h3>
              Why Guardian flagged this
            </h3>

            <ul>

              {result.explanation.map(
                (
                  item,
                  index
                ) => (

                  <li key={index}>
                    {item}
                  </li>

                )
              )}

            </ul>

          </div>


          <div className="recommendation">

            <h3>
              Recommended Action
            </h3>

            <p>
              {result.recommendation}
            </p>

          </div>

        </section>
      )}


      <footer>
        Financial Guardian AI • Shield
      </footer>

    </main>
  );
}

export default App;