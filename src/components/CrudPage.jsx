// Page générique de back-office : liste + ajout / modification / suppression
import { useMemo, useState } from 'react';
import { api } from '../api.js';
import { useFetch } from '../hooks.js';
import { ErrorBox, Loading, Modal, PageHead } from './ui.jsx';

function Field({ f, value, onChange, isEdit }) {
  const common = { id: f.key, value: value ?? '', onChange: (e) => onChange(e.target.value), required: f.required && !(isEdit && f.type === 'password') };
  let input;
  if (f.type === 'select') {
    input = (
      <select {...common}>
        {!f.required && <option value="">—</option>}
        {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  } else if (f.type === 'textarea') {
    input = <textarea {...common} />;
  } else if (f.type === 'checkbox') {
    return (
      <div className="field">
        <label className="check">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} /> {f.label}
        </label>
      </div>
    );
  } else {
    input = <input type={f.type || 'text'} {...common} min={f.min} step={f.step} autoComplete={f.type === 'password' ? 'new-password' : 'off'} />;
  }
  return (
    <div className="field" style={f.full ? { gridColumn: '1 / -1' } : undefined}>
      <label htmlFor={f.key}>{f.label}{f.required && !(isEdit && f.type === 'password') ? ' *' : ''}</label>
      {input}
      {(isEdit && f.editHint) || f.hint ? <div className="hint">{(isEdit && f.editHint) || f.hint}</div> : null}
    </div>
  );
}

export default function CrudPage({
  title, subtitle, endpoint, listUrl, columns, fields, defaults = {}, singular = 'élément',
  searchKeys = [], filters, transformBeforeSave, extraToolbar,
}) {
  const { data, error, loading, reload } = useFetch(listUrl || endpoint);
  const [edit, setEdit] = useState(null); // objet en cours d'édition (id absent = création)
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('');
  const [msg, setMsg] = useState(null);

  const rows = useMemo(() => {
    let r = data || [];
    if (filter && filters) r = r.filter(filters.find((f) => f.value === filter).test);
    if (q) {
      const s = q.toLowerCase();
      r = r.filter((row) => searchKeys.some((k) => String(row[k] ?? '').toLowerCase().includes(s)));
    }
    return r;
  }, [data, q, filter, filters, searchKeys]);

  const open = (row) => {
    setFormError(null);
    setEdit(row ? { ...row } : { ...defaults });
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const payload = {};
      for (const f of fields) {
        if (f.type === 'password' && !edit[f.key]) continue;
        if (f.showIf && !f.showIf(edit)) continue;
        payload[f.key] = edit[f.key];
      }
      const body = transformBeforeSave ? transformBeforeSave(payload, edit) : payload;
      if (edit.id) await api.put(`${endpoint}/${edit.id}`, body);
      else await api.post(endpoint, body);
      setEdit(null);
      setMsg(`${singular[0].toUpperCase() + singular.slice(1)} enregistré(e).`);
      reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Supprimer cet(te) ${singular} ?`)) return;
    try {
      const r = await api.del(`${endpoint}/${row.id}`);
      setMsg(r.message || `${singular} supprimé(e).`);
      reload();
    } catch (err) {
      setMsg(null);
      window.alert(err.message);
    }
  };

  return (
    <>
      <PageHead title={title} subtitle={subtitle}>
        <button className="btn primary" onClick={() => open(null)}>+ Ajouter</button>
      </PageHead>
      {msg && <div className="success-msg" onClick={() => setMsg(null)}>{msg}</div>}
      <div className="toolbar">
        {searchKeys.length > 0 && <input placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />}
        {filters && (
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Tous</option>
            {filters.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        )}
        {extraToolbar}
        <span className="small">{rows.length} élément(s)</span>
      </div>
      <ErrorBox error={error} />
      {loading ? <Loading /> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {columns.map((c) => <th key={c.label} className={c.num ? 'num' : ''}>{c.label}</th>)}
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} style={row.actif === false ? { opacity: 0.55 } : undefined}>
                  {columns.map((c) => (
                    <td key={c.label} className={c.num ? 'num' : ''}>{c.render ? c.render(row) : row[c.key] ?? '—'}</td>
                  ))}
                  <td>
                    <div className="actions" style={{ justifyContent: 'flex-end' }}>
                      <button className="btn sm" onClick={() => open(row)}>Modifier</button>
                      <button className="btn sm ghost" style={{ color: 'var(--danger)' }} onClick={() => remove(row)}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={columns.length + 1} className="empty">Aucun élément</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {edit && (
        <Modal
          title={edit.id ? `Modifier : ${singular}` : `Ajouter : ${singular}`}
          onClose={() => setEdit(null)}
          footer={
            <>
              <button className="btn" onClick={() => setEdit(null)}>Annuler</button>
              <button className="btn primary" form="crud-form" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
            </>
          }
        >
          <ErrorBox error={formError} />
          <form id="crud-form" onSubmit={save} className="form-grid">
            {fields
              .filter((f) => !f.showIf || f.showIf(edit))
              .map((f) => (
                <Field key={f.key} f={f} isEdit={!!edit.id} value={edit[f.key]} onChange={(v) => setEdit((o) => ({ ...o, [f.key]: v }))} />
              ))}
          </form>
        </Modal>
      )}
    </>
  );
}
