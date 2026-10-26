import { useCallback, useEffect, useRef, useState } from "react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Field from "../components/ui/Field";
import Modal from "../components/ui/Modal";
import Skeleton from "../components/ui/Skeleton";
import Slider from "../components/ui/Slider";
import Switch from "../components/ui/Switch";

const TASK_COLORS = [
  ["Course", "var(--color-course)"],
  ["Exam", "var(--color-exam)"],
  ["Homework", "var(--color-homework)"],
  ["Custom", "var(--color-custom)"],
];

export default function UiPage() {
  const [theme, setTheme] = useState("light");
  const [switchOn, setSwitchOn] = useState(true);
  const [sliderValue, setSliderValue] = useState(11);
  const [modalOpen, setModalOpen] = useState(false);
  const previousTheme = useRef(document.documentElement.dataset.theme);
  const closeModal = useCallback(() => setModalOpen(false), []);

  useEffect(() => {
    const originalTheme = previousTheme.current;
    document.documentElement.dataset.theme = theme;
    return () => {
      if (originalTheme === undefined) {
        delete document.documentElement.dataset.theme;
      } else {
        document.documentElement.dataset.theme = originalTheme;
      }
    };
  }, [theme]);

  return (
    <main className="ui-catalog">
      <header className="ui-catalog__header">
        <div className="ui-catalog__row">
          <Badge variant="accent">Development only</Badge>
          <Button
            size="sm"
            onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
          >
            Preview {theme === "light" ? "dark" : "light"} theme
          </Button>
        </div>
        <h1>KADRAN design system</h1>
        <p>
          Shared tokens and accessible UI primitives. Use this page to review
          components before migrating existing screens.
        </p>
      </header>

      <div className="ui-catalog__grid">
        <section className="ui-catalog__card" aria-labelledby="ui-buttons">
          <h2 id="ui-buttons">Buttons</h2>
          <div className="ui-catalog__row">
            <Button variant="primary">Primary</Button>
            <Button>Secondary</Button>
            <Button variant="danger">Danger</Button>
            <Button size="sm">Small</Button>
            <Button disabled>Disabled</Button>
          </div>
        </section>

        <section className="ui-catalog__card" aria-labelledby="ui-fields">
          <h2 id="ui-fields">Field</h2>
          <Field
            label="Course name"
            htmlFor="ui-course-name"
            hint="Shown on your calendar and task list."
          >
            <input
              className="ui-field__control"
              id="ui-course-name"
              defaultValue="Introduction to Computer Science"
            />
          </Field>
          <Field label="Example validation" htmlFor="ui-invalid" error="Enter a valid value.">
            <input
              className="ui-field__control"
              id="ui-invalid"
              aria-invalid="true"
              defaultValue="?"
            />
          </Field>
        </section>

        <section className="ui-catalog__card" aria-labelledby="ui-switch">
          <h2 id="ui-switch">Switch and slider</h2>
          <Switch
            label="Compact empty hours"
            description="Reduce unused calendar space."
            checked={switchOn}
            onChange={setSwitchOn}
          />
          <Slider
            label="Calendar day starts at"
            min={0}
            max={23}
            value={sliderValue}
            onChange={setSliderValue}
            formatValue={(value) => `${String(value).padStart(2, "0")}:00`}
          />
        </section>

        <section className="ui-catalog__card" aria-labelledby="ui-badges">
          <h2 id="ui-badges">Badges and task colors</h2>
          <div className="ui-catalog__row">
            <Badge>Medium priority</Badge>
            <Badge variant="accent">Course</Badge>
            <Badge variant="danger">High priority</Badge>
          </div>
          {TASK_COLORS.map(([label, color]) => (
            <div className="ui-catalog__type" key={label}>
              <span className="ui-catalog__swatch" style={{ background: `rgb(${color})` }} />
              {label}
            </div>
          ))}
        </section>

        <section className="ui-catalog__card" aria-labelledby="ui-loading">
          <h2 id="ui-loading">Loading skeletons</h2>
          <Skeleton height={20} width="72%" />
          <Skeleton height={14} width="94%" />
          <Skeleton height={14} width="58%" />
          <Skeleton height={68} />
        </section>

        <section className="ui-catalog__card" aria-labelledby="ui-modal">
          <h2 id="ui-modal">Modal</h2>
          <p className="ui-field__hint">
            Supports Escape, backdrop dismissal, focus trapping, and focus restoration.
          </p>
          <div>
            <Button variant="primary" onClick={() => setModalOpen(true)}>
              Open accessible modal
            </Button>
          </div>
        </section>
      </div>

      <Modal
        open={modalOpen}
        title="A reusable modal"
        description="Focus is moved into the dialog and returned to the trigger when it closes."
        onClose={closeModal}
        footer={
          <>
            <Button onClick={closeModal}>Cancel</Button>
            <Button variant="primary" onClick={closeModal} data-autofocus>
              Done
            </Button>
          </>
        }
      >
        <Field label="Task title" htmlFor="ui-modal-title">
          <input
            className="ui-field__control"
            id="ui-modal-title"
            defaultValue="Review lecture notes"
          />
        </Field>
      </Modal>
    </main>
  );
}
