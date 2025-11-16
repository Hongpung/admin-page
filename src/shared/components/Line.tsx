type LineProps = {
  className?: string;
};

export default function Line({ className }: LineProps) {
  return (
    <hr
      aria-hidden="true"
      className={`w-full border-0 border-t border-neutral-200 ${className ?? ""}`.trim()}
    />
  );
}
