"use client";

import { useState } from "react";
import { ApiError, bff, bffBlob } from "@/lib/api";
import type { Envelope, FieldDetail, ImportResult } from "@/lib/types";
import { ruleText, useI18n } from "@/i18n/provider";
import { Dialog } from "./Dialog";

// The API reports "row 3 password" as the field of a problem; split it into row and column for the table.
function splitField(field: string): { row: string; column: string } {
  const m = /^row (\d+)\s*(.*)$/.exec(field);
  return m ? { row: m[1] ?? "", column: m[2] ?? "" } : { row: "", column: field };
}

export function ImportDialog({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const { t, errorText } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [checked, setChecked] = useState<ImportResult | null>(null);
  const [done, setDone] = useState<ImportResult | null>(null);
  const [problems, setProblems] = useState<FieldDetail[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"check" | "run" | null>(null);

  function reset(next: File | null) {
    setFile(next);
    setChecked(null);
    setDone(null);
    setProblems([]);
    setError(null);
  }

  async function downloadTemplate() {
    try {
      const blob = await bffBlob("users/import/template");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "users-template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function send(dryRun: boolean) {
    if (!file) return;
    setBusy(dryRun ? "check" : "run");
    setError(null);
    setProblems([]);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await bff<Envelope<ImportResult>>(`users/import${dryRun ? "?dry_run=true" : ""}`, {
        method: "POST",
        body,
      });
      if (dryRun) {
        setChecked(res.data);
      } else {
        setDone(res.data);
        onImported();
      }
    } catch (err) {
      setChecked(null);
      if (err instanceof ApiError && err.code === "validation_failed" && err.details.length > 0) {
        setProblems(err.details);
      } else {
        setError(errorText(err));
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={t("import.title")}>
      <p className="muted">{t("import.help")}</p>

      <div className="row">
        <button type="button" className="btn btn-sm" onClick={downloadTemplate}>
          {t("import.template")}
        </button>
      </div>

      <div className="field">
        <label htmlFor="import-file">{t("import.file")}</label>
        <input
          id="import-file"
          type="file"
          className="input"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => reset(e.target.files?.[0] ?? null)}
          style={{ padding: "8px 12px" }}
        />
      </div>

      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}
      {checked && (
        <div className="alert alert-ok" role="status">
          {t("import.okCheck", { rows: checked.rows })}
        </div>
      )}
      {done && (
        <div className="alert alert-ok" role="status">
          {t("import.okDone", { created: done.created })}
        </div>
      )}

      {problems.length > 0 && (
        <div role="alert" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h2>{t("import.problemsTitle")}</h2>
          <p className="muted">{t("import.problemsNote")}</p>
          <div className="table-wrap">
            <table className="mini-table">
              <thead>
                <tr>
                  <th>{t("import.row")}</th>
                  <th>{t("import.column")}</th>
                  <th>{t("import.rule")}</th>
                </tr>
              </thead>
              <tbody>
                {problems.map((p, i) => {
                  const { row, column } = splitField(p.field);
                  return (
                    <tr key={`${p.field}-${i}`}>
                      <td className="mono">{row}</td>
                      <td className="mono">{column}</td>
                      <td>
                        <span style={{ color: "var(--danger)", fontWeight: 510 }}>{p.rule}</span> · {ruleText(t, p.rule)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="muted">{t("import.deleteAfter")}</p>

      <div className="dialog-actions">
        <button type="button" className="btn" onClick={onClose}>
          {t("form.close")}
        </button>
        <button type="button" className="btn" onClick={() => send(true)} disabled={!file || busy !== null || done !== null}>
          {busy === "check" ? t("import.checking") : t("import.check")}
        </button>
        <button type="button" className="btn btn-primary" onClick={() => send(false)} disabled={!checked || busy !== null || done !== null}>
          {busy === "run" ? t("import.running") : t("import.run")}
        </button>
      </div>
    </Dialog>
  );
}
