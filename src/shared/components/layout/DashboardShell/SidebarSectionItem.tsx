type Props = {
  label: string;
  active: boolean;
  onClick: () => void;
  collapsed?: boolean;
};

export function SidebarSectionItem({
  label,
  active,
  onClick,
  collapsed = false,
}: Props) {
  const className = collapsed
    ? "w-full min-w-0 max-w-full cursor-pointer truncate rounded-md px-3 py-2 text-sm transition-colors"
    : active
      ? "w-full min-w-0 max-w-full cursor-pointer truncate rounded-md px-3 py-2 text-sm transition-colors bg-blue-100 text-blue-700 font-semibold"
      : "w-full min-w-0 max-w-full cursor-pointer truncate rounded-md px-3 py-2 text-sm transition-colors text-gray-600 hover:bg-gray-50";

  return (
    <li className={className} onClick={onClick}>
      {label}
    </li>
  );
}
