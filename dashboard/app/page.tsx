"use client";

import { useEffect, useState } from "react";

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

const API = "http://127.0.0.1:8000";

export default function Home() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guardianMode, setGuardianMode] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [healthResponse, summaryResponse, transactionsResponse, forecastResponse] =
          await Promise.all([
            fetch(`${API}/health`),
            fetch(`${API}/optimize/summary`),
            fetch(`${API}/optimize/transactions`),
            fetch(`${API}/optimize/forecast`),
          ]);

        if (
          !healthResponse.ok ||
          !summaryResponse.ok ||
          !transactionsResponse.ok ||
          !forecastResponse.ok
        ) {
          throw new Error("API request failed");
        }

        const summaryData = await summaryResponse.json();
        const transactionData = await transactionsResponse.json();
        const forecastData = await forecastResponse.json();

        setSummary(summaryData);
        setTransactions(transactionData);
        setForecast(forecastData);
        setConnected(true);
      } catch (error) {
        console.error(error);
        setConnected(false);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

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
          <div className="brand-icon">◆</div>

          <div>
            <h1>Financial Guardian</h1>
            <p>Protect. Understand. Optimize.</p>
          </div>
        </div>

        <div className="header-actions">
          <div className={`api-status ${connected ? "online" : "offline"}`}>
            <span />
            {connected ? "Guardian Online" : "Guardian Offline"}
          </div>

          <button
            className={`guardian-toggle ${guardianMode ? "enabled" : ""}`}
            onClick={() => setGuardianMode(!guardianMode)}
          >
            <span className="toggle-dot" />

            <div>
              <strong>Guardian Mode</strong>
              <small>{guardianMode ? "ON" : "OFF"}</small>
            </div>
          </button>
        </div>
      </header>

      <section className="hero">
        <div>
          <span className="eyebrow">FINANCIAL COMMAND CENTER</span>

          <h2>Your money, protected and optimized.</h2>

          <p>
            One intelligence layer for scam protection, spending visibility,
            deductions and cash-flow planning.
          </p>
        </div>

        <div className="hero-shield">
          <span>◆</span>
          <strong>SHIELD ACTIVE</strong>
          <small>Financial protection enabled</small>
        </div>
      </section>

      {!connected && (
        <div className="offline-warning">
          FastAPI is unavailable. Start the backend at
          http://127.0.0.1:8000 and refresh this page.
        </div>
      )}

      <section className="metrics">
        <MetricCard
          title="Monthly Income"
          value={money(summary?.monthly_income)}
          detail="Current month"
          icon="↗"
        />

        <MetricCard
          title="Monthly Expenses"
          value={money(summary?.monthly_expenses)}
          detail="Tracked spending"
          icon="↘"
        />

        <MetricCard
          title="Estimated Tax"
          value={money(summary?.estimated_quarterly_tax)}
          detail="Quarterly estimate"
          icon="⌁"
        />

        <MetricCard
          title="Deductions Found"
          value={money(summary?.deductions_found)}
          detail={`${money(summary?.potential_tax_savings)} potential savings`}
          icon="✓"
          highlight
        />
      </section>

      <section className="module-grid">
        <article className="module-card shield-module">
          <div className="module-heading">
            <div className="module-icon">◆</div>

            <div>
              <span>SHIELD</span>
              <h3>Scam Protection</h3>
            </div>

            <div className="active-pill">ACTIVE</div>
          </div>

          <p>
            Guardian analyzes financial emails and messages before you act.
          </p>

          <div className="shield-status">
            <div className="pulse-ring">
              <div>✓</div>
            </div>

            <div>
              <strong>Protection running</strong>
              <span>Chrome extension connected</span>
            </div>
          </div>

          <div className="module-footer">
            <span>Gmail scanning</span>
            <strong>Enabled</strong>
          </div>
        </article>

        <article className="module-card optimize-module">
          <div className="module-heading">
            <div className="module-icon">↗</div>

            <div>
              <span>OPTIMIZE</span>
              <h3>Cash Flow Forecast</h3>
            </div>

            <div className="positive-pill">
              {forecast?.cash_flow_status || "—"}
            </div>
          </div>

          <p>
            Understand where your money is heading before the next month.
          </p>

          <div className="forecast">
            <div>
              <span>Current balance</span>
              <strong>{money(forecast?.current_balance)}</strong>
            </div>

            <div className="forecast-arrow">→</div>

            <div>
              <span>30-day projection</span>
              <strong>{money(forecast?.projected_30_day_balance)}</strong>
            </div>
          </div>

          <div className="module-footer">
            <span>Projected net cash flow</span>

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

          {transactions.map((transaction) => (
            <div className="transaction-row" key={transaction.id}>
              <div className="merchant">
                <div>
                  {transaction.merchant.charAt(0).toUpperCase()}
                </div>

                <strong>{transaction.merchant}</strong>
              </div>

              <span>{transaction.category}</span>

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
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(transaction.amount)}
              </strong>
            </div>
          ))}
        </div>
      </section>

      <section className="insight-card">
        <div className="insight-icon">✦</div>

        <div>
          <span>GUARDIAN INSIGHT</span>

          <h3>
            Potential savings identified:{" "}
            {money(summary?.potential_tax_savings)}
          </h3>

          <p>
            Guardian found deductible business expenses in your recent
            transactions. Review them before your next tax estimate.
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
    <article className={`metric-card ${highlight ? "highlight" : ""}`}>
      <div className="metric-top">
        <span>{title}</span>
        <div>{icon}</div>
      </div>

      <strong className="metric-value">{value}</strong>
      <small>{detail}</small>
    </article>
  );
}