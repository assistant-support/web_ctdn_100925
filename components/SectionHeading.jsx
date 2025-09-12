

export default function SectionHeading({ eyebrow, title, subtitle, align = 'center' }) {
    return (
        <div className={align === 'left' ? 'text-left' : 'text-center'}>
            {eyebrow && (
                <span className="inline-flex items-center rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand ring-1 ring-brand/20">
                    {eyebrow}
                </span>
            )}
            <h2 className="mt-3 text-2xl font-bold md:text-4xl text-slate-800">{title}</h2>
            {subtitle && <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 md:text-base">{subtitle}</p>}
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-brand/70" />
        </div>
    )
}
