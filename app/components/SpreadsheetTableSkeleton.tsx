export const SpreadsheetTableSkeleton = () => (
  <div className="border border-emerald-900 rounded-lg overflow-hidden bg-white">
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-emerald-900 text-white">
          <th className="w-12 px-4 py-3" />
          <th className="text-left px-4 py-3 font-medium">Name</th>
          <th className="text-left px-4 py-3 font-medium">Description</th>
          <th className="text-right px-4 py-3 font-medium">Actions</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 6 }).map((_, i) => (
          <tr className="border-t border-emerald-900/20" key={i}>
            <td className="px-4 py-3">
              <div className="w-6 h-6 rounded bg-emerald-900/20 animate-pulse" />
            </td>
            <td className="px-4 py-3">
              <div className="h-4 w-32 rounded bg-emerald-900/20 animate-pulse" />
            </td>
            <td className="px-4 py-3">
              <div className="h-4 w-48 max-w-xs rounded bg-emerald-900/20 animate-pulse" />
            </td>
            <td className="px-4 py-3 text-right">
              <div className="flex gap-2 justify-end">
                <div className="h-4 w-12 rounded bg-emerald-900/20 animate-pulse" />
                <div className="h-4 w-10 rounded bg-emerald-900/20 animate-pulse" />
                <div className="h-4 w-10 rounded bg-emerald-900/20 animate-pulse" />
                <div className="h-4 w-12 rounded bg-emerald-900/20 animate-pulse" />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
