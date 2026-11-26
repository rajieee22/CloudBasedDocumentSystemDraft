import type { SubjectRow } from "../../../types";
import { Button, Field, Icon } from "../../../components/ui";

export function SubjectEditor({ kind, rows, update }: { kind: "withdraw" | "add"; rows: SubjectRow[]; update: (rows: SubjectRow[]) => void }) {
  const change = (index: number, field: keyof SubjectRow, value: string | boolean) => update(rows.map((row, i) => i === index ? { ...row, [field]: value } : row));
  return <div className="subject-editor">
    <div className="subject-editor-head"><div><h4>{kind === "withdraw" ? "Withdraw subjects" : "Add subjects"}</h4><p>{kind === "withdraw" ? "Controller and professor signatures are completed by authorized personnel." : "Controller and closed-subject instructor approvals are completed by authorized personnel."}</p></div><Button variant="secondary" icon="plus" onClick={() => update([...rows, { course: "", title: "", units: "", closed: false }])}>Add row</Button></div>
    {rows.map((row, index) => <div className="subject-row" key={`${kind}-${index}`}>
      <div className="subject-row-number">{index + 1}</div>
      <div className="subject-fields">
        <Field label="Course number and section" required><input value={row.course} onChange={e => change(index, "course", e.target.value)} placeholder="e.g. IT 141 – A"/></Field>
        <Field label="Course title" required><input value={row.title} onChange={e => change(index, "title", e.target.value)} placeholder="Official course title"/></Field>
        <Field label="Units" required><input type="number" min="0" value={row.units} onChange={e => change(index, "units", e.target.value)} placeholder="3"/></Field>
        {kind === "add" && <label className="check-field"><input type="checkbox" checked={!!row.closed} onChange={e => change(index, "closed", e.target.checked)}/><span>Closed subject</span></label>}
      </div>
      <div className="readonly-signatures">
        <span><Icon name="pen" size={14}/> Controller signature <b>University personnel only</b></span>
        <span><Icon name="pen" size={14}/> {kind === "withdraw" ? "Professor signature" : "Instructor approval for closed subject"} <b>{kind === "add" && !row.closed ? "Not applicable" : "University personnel only"}</b></span>
      </div>
      {rows.length > 1 && <button className="remove-row" type="button" onClick={() => update(rows.filter((_, i) => i !== index))}><Icon name="x" size={14}/> Remove</button>}
    </div>)}
  </div>;
}
