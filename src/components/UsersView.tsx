"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { bff } from "@/lib/api";
import type { Envelope, Group, Me, Page, User } from "@/lib/types";
import { useI18n } from "@/i18n/provider";
import { AddUserDialog } from "./AddUserDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { ImportDialog } from "./ImportDialog";

const PER_PAGE = 20;

type StatusFilter = "" | "true" | "false";
type Pending = { kind: "delete" | "deactivate"; user: User } | null;

export function UsersView() {
  const { t, errorText } = useI18n();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>("");
  const [groupId, setGroupId] = useState("");
  const [username, setUsername] = useState(""); // applied value; the API only supports exact filters
  const [usernameDraft, setUsernameDraft] = useState("");

  const [data, setData] = useState<Page<User> | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [meId, setMeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [pending, setPending] = useState<Pending>(null);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  // Groups (for the filter and the group names) and the signed-in user (to hide actions on one's own row).
  useEffect(() => {
    const ctl = new AbortController();
    bff<Envelope<Page<Group>>>("groups?per_page=100&sort=name", { signal: ctl.signal })
      .then((r) => setGroups(r.data.data))
      .catch(() => undefined); // the table still works without group names
    bff<Me>("auth/me", { signal: ctl.signal })
      .then((r) => setMeId(r.user_id))
      .catch(() => undefined);
    return () => ctl.abort();
  }, []);

  useEffect(() => {
    const ctl = new AbortController();
    const params = new URLSearchParams({ page: String(page), per_page: String(PER_PAGE), sort: "-created_at" });
    if (status) params.set("is_active", status);
    if (groupId) params.set("group_id", groupId);
    if (username) params.set("username", username);

    setLoading(true);
    bff<Envelope<Page<User>>>(`users?${params.toString()}`, { signal: ctl.signal })
      .then((r) => {
        setData(r.data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (ctl.signal.aborted) return;
        setError(errorText(err));
      })
      .finally(() => {
        if (!ctl.signal.aborted) setLoading(false);
      });
    return () => ctl.abort();
    // errorText changes with the language; a language switch must not refetch the list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, groupId, username, reloadKey]);

  const groupName = useMemo(() => new Map(groups.map((g) => [g.group_id, g.name])), [groups]);

  function applyUsername(e: FormEvent) {
    e.preventDefault();
    setPage(1);
    setUsername(usernameDraft.trim());
  }

  function clearFilters() {
    setPage(1);
    setStatus("");
    setGroupId("");
    setUsername("");
    setUsernameDraft("");
  }

  async function setActive(user: User, active: boolean) {
    await bff(`users/${user.user_id}`, { method: "PATCH", body: JSON.stringify({ is_active: active }) });
    reload();
  }

  async function remove(user: User) {
    await bff(`users/${user.user_id}`, { method: "DELETE" });
    // Deleting the last row of the last page would leave an empty page behind.
    if (data && data.data.length === 1 && page > 1) setPage(page - 1);
    else reload();
  }

  const rows = data?.data ?? [];
  const total = data?.total_data ?? 0;
  const from = rows.length === 0 ? 0 : ((data?.curr_page ?? 1) - 1) * PER_PAGE + 1;
  const to = rows.length === 0 ? 0 : from + rows.length - 1;
  const filtered = Boolean(status || groupId || username);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t("users.title")}</h1>
          <p className="muted">{t("users.count", { n: total })}</p>
        </div>
        <div className="row">
          <button type="button" className="btn" onClick={() => setImportOpen(true)}>
            {t("users.import")}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setAddOpen(true)}>
            {t("users.add")}
          </button>
        </div>
      </div>

      <form className="row filters" onSubmit={applyUsername}>
        <div className="field">
          <label htmlFor="f-username">{t("users.filterUsername")}</label>
          <input
            id="f-username"
            className="input"
            value={usernameDraft}
            onChange={(e) => setUsernameDraft(e.target.value)}
            autoCapitalize="none"
            spellCheck={false}
          />
        </div>
        <div className="field">
          <label htmlFor="f-group">{t("users.group")}</label>
          <select
            id="f-group"
            className="select"
            value={groupId}
            onChange={(e) => {
              setPage(1);
              setGroupId(e.target.value);
            }}
          >
            <option value="">{t("users.allGroups")}</option>
            {groups.map((g) => (
              <option key={g.group_id} value={g.group_id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-status">{t("users.status")}</label>
          <select
            id="f-status"
            className="select"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value as StatusFilter);
            }}
          >
            <option value="">{t("users.allStatus")}</option>
            <option value="true">{t("users.active")}</option>
            <option value="false">{t("users.inactive")}</option>
          </select>
        </div>
        <button type="submit" className="btn">
          {t("users.filterApply")}
        </button>
        {filtered && (
          <button type="button" className="btn" onClick={clearFilters}>
            {t("users.filterClear")}
          </button>
        )}
      </form>

      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}

      <div className="table-wrap" aria-busy={loading}>
        <table className="users-table">
          <thead>
            <tr>
              <th>{t("users.name")}</th>
              <th>Username</th>
              <th>{t("users.group")}</th>
              <th>{t("users.status")}</th>
              <th className="num">{t("users.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const self = u.user_id === meId;
              return (
                <tr key={u.user_id}>
                  <td className="cell-name">
                    <strong>{u.name}</strong>
                    <span>{u.email}</span>
                  </td>
                  <td className="mono" data-label="Username">{u.username}</td>
                  <td className={u.group_id ? undefined : "muted"} data-label={t("users.group")}>
                    {u.group_id ? (groupName.get(u.group_id) ?? "…") : t("users.noGroup")}
                  </td>
                  <td data-label={t("users.status")}>
                    <span className={u.is_active ? "badge badge-ok" : "badge"}>
                      {u.is_active ? t("users.active") : t("users.inactive")}
                    </span>
                  </td>
                  <td className="num">
                    {self ? (
                      <span className="muted">{t("users.you")}</span>
                    ) : (
                      <div className="actions">
                        {u.is_active ? (
                          <button type="button" className="btn btn-sm" onClick={() => setPending({ kind: "deactivate", user: u })}>
                            {t("users.deactivate")}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() => setActive(u, true).catch((err: unknown) => setError(errorText(err)))}
                          >
                            {t("users.activate")}
                          </button>
                        )}
                        <button type="button" className="btn btn-sm btn-danger" onClick={() => setPending({ kind: "delete", user: u })}>
                          {t("users.delete")}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && rows.length === 0 && !error && <p className="empty">{t("users.empty")}</p>}
        {loading && rows.length === 0 && <p className="empty">{t("users.loading")}</p>}
      </div>

      <div className="pager">
        <span>{t("users.showing", { from, to, total })}</span>
        <div className="row">
          <button type="button" className="btn" disabled={!data?.prev_page || loading} onClick={() => data?.prev_page && setPage(data.prev_page)}>
            {t("users.prev")}
          </button>
          <button
            type="button"
            className="btn"
            disabled={!data || data.curr_page >= data.total_pages || loading}
            onClick={() => data && setPage(data.curr_page + 1)}
          >
            {t("users.next")}
          </button>
        </div>
      </div>

      {addOpen && <AddUserDialog open groups={groups} onClose={() => setAddOpen(false)} onCreated={reload} />}
      {importOpen && <ImportDialog open onClose={() => setImportOpen(false)} onImported={reload} />}
      {pending && (
        <ConfirmDialog
          open
          danger={pending.kind === "delete"}
          title={pending.kind === "delete" ? t("users.deleteTitle") : t("users.deactivateTitle")}
          body={t(pending.kind === "delete" ? "users.deleteBody" : "users.deactivateBody", {
            name: pending.user.name,
            username: pending.user.username,
          })}
          onClose={() => setPending(null)}
          onConfirm={() => (pending.kind === "delete" ? remove(pending.user) : setActive(pending.user, false))}
        />
      )}
    </>
  );
}
