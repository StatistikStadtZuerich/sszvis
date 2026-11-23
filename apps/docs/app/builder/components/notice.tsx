import { typefaceCodeLabel, typefaceMeta } from "~/components/tokens/typeface";

export const Notice = ({
  title,
  body,
  className,
  alert = false,
}: {
  readonly title: string;
  readonly body?: string | null;
  readonly className?: string;
  readonly alert?: boolean;
}) => (
  <div className={className} role={alert ? "alert" : undefined}>
    <p className={typefaceMeta()}>{title}</p>
    {body != null && (
      <p className={typefaceCodeLabel("mt-1 wrap-break-word text-destructive")}>{body}</p>
    )}
  </div>
);
