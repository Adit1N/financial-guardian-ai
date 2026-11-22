"use client";

import { useCallback, useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

interface Summary {
  monthly_income: number;
  monthly_expenses: number;
  estimated_quarterly_tax: number;
  deductions_found: number;
  potential_tax_savings: number;
}

interface Transaction {
  id: number;
  merchant: string;
  amount: number;
  category: string;
  deductible: boolean;
}

interface Forecast {
  current_balance: number;
  projected_30_day_balance: number;
  projected_income: number;
  projected_expenses: number;
  cash_flow_status: string;
}

interface ShieldScan {
  id: number;
  timestamp: string;
  source: string;
  preview: string;
  label: "SAFE" | "SUSPICIOUS" | "SCAM";
  confidence: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
}

interface ShieldHistory {
  total: number;
  scams: number;
  suspicious: number;
  safe: number;
  scans: ShieldScan[];
}

export default function Home() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [forecast, setForecast] = useState<Forecast | null>(null);

  const [shieldHistory, setShieldHistory] =
    useState<ShieldHistory | null>(null);

  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guardianMode, setGuardianMode] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    }

    try {
      const [
        healthResponse,
        summaryResponse,
        transactionsResponse,
        forecastResponse,
        historyResponse,
      ] = await Promise.all([
        fetch(`${API}/health`, {
          cache: "no-store",
        }),

        fetch(`${API}/optimize/summary`, {
          cache: "no-store",
        }),

        fetch(`${API}/optimize/transactions`, {
          cache: "no-store",
        }),

        fetch(`${API}/optimize/forecast`, {
          cache: "no-store",
        }),

        fetch(`${API}/shield/history`, {
          cache: "no-store",
        }),
      ]);

      if (
        !healthResponse.ok ||
        !summaryResponse.ok ||
        !transactionsResponse.ok ||
        !forecastResponse.ok ||
        !historyResponse.ok
      ) {
        throw new Error("Guardian API request failed.");
      }

      const summaryData: Summary =
        await summaryResponse.json();

      const transactionData: Transaction[] =
        await transactionsResponse.json();

      const forecastData: Forecast =
        await forecastResponse.json();

      const historyData: ShieldHistory =
        await historyResponse.json();

      setSummary(summaryData);
      setTransactions(transactionData);
      setForecast(forecastData);
      setShieldHistory(historyData);

      setConnected(true);
    } catch (error) {
      console.error(error);
      setConnected(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();

    const interval = window.setInterval(() => {
      loadDashboard();
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadDashboard]);

  function money(value?: number) {
    if (value === undefined) {
      return "—";
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  }

  function riskIcon(label: ShieldScan["label"]) {
    if (label === "SCAM") {
      return "🔴";
    }

    if (label === "SUSPICIOUS") {
      return "🟡";
    }

    return "🟢";
  }

  function scanTime(timestamp: string) {
    try {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }

  if (loading) {
    return (
      <main className="loading-screen">
        <div className="loader" />

        <h2>Financial Guardian</h2>

        <p>Loading your financial intelligence...</p>
      </main>
    );
  }

  return (
    <main className="dashboard">

      <header className="topbar">

        <div className="brand">
          <div className="brand-icon">
            ◆
          </div>

          <div>
            <h1>Financial Guardian</h1>

            <p>
              Protect. Understand. Optimize.
            </p>
          </div>
        </div>


        <div className="header-actions">

          <div
            className={`api-status ${
              connected ? "online" : "offline"
            }`}
          >
            <span />

            {connected
              ? "Guardian Online"
              : "Guardian Offline"}
          </div>


          <button
            className="refresh-button"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
          >
            {refreshing
              ? "Refreshing..."
              : "↻ Refresh"}
          </button>


          <button
            className={`guardian-toggle ${
              guardianMode ? "enabled" : ""
            }`}
            onClick={() =>
              setGuardianMode(!guardianMode)
            }
          >
            <span className="toggle-dot" />

            <div>
              <strong>Guardian Mode</strong>

              <small>
                {guardianMode ? "ON" : "OFF"}
              </small>
            </div>
          </button>

        </div>

      </header>


      <section className="hero">

        <div>
          <span className="eyebrow">
            FINANCIAL COMMAND CENTER
          </span>

          <h2>
            Your money, protected and optimized.
          </h2>

          <p>
            Scam protection and financial intelligence
            working together through one Guardian.
          </p>
        </div>


        <div className="hero-shield">

          <span>◆</span>

          <strong>
            SHIELD ACTIVE
          </strong>

          <small>
            Gmail protection enabled
          </small>

        </div>

      </section>


      {!connected && (
        <div className="offline-warning">
          Guardian API is unavailable. Start FastAPI at
          http://127.0.0.1:8000 and refresh this page.
        </div>
      )}


      <section className="metrics">

        <MetricCard
          title="Threats Blocked"
          value={String(shieldHistory?.scams ?? 0)}
          detail={`${shieldHistory?.total ?? 0} total scans`}
          icon="◆"
          highlight
        />

        <MetricCard
          title="Monthly Income"
          value={money(summary?.monthly_income)}
          detail="Current month"
          icon="↗"
        />

        <MetricCard
          title="Estimated Tax"
          value={money(
            summary?.estimated_quarterly_tax
          )}
          detail="Quarterly estimate"
          icon="⌁"
        />

        <MetricCard
          title="Deductions Found"
          value={money(summary?.deductions_found)}
          detail={`${money(
            summary?.potential_tax_savings
          )} potential savings`}
          icon="✓"
          highlight
        />

      </section>


      <section className="module-grid">

        <article className="module-card shield-module">

          <div className="module-heading">

            <div className="module-icon">
              ◆
            </div>

            <div>
              <span>SHIELD</span>
              <h3>Protection Status</h3>
            </div>

            <div className="active-pill">
              ACTIVE
            </div>

          </div>


          <p>
            Financial Guardian analyzes suspicious
            emails and financial messages before you act.
          </p>


          <div className="shield-stat-grid">

            <div>
              <strong>
                {shieldHistory?.total ?? 0}
              </strong>
              <span>Total scans</span>
            </div>

            <div>
              <strong>
                {shieldHistory?.scams ?? 0}
              </strong>
              <span>Scams</span>
            </div>

            <div>
              <strong>
                {shieldHistory?.suspicious ?? 0}
              </strong>
              <span>Suspicious</span>
            </div>

            <div>
              <strong>
                {shieldHistory?.safe ?? 0}
              </strong>
              <span>Safe</span>
            </div>

          </div>


          <div className="module-footer">
            <span>Gmail scanning</span>
            <strong>Enabled</strong>
          </div>

        </article>


        <article className="module-card optimize-module">

          <div className="module-heading">

            <div className="module-icon">
              ↗
            </div>

            <div>
              <span>OPTIMIZE</span>
              <h3>Cash Flow Forecast</h3>
            </div>

            <div className="positive-pill">
              {forecast?.cash_flow_status || "—"}
            </div>

          </div>


          <p>
            Understand where your money is heading
            before the next month.
          </p>


          <div className="forecast">

            <div>
              <span>Current balance</span>

              <strong>
                {money(forecast?.current_balance)}
              </strong>
            </div>


            <div className="forecast-arrow">
              →
            </div>


            <div>
              <span>30-day projection</span>

              <strong>
                {money(
                  forecast?.projected_30_day_balance
                )}
              </strong>
            </div>

          </div>


          <div className="module-footer">

            <span>
              Projected net cash flow
            </span>

            <strong>
              {forecast
                ? money(
                    forecast.projected_income -
                      forecast.projected_expenses
                  )
                : "—"}
            </strong>

          </div>

        </article>

      </section>


      <section className="shield-history-card">

        <div className="section-heading">

          <div>
            <span>SHIELD ACTIVITY</span>
            <h2>Recent Security Scans</h2>
          </div>

          <div className="transaction-count">
            Auto-refreshes every 5 seconds
          </div>

        </div>


        <div className="scan-list">

          {!shieldHistory ||
          shieldHistory.scans.length === 0 ? (

            <div className="empty-scans">
              <div>◆</div>

              <strong>
                No scans yet
              </strong>

              <p>
                Scan an email using the Financial Guardian
                Chrome extension and it will appear here.
              </p>
            </div>

          ) : (

            shieldHistory.scans
              .slice(0, 6)
              .map((scan) => (

                <div
                  className={`scan-row ${scan.label.toLowerCase()}`}
                  key={scan.id}
                >

                  <div className="scan-risk-icon">
                    {riskIcon(scan.label)}
                  </div>


                  <div className="scan-main">

                    <div className="scan-title">

                      <strong>
                        {scan.source}
                      </strong>

                      <span>
                        {scanTime(scan.timestamp)}
                      </span>

                    </div>


                    <p>
                      {scan.preview}
                    </p>

                  </div>


                  <div className="scan-risk">

                    <strong>
                      {scan.label}
                    </strong>

                    <span>
                      {scan.risk_level} RISK
                    </span>

                  </div>


                  <div className="scan-confidence">
                    {Math.round(
                      scan.confidence * 100
                    )}%
                  </div>

                </div>

              ))

          )}

        </div>

      </section>


      <section className="transactions-card">

        <div className="section-heading">

          <div>
            <span>OPTIMIZE</span>
            <h2>Recent Transactions</h2>
          </div>

          <div className="transaction-count">
            {transactions.length} transactions
          </div>

        </div>


        <div className="transaction-table">

          <div className="table-header">
            <span>Merchant</span>
            <span>Category</span>
            <span>Tax status</span>
            <span>Amount</span>
          </div>


          {transactions.map(
            (transaction) => (

              <div
                className="transaction-row"
                key={transaction.id}
              >

                <div className="merchant">

                  <div>
                    {transaction.merchant
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <strong>
                    {transaction.merchant}
                  </strong>

                </div>


                <span>
                  {transaction.category}
                </span>


                <span
                  className={
                    transaction.deductible
                      ? "deductible"
                      : "not-deductible"
                  }
                >
                  {transaction.deductible
                    ? "✓ Deductible"
                    : "Personal"}
                </span>


                <strong className="amount">

                  {new Intl.NumberFormat(
                    "en-US",
                    {
                      style: "currency",
                      currency: "USD",
                    }
                  ).format(
                    transaction.amount
                  )}

                </strong>

              </div>

            )
          )}

        </div>

      </section>


      <section className="insight-card">

        <div className="insight-icon">
          ✦
        </div>

        <div>

          <span>
            GUARDIAN INSIGHT
          </span>

          <h3>
            Potential savings identified:{" "}
            {money(
              summary?.potential_tax_savings
            )}
          </h3>

          <p>
            Guardian identified deductible business
            expenses in your recent transactions.
          </p>

        </div>

      </section>


      <footer className="dashboard-footer">
        <span>Financial Guardian AI</span>
        <span>Shield + Optimize</span>
        <span>Hackathon Demo</span>
      </footer>

    </main>
  );
}


function MetricCard({
  title,
  value,
  detail,
  icon,
  highlight = false,
}: {
  title: string;
  value: string;
  detail: string;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <article
      className={`metric-card ${
        highlight ? "highlight" : ""
      }`}
    >
      <div className="metric-top">
        <span>{title}</span>
        <div>{icon}</div>
      </div>

      <strong className="metric-value">
        {value}
      </strong>

      <small>
        {detail}
      </small>
    </article>
  );
}