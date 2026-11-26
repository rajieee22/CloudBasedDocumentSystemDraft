import type { LoadRevisionPermit } from "../../../types"
import { Icon } from "../../../components/ui"

export function PermitProgress({ permit }: { permit: LoadRevisionPermit }) {
  const slots = [
    ...permit.withdraw.flatMap((_, i) => [
      `Withdraw Controller ${i + 1}`,
      `Withdraw Professor ${i + 1}`,
    ]),
    ...permit.add.flatMap((row, i) => [
      `Add Controller ${i + 1}`,
      ...(row.closed ? [`Closed Instructor ${i + 1}`] : []),
    ]),
    "Professor",
    "Adviser",
    "Chairperson",
    "Dean",
    "Registrar",
  ]
  return (
    <section className="card permit-progress">
      <div>
        <span className="eyebrow">FM-MSU-IIT-RGTR-008</span>
        <h3>Permit signature status</h3>
        <p>
          Signature availability follows university-configured routing; no fixed
          order is represented.
        </p>
      </div>
      <div>
        {slots.map((slot) => (
          <span
            className={permit.signatures[slot] ? "complete" : ""}
            key={slot}
          >
            <Icon
              name={permit.signatures[slot] ? "check" : "clock"}
              size={13}
            />
            <b>{slot}</b>
            <small>{permit.signatures[slot] || "Pending"}</small>
          </span>
        ))}
      </div>
    </section>
  )
}
