import { Monitor, MoveHorizontal, Smartphone, Tablet } from "lucide-react";
import { ToggleButton, ToggleButtonGroup } from "~/components/ui/toggle-button-group";

export const DEFAULT_WIDTH = 800;

const VIEWPORTS = [
  { id: "responsive", label: "Responsive", width: null, icon: MoveHorizontal },
  { id: "desktop", label: "Desktop", width: 1200, icon: Monitor },
  { id: "tablet", label: "Tablet", width: 768, icon: Tablet },
  { id: "mobile", label: "Mobile", width: 375, icon: Smartphone },
] as const;

export type ViewportId = (typeof VIEWPORTS)[number]["id"];

export const viewportWidth = (id: ViewportId) =>
  VIEWPORTS.find((viewport) => viewport.id === id)?.width ?? null;

export const ViewportToggle = ({
  value,
  onChange,
  disabled,
}: {
  readonly value: ViewportId;
  readonly onChange: (id: ViewportId) => void;
  readonly disabled?: boolean;
}) => (
  <ToggleButtonGroup
    aria-label="Preview width"
    value={value}
    onValueChange={onChange}
    disabled={disabled}
  >
    {VIEWPORTS.map(({ id, label, width, icon: Icon }) => (
      <ToggleButton
        key={id}
        value={id}
        title={
          width === null ? `Drag to resize — starts at ${DEFAULT_WIDTH}px` : `${label} — ${width}px`
        }
      >
        <Icon />
        <span className="hidden @[34rem]:inline">{label}</span>
      </ToggleButton>
    ))}
  </ToggleButtonGroup>
);
