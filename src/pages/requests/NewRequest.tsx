import { Icon, Button } from "../../components/ui";
import { formTypes } from "../../data/initialData";

export function NewRequest({ select }: { select: (type: string) => void }) {
  return (
    <>
      <div className="intro">
        <span className="eyebrow">Start a request</span>
        <h2>Which document do you need?</h2>
        <p>
          Select a university form to begin. You can review all information
          before submitting.
        </p>
      </div>
      <div className="form-cards">
        {formTypes.map((f, i) => (
          <article className="form-card" key={f.title}>
            <div className={`form-illustration ${f.accent}`}>
              <Icon
                name={i === 2 ? "clock" : i === 1 ? "rotate" : "file"}
                size={28}
              />
              <span>{String(i + 1).padStart(2, "0")}</span>
            </div>
            <small>{f.meta}</small>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
            <Button variant="secondary" onClick={() => select(f.title)}>
              Start request <Icon name="arrow" size={16} />
            </Button>
          </article>
        ))}
      </div>
      <div className="info-banner">
        <div>
          <Icon name="check" />
        </div>
        <p>
          <strong>Your progress is protected.</strong>
          <span>
            All submitted information is used only for university document
            processing. You can cancel before final submission.
          </span>
        </p>
      </div>
    </>
  );
}
