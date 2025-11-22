type Props = {
  label: string;
  value: string;
};

export function UserRoleSummaryRow({ label, value }: Props) {
  return (
    <div className="flex flex-row justify-between items-center mx-4 h-8">
      <div className="text-gray-400">{label}</div>
      <div className="min-w-20 text-right">{value}</div>
    </div>
  );
}
