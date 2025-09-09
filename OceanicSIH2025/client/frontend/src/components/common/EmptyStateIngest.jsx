import ProviderButtons from '../Dashboard/ProviderButtons'

export default function EmptyStateIngest({ title = 'No data available', description = 'Ingest the relevant provider to load data.', onAfterIngest }) {
  return (
    <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/40">
      <div className="mb-3">
        <div className="text-slate-100 font-semibold">{title}</div>
        <div className="text-slate-400 text-sm">{description}</div>
      </div>
      <ProviderButtons onAfterIngest={onAfterIngest} />
    </div>
  )
}


